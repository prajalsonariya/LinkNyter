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

    // First fetch user tracks
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select('id')
      .eq('user_email', session.user.email);

    if (tracksError || !tracks || tracks.length === 0) {
      return NextResponse.json([]);
    }

    const trackIds = tracks.map(t => t.id);

    let query = supabase
      .from('tracking_links')
      .select('*')
      .in('track_id', trackIds)
      .order('created_at', { ascending: false });

    if (trackId) {
      query = query.eq('track_id', trackId);
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

    const { track_id, reference_name } = await req.json();

    // Verify track ownership
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id')
      .eq('id', track_id)
      .eq('user_email', session.user.email)
      .single();

    if (trackError || !track) {
      return NextResponse.json({ error: 'Unauthorized or track not found' }, { status: 403 });
    }

    // Generate an anonymous 8-character alphanumeric slug
    const slug = Math.random().toString(36).substring(2, 10);

    const { data: newLink, error: insertError } = await supabase
      .from('tracking_links')
      .insert({
        track_id,
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
      .select('id, track_id')
      .eq('id', linkId)
      .single();

    if (linkError || !link) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id')
      .eq('id', link.track_id)
      .eq('user_email', session.user.email)
      .single();

    if (trackError || !track) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
