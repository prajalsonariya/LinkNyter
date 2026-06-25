import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
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

    const body = await req.json().catch(() => ({}));
    const type = body.type || 'audio';
    
    // 2. Find or create the appropriate subfolder
    const subFolderName = type === 'cover art' ? 'cover art' : 'audio';
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

    return NextResponse.json({ folderId: subFolderId, accessToken: session.accessToken });
  } catch (error: any) {
    console.error('Upload init error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
