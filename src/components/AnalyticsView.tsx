"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Loader2, Smartphone, Monitor } from "lucide-react";

export function AnalyticsView({ tracks }: { tracks: any[] }) {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | 'ALL'>('30D');
  const [totalStreams, setTotalStreams] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<{ timeline: any[], devices: { mobile: number, desktop: number } }>({ 
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

  return (
    <div className="relative w-full h-full overflow-y-auto custom-scrollbar p-12 pr-16 z-10">
      {/* Top Glow Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>
      
      {/* Header Section */}
      <header className="flex justify-between items-end mb-10">
        <div>
          <span className="font-label-caps text-label-caps text-primary mb-2 block tracking-[0.2em] uppercase">Studio Insights</span>
          <h2 className="font-display-lg text-display-lg text-on-surface">Analytics</h2>
        </div>
      </header>

      {/* Overview Cards (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Total Streams */}
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-6 flex flex-col justify-between h-40 transition-all hover:border-outline-variant hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Streams</span>
            <div className="flex items-center text-primary gap-1">
              <TrendingUp className="w-[18px] h-[18px]" />
            </div>
          </div>
          <div className="text-4xl font-headline-lg font-black text-on-surface">{totalStreams.toLocaleString()}</div>
        </div>

        {/* Top Track */}
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-6 flex flex-col justify-between h-40 transition-all hover:border-outline-variant hover:-translate-y-0.5">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Top Track</span>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-outline-variant bg-surface-container-high shrink-0">
              <img 
                className="w-full h-full object-cover" 
                src={highestTrack?.cover_url || "/cover-placeholder.jpg"} 
                alt="Top Track" 
              />
            </div>
            <div className="overflow-hidden">
              <div className="font-headline-md text-on-surface truncate max-w-full">{highestTrack?.title || "N/A"}</div>
              <div className="text-xs text-on-surface-variant">{highestTrack?.play_count || 0} streams all time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section (Chart) */}
      <section className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-2xl p-8 mb-6">
        <div className="flex justify-between items-center mb-8">
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

      {/* Bottom Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {/* Top Tracks Column */}
        <section className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-2xl p-6">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6 tracking-wider">Top Tracks</h3>
          <div className="space-y-4">
            {topTracks.length === 0 && (
              <p className="text-on-surface-variant text-body-sm text-center py-4">No data available yet</p>
            )}
            {topTracks.map((track, idx) => (
              <div key={track.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-high transition-all group">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-outline w-4">0{idx + 1}</span>
                  <div className="w-10 h-10 rounded bg-outline-variant overflow-hidden shrink-0">
                    <img className="w-full h-full object-cover" src={track.cover_url || "/cover-placeholder.jpg"} alt={track.title} />
                  </div>
                  <span className="font-body-lg text-on-surface group-hover:text-primary transition-colors truncate max-w-[200px]">{track.title}</span>
                </div>
                <span className="font-body-sm text-on-surface-variant shrink-0">{track.play_count || 0}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Device Breakdown Column */}
        <section className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-2xl p-6 flex flex-col">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-6 tracking-wider">Device Breakdown</h3>
          <div className="flex-grow flex items-center justify-center relative min-h-[200px]">
            {isLoading ? (
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            ) : totalDevices === 0 ? (
               <span className="text-on-surface-variant font-label-caps">No Data</span>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      stroke="none"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Inner Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-on-surface">{mobilePercent}%</span>
                  <span className="text-[10px] font-label-caps text-outline uppercase">Mobile</span>
                </div>
              </>
            )}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/30">
              <Smartphone className="w-6 h-6 text-primary" />
              <div>
                <div className="text-xs font-label-caps text-on-surface-variant uppercase">Mobile</div>
                <div className="font-headline-md text-on-surface">{mobilePercent}%</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/30">
              <Monitor className="w-6 h-6 text-outline" />
              <div>
                <div className="text-xs font-label-caps text-on-surface-variant uppercase">Desktop</div>
                <div className="font-headline-md text-on-surface">{desktopPercent}%</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
