import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { subDays, startOfDay, format, parseISO } from 'date-fns';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || '30D'; // 7D, 30D, ALL

    // 1. Fetch user's tracks
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select('id')
      .eq('user_email', session.user.email);

    if (tracksError || !tracks || tracks.length === 0) {
      return NextResponse.json({ timeline: [], devices: { desktop: 0, mobile: 0 } });
    }

    const trackIds = tracks.map(t => t.id);

    // 2. Fetch new analytics (playback_sessions)
    let query = supabase
      .from('playback_sessions')
      .select('*, tracking_links(reference_name, custom_slug)')
      .in('track_id', trackIds)
      .order('started_at', { ascending: false });

    let startDate: Date | null = null;
    if (timeframe === '7D') {
      startDate = startOfDay(subDays(new Date(), 6));
    } else if (timeframe === '30D') {
      startDate = startOfDay(subDays(new Date(), 29));
    }

    if (startDate) {
      query = query.gte('started_at', startDate.toISOString());
    }

    const { data: sessions, error: sessionsError } = await query.limit(50);

    if (sessionsError) {
      console.error(sessionsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // 3. Process Data
    let mobileCount = 0;
    let desktopCount = 0;
    
    // We no longer have user_agent logged in playback_sessions by default in the SQL schema provided,
    // so we'll just mock it or skip it, but let's keep the API structure same to not break frontend pie chart immediately.
    // Actually, we can just return devices: { desktop: 0, mobile: 0 } or base it on something else,
    // or remove it. Let's just return 0 for now.

    const timelineMap = new Map<string, number>();
    if (timeframe !== 'ALL' && startDate) {
      const days = timeframe === '7D' ? 7 : 30;
      for (let i = 0; i < days; i++) {
        const d = startOfDay(subDays(new Date(), (days - 1) - i));
        timelineMap.set(format(d, 'MMM dd'), 0);
      }
    }

    (sessions || []).forEach(session => {
      // Timeline aggregation
      if (session.started_at) {
        const dateKey = format(parseISO(session.started_at), 'MMM dd');
        if (timeframe === 'ALL') {
          timelineMap.set(dateKey, (timelineMap.get(dateKey) || 0) + 1);
        } else if (timelineMap.has(dateKey)) {
          timelineMap.set(dateKey, timelineMap.get(dateKey)! + 1);
        }
      }
    });

    const timeline = Array.from(timelineMap.entries()).map(([date, streams]) => ({
      date,
      streams
    }));

    if (timeframe === 'ALL') {
      timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // Calculate advanced metrics
    const totalOpens = sessions?.length || 0;
    const avgListenTime = totalOpens > 0 ? Math.round((sessions?.reduce((acc, s) => acc + (s.total_listen_time_seconds || 0), 0) || 0) / totalOpens) : 0;
    const downloads = sessions?.filter(s => s.download_clicked).length || 0;
    const socialClicks = sessions?.filter(s => s.social_links_clicked).length || 0;

    return NextResponse.json({
      timeline,
      devices: { mobile: 0, desktop: 0 },
      sessions: sessions || [],
      metrics: {
        totalOpens,
        avgListenTime,
        downloads,
        socialClicks
      }
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
