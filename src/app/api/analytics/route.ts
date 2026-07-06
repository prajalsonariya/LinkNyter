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
    const playlistId = searchParams.get('playlistId');

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
      .order('started_at', { ascending: false });

    if (playlistId) {
      // Validate user owns this playlist
      const { data: playlistCheck } = await supabase.from('playlists').select('user_email').eq('id', playlistId).single();
      if (playlistCheck?.user_email !== session.user.email) {
        return NextResponse.json({ error: 'Unauthorized playlist' }, { status: 403 });
      }
      query = query.eq('playlist_id', playlistId);
    } else {
      query = query.in('track_id', trackIds);
    }

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
    const countryMap = new Map<string, number>();
    const cityMap = new Map<string, number>();

    (sessions || []).forEach(session => {
      // Devices
      if (session.device_type === 'Mobile' || session.device_type === 'Tablet') {
        mobileCount++;
      } else {
        desktopCount++;
      }

      // Geo
      if (session.country && session.country !== 'Unknown') {
        countryMap.set(session.country, (countryMap.get(session.country) || 0) + 1);
      }
      if (session.city && session.city !== 'Unknown') {
        cityMap.set(session.city, (cityMap.get(session.city) || 0) + 1);
      }
    });

    const topCountries = Array.from(countryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topCities = Array.from(cityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

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

    // Fetch playlist aggregate stats (total streams per playlist)
    let playlistStats: Record<string, number> = {};
    if (!playlistId) {
      const { data: playlists } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_email', session.user.email);
        
      const playlistIds = (playlists || []).map(p => p.id);
      
      if (playlistIds.length > 0) {
        const { data: pStats } = await supabase
          .from('playback_sessions')
          .select('playlist_id')
          .in('playlist_id', playlistIds);
        
        if (pStats) {
          pStats.forEach(s => {
            if (s.playlist_id) {
              playlistStats[s.playlist_id] = (playlistStats[s.playlist_id] || 0) + 1;
            }
          });
        }
      }
    }

    return NextResponse.json({
      timeline,
      devices: { mobile: mobileCount, desktop: desktopCount },
      geo: { countries: topCountries, cities: topCities },
      sessions: sessions || [],
      playlistStats,
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
