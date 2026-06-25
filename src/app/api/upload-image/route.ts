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

    const { driveFileId } = await req.json();
    
    if (!driveFileId) {
      return NextResponse.json({ error: 'driveFileId is required' }, { status: 400 });
    }

    // Authenticate Google Drive API with user's personal OAuth token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken as string });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Make the file readable by anyone with the link
    await drive.permissions.create({
      fileId: driveFileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const coverUrl = `/api/cover/${driveFileId}`;

    return NextResponse.json({ success: true, cover_url: coverUrl, drive_file_id: driveFileId });
  } catch (error: any) {
    console.error('Image Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
