import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get('track_id');
    const playlistId = searchParams.get('playlist_id');

    // First fetch user tracks
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select('id')
      .eq('user_email', session.user.email);

    const { data: playlists, error: playlistsError } = await supabase
      .from('playlists')
      .select('id')
      .eq('user_email', session.user.email);

    const trackIds = tracks?.map(t => t.id) || [];
    const playlistIds = playlists?.map(p => p.id) || [];

    let query = supabase
      .from('tracking_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (playlistId) {
      if (!playlistIds.includes(playlistId)) return NextResponse.json({ error: 'Unauthorized playlist' }, { status: 403 });
      query = query.eq('playlist_id', playlistId);
    } else if (trackId) {
      if (!trackIds.includes(trackId)) return NextResponse.json({ error: 'Unauthorized track' }, { status: 403 });
      query = query.eq('track_id', trackId);
    } else {
      query = query.or(`track_id.in.(${trackIds.join(',') || '00000000-0000-0000-0000-000000000000'}),playlist_id.in.(${playlistIds.join(',') || '00000000-0000-0000-0000-000000000000'})`);
    }

    const { data: links, error: linksError } = await query;

    if (linksError) {
      return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
    }

    return NextResponse.json(links || []);
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { track_id, playlist_id, reference_name } = await req.json();

    if (playlist_id) {
      const { data: playlist, error: playlistError } = await supabase
        .from('playlists')
        .select('id')
        .eq('id', playlist_id)
        .eq('user_email', session.user.email)
        .single();
      
      if (playlistError || !playlist) return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    } else if (track_id) {
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .select('id')
        .eq('id', track_id)
        .eq('user_email', session.user.email)
        .single();
      
      if (trackError || !track) return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    } else {
      return NextResponse.json({ error: 'Must provide track_id or playlist_id' }, { status: 400 });
    }

    // Generate an anonymous 8-character alphanumeric slug
    const slug = Math.random().toString(36).substring(2, 10);

    const { data: newLink, error: insertError } = await supabase
      .from('tracking_links')
      .insert({
        track_id: track_id || null,
        playlist_id: playlist_id || null,
        reference_name: reference_name.trim(),
        custom_slug: slug
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
    }

    return NextResponse.json(newLink);
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('id');

    if (!linkId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Verify ownership via a join
    const { data: link, error: linkError } = await supabase
      .from('tracking_links')
      .select('id, track_id, playlist_id')
      .eq('id', linkId)
      .single();

    if (linkError || !link) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (link.track_id) {
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .select('id')
        .eq('id', link.track_id)
        .eq('user_email', session.user.email)
        .single();

      if (trackError || !track) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else if (link.playlist_id) {
      const { data: playlist, error: playlistError } = await supabase
        .from('playlists')
        .select('id')
        .eq('id', link.playlist_id)
        .eq('user_email', session.user.email)
        .single();

      if (playlistError || !playlist) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('tracking_links')
      .delete()
      .eq('id', linkId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
