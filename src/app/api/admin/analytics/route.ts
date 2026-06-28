import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch total users (musicians)
    const { count: userCount, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 2. Fetch total tracks and active users (uploaders)
    const { data: allTracks, error: tracksError } = await supabaseAdmin
      .from('tracks')
      .select('user_email');
      
    const trackCount = allTracks?.length || 0;
    const activeUsersSet = new Set(allTracks?.map(t => t.user_email).filter(Boolean));
    const activeUsersCount = activeUsersSet.size;

    // 3. Fetch all playback sessions for high level audience analytics
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('playback_sessions')
      .select('country, device_type, os, total_listen_time_seconds, started_at')
      .order('started_at', { ascending: false });

    // 3.5 Fetch all musician sessions for musician analytics
    const { data: musicianSessions, error: musicianSessionsError } = await supabaseAdmin
      .from('musician_sessions')
      .select('country, device_type, os, created_at')
      .order('created_at', { ascending: false });

    // 4. Fetch recent musicians
    const { data: recentUsers } = await supabaseAdmin
      .from('profiles')
      .select('name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // 5. Fetch deleted accounts
    const { data: deletedAccounts, error: deletedAccountsError } = await supabaseAdmin
      .from('deleted_accounts')
      .select('email, deleted_at')
      .order('deleted_at', { ascending: false });

    if (usersError || tracksError) {
      console.error(usersError || tracksError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    if (deletedAccountsError || musicianSessionsError) {
      console.warn("Could not fetch optional tables (deleted_accounts or musician_sessions may be missing):", deletedAccountsError || musicianSessionsError);
    }

    // Helper function to aggregate sessions
    const aggregateSessions = (sessionList: any[]) => {
      const countryMap = new Map<string, number>();
      const deviceMap = new Map<string, number>();
      const osMap = new Map<string, number>();
      const browserMap = new Map<string, number>();

      sessionList?.forEach((s) => {
        const country = s.country || 'Unknown';
        countryMap.set(country, (countryMap.get(country) || 0) + 1);

        const device = s.device_type || 'Unknown';
        deviceMap.set(device, (deviceMap.get(device) || 0) + 1);

        const rawOs = s.os || 'Unknown';
        let osName = rawOs;
        let browserName = 'Unknown';
        if (rawOs.includes(' | ')) {
          const parts = rawOs.split(' | ');
          osName = parts[0];
          browserName = parts[1] || 'Unknown';
        }
        
        osMap.set(osName, (osMap.get(osName) || 0) + 1);
        browserMap.set(browserName, (browserMap.get(browserName) || 0) + 1);
      });

      return {
        topCountries: Array.from(countryMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
        deviceTypes: Array.from(deviceMap.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
        topOs: Array.from(osMap.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
        topBrowsers: Array.from(browserMap.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
      };
    };

    const audienceData = aggregateSessions(sessions || []);
    const musicianData = aggregateSessions(musicianSessions || []);

    return NextResponse.json({
      totalUsers: userCount || 0,
      activeUsers: activeUsersCount,
      totalTracks: trackCount || 0,
      totalSessions: sessions?.length || 0,
      audienceData,
      musicianData,
      recentUsers: recentUsers || [],
      deletedAccounts: deletedAccounts || [],
    });
  } catch (error: any) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
