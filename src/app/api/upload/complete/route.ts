import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { driveFileId, title } = await req.json();

    if (!driveFileId || !title) {
      return NextResponse.json({ error: 'Missing driveFileId or title' }, { status: 400 });
    }

    // Authenticate Google Drive API with user's personal OAuth token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken as string });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

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
    const { data, error } = await supabaseAdmin.from('tracks').insert({
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
    console.error('Upload complete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
