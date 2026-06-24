import { NextResponse } from 'next/server';
import { google } from 'googleapis';
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
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
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

    // 2. Find or create the "cover art" subfolder
    const subFolderName = "cover art";
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
      fields: 'id, webContentLink',
    });

    const driveFileId = driveResponse.data.id;
    if (!driveFileId) throw new Error('Failed to upload to Google Drive');

    // Make the file readable by anyone with the link
    await drive.permissions.create({
      fileId: driveFileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // We use our Next.js backend proxy route to stream the image without CORB/403 errors
    const coverUrl = `/api/cover/${driveFileId}`;

    return NextResponse.json({ success: true, cover_url: coverUrl, drive_file_id: driveFileId });
  } catch (error: any) {
    console.error('Image Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
