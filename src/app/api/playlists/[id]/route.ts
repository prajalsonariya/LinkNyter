import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

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
      .select('user_email')
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
