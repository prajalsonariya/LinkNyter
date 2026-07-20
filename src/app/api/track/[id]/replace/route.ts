import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { newDriveFileId } = await req.json();

    if (!newDriveFileId) {
      return NextResponse.json({ error: 'Missing newDriveFileId' }, { status: 400 });
    }

    // Verify track ownership
    const { data: track, error: trackError } = await supabaseAdmin
      .from('tracks')
      .select('id, user_email, google_drive_file_id')
      .eq('id', params.id)
      .single();

    if (trackError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.user_email !== session.user.email) {
      // Check if admin
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('email', session.user.email)
        .single();
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const oldDriveFileId = track.google_drive_file_id;

    // Authenticate Google Drive API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken as string });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Make the NEW file readable by anyone
    await drive.permissions.create({
      fileId: newDriveFileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // 2. Delete the OLD file from Google Drive to save space
    if (oldDriveFileId) {
      try {
        await drive.files.delete({ fileId: oldDriveFileId });
      } catch (e: any) {
        console.error('Failed to delete old audio file from Drive:', e.message);
        // We don't throw here; we still want to update the DB even if deletion fails
      }
    }

    // 3. Update Supabase
    const { data, error } = await supabaseAdmin
      .from('tracks')
      .update({ google_drive_file_id: newDriveFileId })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to update database: ' + error.message);
    }

    return NextResponse.json({ success: true, track: data });
  } catch (error: any) {
    console.error('Audio replace error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
