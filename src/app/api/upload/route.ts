import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';
import { Readable } from 'stream';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = (formData.get('title') as string) || file.name.replace(/\.[^/.]+$/, "");
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Authenticate Google Drive API with user's personal OAuth token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken as string });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Find or create the "LinkNyter Audio" folder
    const masterFolderName = "LinkNyter Audio";
    let masterFolderId = null;

    const masterSearchRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${masterFolderName}' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
    });

    if (masterSearchRes.data.files && masterSearchRes.data.files.length > 0) {
      masterFolderId = masterSearchRes.data.files[0].id;
    } else {
      const folderRes = await drive.files.create({
        requestBody: { name: masterFolderName, mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
      });
      masterFolderId = folderRes.data.id;
    }

    // 2. Find or create the "audio" subfolder
    const subFolderName = "audio";
    let subFolderId = null;

    const subSearchRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${subFolderName}' and '${masterFolderId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
    });

    if (subSearchRes.data.files && subSearchRes.data.files.length > 0) {
      subFolderId = subSearchRes.data.files[0].id;
    } else {
      const folderRes = await drive.files.create({
        requestBody: { name: subFolderName, mimeType: 'application/vnd.google-apps.folder', parents: [masterFolderId as string] },
        fields: 'id',
      });
      subFolderId = folderRes.data.id;
    }

    // Enforce Free Tier 1-Track Limit ONLY for free users
    if (session.user?.plan === 'free' && session.user?.role !== 'admin' && subFolderId) {
      const filesRes = await drive.files.list({
        q: `'${subFolderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`,
        spaces: 'drive',
        fields: 'files(id)',
      });
      if (filesRes.data.files && filesRes.data.files.length >= 1) {
        return NextResponse.json({ error: 'Free Plan Limit Reached: You can only upload 1 track on the demo plan. Upgrade to Pro for unlimited uploads.' }, { status: 403 });
      }
    }

    // Convert Web File to Node Stream
    const buffer = await file.arrayBuffer();
    const stream = new Readable();
    stream.push(Buffer.from(buffer));
    stream.push(null);
    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: subFolderId ? [subFolderId] : undefined,
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id',
    });

    const driveFileId = driveResponse.data.id;
    if (!driveFileId) throw new Error('Failed to upload to Google Drive');

    // Make the file readable by anyone with the link so the proxy can stream it later
    await drive.permissions.create({
      fileId: driveFileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const slug = crypto.randomUUID().substring(0, 8); // Short slug for sharing

    // Save to Supabase
    const { data, error } = await supabase.from('tracks').insert({
      title,
      google_drive_file_id: driveFileId,
      slug,
      allow_downloads: false,
      user_email: session.user?.email
    }).select().single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to save to database: ' + error.message);
    }

    return NextResponse.json({ success: true, track: data });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
