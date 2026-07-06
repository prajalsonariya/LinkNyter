"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Loader2, Smartphone, Monitor } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';

export function AnalyticsView({ tracks, playlists }: { tracks: any[], playlists?: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'overview' | 'content' | 'playlists' | null;
  const activeTab = tabParam === 'content' ? 'content' : tabParam === 'playlists' ? 'playlists' : 'overview';
  
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | 'ALL'>('30D');
  const [totalStreams, setTotalStreams] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<{ 
    timeline: any[], 
    devices: { mobile: number, desktop: number },
    geo?: { countries: any[], cities: any[] },
    sessions?: any[],
    playlistStats?: Record<string, number>,
    metrics?: { totalOpens: number, avgListenTime: number, downloads: number, socialClicks: number }
  }>({ 
    timeline: [], 
    devices: { mobile: 0, desktop: 0 } 
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Calculate total streams from tracks
    const total = tracks.reduce((sum, track) => sum + (track.play_count || 0), 0);
    setTotalStreams(total);
  }, [tracks]);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/analytics?timeframe=${timeframe}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.timeline) {
          setAnalyticsData(data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch analytics:", err);
        setIsLoading(false);
      });
  }, [timeframe]);

  // Sort top tracks
  const topTracks = [...tracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 5);
  const highestTrack = topTracks[0];

  // Device calculations
  const totalDevices = analyticsData.devices.mobile + analyticsData.devices.desktop;
  const mobilePercent = totalDevices > 0 ? Math.round((analyticsData.devices.mobile / totalDevices) * 100) : 0;
  const desktopPercent = totalDevices > 0 ? Math.round((analyticsData.devices.desktop / totalDevices) * 100) : 0;
  
  const pieData = [
    { name: 'Desktop', value: analyticsData.devices.desktop, color: '#222226' },
    { name: 'Mobile', value: analyticsData.devices.mobile, color: '#8B5CF6' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container border border-outline-variant rounded-lg p-3 shadow-xl backdrop-blur-md">
          <p className="text-on-surface-variant text-xs mb-1 font-label-caps">{label}</p>
          <p className="text-primary font-bold">{payload[0].value} streams</p>
        </div>
      );
    }
    return null;
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const metrics = analyticsData.metrics || { totalOpens: 0, avgListenTime: 0, downloads: 0, socialClicks: 0 };
  const sessions = analyticsData.sessions || [];

  return (
    <div className="relative w-full h-full overflow-y-auto custom-scrollbar p-4 pt-6 md:p-12 md:pr-16 z-10">
      {/* Top Glow Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>
      
      {/* Header Section with Tabs */}
      <header className="mb-10">
        <div className="mb-8">
          <span className="font-label-caps text-label-caps text-primary mb-2 block tracking-[0.2em] uppercase">Studio Insights</span>
          <h2 className="font-display-lg text-display-lg text-on-surface">Analytics</h2>
        </div>
        
        <div className="flex items-center gap-8 border-b border-outline-variant/30 px-2">
          <button 
            onClick={() => router.push('?tab=overview', { scroll: false })}
            className={`pb-4 font-label-caps text-sm uppercase tracking-wider transition-all relative ${activeTab === 'overview' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Overview
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />}
          </button>
          <button 
            onClick={() => router.push('?tab=content', { scroll: false })}
            className={`pb-4 font-label-caps text-sm uppercase tracking-wider transition-all relative ${activeTab === 'content' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Tracks
            {activeTab === 'content' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />}
          </button>
          <button 
            onClick={() => router.push('?tab=playlists', { scroll: false })}
            className={`pb-4 font-label-caps text-sm uppercase tracking-wider transition-all relative ${activeTab === 'playlists' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Playlists
            {activeTab === 'playlists' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />}
          </button>
        </div>
      </header>

      {activeTab === 'overview' && (
        <>
          {/* Overview Cards (Top Row) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        {/* Total Streams */}
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-4 md:p-6 flex flex-col justify-between h-36 md:h-40 transition-all hover:border-outline-variant hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[10px] md:text-label-caps text-on-surface-variant uppercase">Total Streams</span>
            <div className="flex items-center text-primary gap-1">
              <TrendingUp className="w-4 h-4 md:w-[18px] md:h-[18px]" />
            </div>
          </div>
          <div className="text-2xl md:text-4xl font-headline-lg font-black text-on-surface">{totalStreams.toLocaleString()}</div>
        </div>

        {/* Total Unique Opens */}
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-4 md:p-6 flex flex-col justify-between h-36 md:h-40 transition-all hover:border-outline-variant hover:-translate-y-0.5">
          <span className="font-label-caps text-[10px] md:text-label-caps text-on-surface-variant uppercase">Tracked Opens</span>
          <div className="text-2xl md:text-4xl font-headline-lg font-black text-on-surface">{metrics.totalOpens.toLocaleString()}</div>
        </div>

        {/* Avg Listen Time */}
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-4 md:p-6 flex flex-col justify-between h-36 md:h-40 transition-all hover:border-outline-variant hover:-translate-y-0.5">
          <span className="font-label-caps text-[10px] md:text-label-caps text-on-surface-variant uppercase">Avg Listen Time</span>
          <div className="text-2xl md:text-4xl font-headline-lg font-black text-on-surface">{formatTime(metrics.avgListenTime)}</div>
        </div>

        {/* Top Track */}
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-4 md:p-6 flex flex-col justify-between h-36 md:h-40 transition-all hover:border-outline-variant hover:-translate-y-0.5 overflow-hidden">
          <span className="font-label-caps text-[10px] md:text-label-caps text-on-surface-variant uppercase">Top Track</span>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2">
            <div className="w-8 h-8 md:w-14 md:h-14 rounded-md md:rounded-lg overflow-hidden border border-outline-variant bg-surface-container-high shrink-0">
              <img 
                className="w-full h-full object-cover" 
                src={highestTrack?.cover_url || "/cover-placeholder.jpg"} 
                alt="Top Track" 
              />
            </div>
            <div className="overflow-hidden w-full">
              <div className="font-headline-md text-[14px] md:text-[16px] text-on-surface truncate">{highestTrack?.title || "N/A"}</div>
              <div className="text-[10px] md:text-xs text-on-surface-variant truncate">{highestTrack?.play_count || 0} streams</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section (Chart) */}
      <section className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-2xl p-4 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h3 className="font-headline-md text-on-surface">Streams Over Time</h3>
          <div className="flex bg-surface-container-lowest rounded-lg p-1 border border-outline-variant/50">
            <button 
              onClick={() => setTimeframe('7D')}
              className={`px-4 py-1 text-xs font-label-caps uppercase rounded-md transition-colors ${timeframe === '7D' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              7D
            </button>
            <button 
              onClick={() => setTimeframe('30D')}
              className={`px-4 py-1 text-xs font-label-caps uppercase rounded-md transition-colors ${timeframe === '30D' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              30D
            </button>
            <button 
              onClick={() => setTimeframe('ALL')}
              className={`px-4 py-1 text-xs font-label-caps uppercase rounded-md transition-colors ${timeframe === 'ALL' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              All Time
            </button>
          </div>
        </div>
        
        <div className="relative h-[300px] w-full">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : analyticsData.timeline.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-label-caps">
              No Data Available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.timeline} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#958ea0', fontSize: 10, fontFamily: 'Geist' }}
                  dy={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="streams" 
                  stroke="#d0bcff" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorStreams)" 
                  activeDot={{ r: 6, fill: '#ffffff', stroke: '#d0bcff', strokeWidth: 2, filter: 'url(#glow)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Device Breakdown Section in Overview */}
      <section className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-2xl p-4 md:p-8 flex flex-col items-center max-w-md mx-auto mb-6">
        <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider w-full text-left mb-6">Device Breakdown</h3>
        {totalDevices === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-on-surface-variant text-sm">No device data</div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8B5CF6]"></div>
                <span className="text-sm text-on-surface">Mobile ({mobilePercent}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#222226]"></div>
                <span className="text-sm text-on-surface">Desktop ({desktopPercent}%)</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* End Overview Tab */}
        </>
      )}

      {activeTab === 'content' && (
        <section className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">All Tracks</h3>
            <span className="text-xs text-on-surface-variant">{tracks.length} tracks</span>
          </div>
          
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="pb-3 px-4 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Track</th>
                  <th className="pb-3 px-4 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider text-right">Plays</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr 
                    key={track.id} 
                    onClick={() => router.push(`/analytics/${track.id}`)}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-high transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-outline-variant overflow-hidden shrink-0">
                          <img className="w-full h-full object-cover" src={track.cover_url || "/cover-placeholder.jpg"} alt={track.title} />
                        </div>
                        <span className="font-body-lg text-on-surface group-hover:text-primary transition-colors">{track.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-body-md text-on-surface-variant group-hover:text-primary transition-colors">
                      {track.play_count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'playlists' && (
        <section className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">All Playlists</h3>
            <span className="text-xs text-on-surface-variant">{playlists?.length || 0} playlists</span>
          </div>
          
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="pb-3 px-4 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Playlist</th>
                  <th className="pb-3 px-4 font-label-caps text-xs text-on-surface-variant uppercase tracking-wider text-right">Streams</th>
                </tr>
              </thead>
              <tbody>
                {(playlists || []).map((playlist) => {
                  const streams = analyticsData.playlistStats?.[playlist.id] || 0;
                  return (
                    <tr 
                      key={playlist.id} 
                      onClick={() => router.push(`/analytics/playlist/${playlist.id}`)}
                      className="border-b border-outline-variant/10 hover:bg-surface-container-high transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-outline-variant overflow-hidden shrink-0">
                            <img className="w-full h-full object-cover" src={playlist.cover_art_url || "/cover-placeholder.jpg"} alt={playlist.title} />
                          </div>
                          <span className="font-body-lg text-on-surface group-hover:text-primary transition-colors">{playlist.title}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-body-md text-on-surface-variant group-hover:text-primary transition-colors">
                        {streams}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
}
