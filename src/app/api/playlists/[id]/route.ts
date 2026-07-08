import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const playlistId = params.id;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: playlist, error: fetchError } = await supabaseAdmin
      .from('playlists')
      .select('user_email, cover_art_url')
      .eq('id', playlistId)
      .single();

    if (fetchError || !playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }
    
    if (playlist.user_email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates = await req.json();

    // If tracks array is provided, update playlist_tracks
    if (updates.tracks && Array.isArray(updates.tracks)) {
      // 1. Delete existing tracks
      await supabaseAdmin.from('playlist_tracks').delete().eq('playlist_id', playlistId);
      
      // 2. Insert new tracks in order
      if (updates.tracks.length > 0) {
        const inserts = updates.tracks.map((track_id: string, index: number) => ({
          playlist_id: playlistId,
          track_id,
          track_order: index
        }));
        const { error: insertError } = await supabaseAdmin.from('playlist_tracks').insert(inserts);
        if (insertError) throw insertError;
      }
      
      delete updates.tracks; // Remove from updates so we don't try to update playlist table with it
    }

    // Delete old cover art from Drive if it exists and is being changed
    if (updates.cover_art_url !== undefined && updates.cover_art_url !== playlist.cover_art_url) {
      if (playlist.cover_art_url) {
        let coverId = null;
        if (playlist.cover_art_url.includes('drive.google.com/uc?export=view&id=')) {
          coverId = new URL(playlist.cover_art_url).searchParams.get('id');
        } else if (playlist.cover_art_url.startsWith('/api/cover/')) {
          coverId = playlist.cover_art_url.split('/api/cover/')[1];
        }
        
        if (coverId) {
          try {
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: (session as any).accessToken as string });
            const drive = google.drive({ version: 'v3', auth: oauth2Client });
            
            await drive.files.delete({ fileId: coverId });
          } catch (e: any) {
            console.error('Failed to delete old playlist cover from Drive:', e.message);
          }
        }
      }
    }

    // If there are other updates (like title, cover)
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('playlists')
        .update(updates)
        .eq('id', playlistId);
        
      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Playlist update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const playlistId = params.id;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: playlist, error: fetchError } = await supabaseAdmin
      .from('playlists')
      .select('user_email')
      .eq('id', playlistId)
      .single();

    if (fetchError || !playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }
    
    if (playlist.user_email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin.from('playlists').delete().eq('id', playlistId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
