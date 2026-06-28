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

    // 1. Fetch all tracks owned by the user to clean up Drive files and related DB records
    const { data: tracks, error: fetchError } = await supabase
      .from('tracks')
      .select('id, google_drive_file_id, cover_url')
      .eq('user_email', userEmail);

    if (fetchError) {
      console.error('Failed to fetch tracks for deletion:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const trackIds = tracks?.map(t => t.id) || [];

    // 2. Delete files from Google Drive
    if (tracks && tracks.length > 0) {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: session.accessToken as string });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      for (const track of tracks) {
        // Delete audio file
        if (track.google_drive_file_id) {
          try {
            await drive.files.delete({ fileId: track.google_drive_file_id });
          } catch (e: any) {
            console.error('Failed to delete audio file from Drive during account deletion:', e.message);
          }
        }

        // Delete cover art if it's hosted on Drive
        if (track.cover_url && track.cover_url.includes('drive.google.com/uc?export=view&id=')) {
          try {
            const coverId = new URL(track.cover_url).searchParams.get('id');
            if (coverId) {
              await drive.files.delete({ fileId: coverId });
            }
          } catch (e: any) {
            console.error('Failed to delete cover art from Drive during account deletion:', e.message);
          }
        }
      }
    }

    // 3. Delete related database records if user has any tracks
    if (trackIds.length > 0) {
      // Delete playback sessions linked to these tracks
      await supabase.from('playback_sessions').delete().in('track_id', trackIds);
      
      // Delete tracking links linked to these tracks
      await supabase.from('tracking_links').delete().in('track_id', trackIds);
    }

    // 4. Delete the tracks
    await supabase.from('tracks').delete().eq('user_email', userEmail);

    // 5. Delete the profile
    await supabase.from('profiles').delete().eq('email', userEmail);

    // 6. Log the deleted account in the new admin table
    const { error: logError } = await supabaseAdmin.from('deleted_accounts').insert({ email: userEmail });
    if (logError) {
      console.error('Failed to log deleted account (Admin Client):', logError);
    }

    return NextResponse.json({ success: true, message: 'Account and all associated data deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
