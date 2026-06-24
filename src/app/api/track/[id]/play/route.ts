import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const trackId = params.id;
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    // We use a Supabase RPC function to atomically increment the play_count
    // and log the event in the analytics table simultaneously.
    const { error } = await supabase.rpc('log_track_play', { 
      p_track_id: trackId,
      p_user_agent: userAgent
    });

    if (error) {
      console.error('Failed to log play:', error);
      return NextResponse.json({ error: 'Failed to log play' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Analytics logging failed' }, { status: 500 });
  }
}
