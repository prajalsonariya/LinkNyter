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

    // 2. Fetch analytics
    let query = supabase
      .from('analytics')
      .select('timestamp, user_agent')
      .in('track_id', trackIds)
      .eq('event_type', 'play');

    let startDate: Date | null = null;
    if (timeframe === '7D') {
      startDate = startOfDay(subDays(new Date(), 6));
    } else if (timeframe === '30D') {
      startDate = startOfDay(subDays(new Date(), 29));
    }

    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString());
    }

    const { data: analytics, error: analyticsError } = await query;

    if (analyticsError) {
      console.error(analyticsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // 3. Process Data
    let mobileCount = 0;
    let desktopCount = 0;
    
    // Create empty timeline buckets
    const timelineMap = new Map<string, number>();
    if (timeframe !== 'ALL' && startDate) {
      const days = timeframe === '7D' ? 7 : 30;
      for (let i = 0; i < days; i++) {
        const d = startOfDay(subDays(new Date(), (days - 1) - i));
        timelineMap.set(format(d, 'MMM dd'), 0);
      }
    }

    (analytics || []).forEach(record => {
      // Device breakdown
      const ua = record.user_agent || '';
      if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
        mobileCount++;
      } else {
        desktopCount++;
      }

      // Timeline aggregation
      if (record.timestamp) {
        const dateKey = format(parseISO(record.timestamp), 'MMM dd');
        if (timeframe === 'ALL') {
          // If ALL, just add the key dynamically
          timelineMap.set(dateKey, (timelineMap.get(dateKey) || 0) + 1);
        } else if (timelineMap.has(dateKey)) {
          // If 7D or 30D, only increment if it's within our pre-filled buckets
          timelineMap.set(dateKey, timelineMap.get(dateKey)! + 1);
        }
      }
    });

    const timeline = Array.from(timelineMap.entries()).map(([date, streams]) => ({
      date,
      streams
    }));

    // If ALL time, sort the dynamically created keys chronologically
    if (timeframe === 'ALL') {
      timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return NextResponse.json({
      timeline,
      devices: {
        mobile: mobileCount,
        desktop: desktopCount
      }
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
