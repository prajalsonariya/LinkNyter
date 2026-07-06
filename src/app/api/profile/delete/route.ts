import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // 1. Fetch all tracks owned by the user
    const { data: tracks, error: fetchError } = await supabase
      .from('tracks')
      .select('id, google_drive_file_id, cover_url')
      .eq('user_email', userEmail);

    if (fetchError) {
      console.error('Failed to fetch tracks for deletion:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const trackIds = tracks?.map(t => t.id) || [];

    // 2. Delete the master folder from Google Drive
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken as string });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
      const masterSearchRes = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='LinkNyter Audio' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id)',
      });

      if (masterSearchRes.data.files && masterSearchRes.data.files.length > 0) {
        // Deleting the master folder automatically deletes all contents inside it
        await drive.files.delete({ fileId: masterSearchRes.data.files[0].id });
        console.log("Successfully deleted master LinkNyter Audio folder");
      }
    } catch (e: any) {
      console.error('Failed to delete master folder from Drive during account deletion:', e.message);
    }

    // 3. Delete related database records if user has any tracks
    if (trackIds.length > 0) {
      await supabase.from('playback_sessions').delete().in('track_id', trackIds);
      await supabase.from('tracking_links').delete().in('track_id', trackIds);
    }

    // 2. Delete all tracks
    await supabaseAdmin.from('tracks').delete().eq('user_email', userEmail);
    // (Playlists and Playback sessions and Links will cascade delete if foreign keys are set up, 
    // but we can be explicit just in case)
    await supabaseAdmin.from('playlists').delete().eq('user_email', userEmail);

    // 5. Log the deleted account BEFORE deleting the profile (so authenticated RLS might allow it)
    let logError = null;
    const { error: adminError } = await supabaseAdmin.from('deleted_accounts').insert({ email: userEmail });
    if (adminError) {
      console.warn('Admin Client failed to log deleted account, trying normal client...', adminError);
      const { error: normalError } = await supabase.from('deleted_accounts').insert({ email: userEmail });
      logError = normalError;
    }
    
    if (logError) {
      console.error('CRITICAL: Both clients failed to log deleted account:', logError);
    }

    // 6. Delete the profile
    await supabase.from('profiles').delete().eq('email', userEmail);

    return NextResponse.json({ success: true, message: 'Account and all associated data deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
