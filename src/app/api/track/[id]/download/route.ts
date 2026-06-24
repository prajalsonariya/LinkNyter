import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const trackId = params.id;
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const { error } = await supabase.from('analytics').insert({
      track_id: trackId,
      event_type: 'download',
      user_agent: userAgent
    });

    if (error) {
      console.error('Failed to log download:', error);
      return NextResponse.json({ error: 'Failed to log download' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Analytics logging failed' }, { status: 500 });
  }
}
