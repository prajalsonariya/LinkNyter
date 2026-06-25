"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowLeft, Share2, MoreVertical, TrendingUp, Play, Pause, 
  FastForward, Download, Heart, RotateCcw, LogOut, Activity, LayoutDashboard 
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function TrackAnalyticsClient({ track, sessions }: { track: any, sessions: any[] }) {
  const { data: session } = useSession();

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalOpens = sessions.length;
  const avgListenTime = totalOpens > 0 ? Math.round(sessions.reduce((acc, s) => acc + (s.total_listen_time_seconds || 0), 0) / totalOpens) : 0;
  const downloads = sessions.filter(s => s.download_clicked).length;
  const downloadRate = totalOpens > 0 ? ((downloads / totalOpens) * 100).toFixed(1) : "0.0";
  const socialClicks = sessions.filter(s => s.social_links_clicked).length;

  // Aggregate Timeline (Last 7 Days)
  const timelineData = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(), 0);
    }
    sessions.forEach(s => {
      const d = new Date(s.started_at);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      if (map.has(key)) map.set(key, map.get(key)! + 1);
    });
    return Array.from(map.entries()).map(([date, streams]) => ({ date, streams }));
  }, [sessions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121214] border border-[#222226] rounded-lg p-3 shadow-xl backdrop-blur-md">
          <p className="text-[#cbc3d7] text-xs mb-1 font-label-caps">{label}</p>
          <p className="text-[#d0bcff] font-bold">{payload[0].value} streams</p>
        </div>
      );
    }
    return null;
  };

  // Flatten and sort real-time feed
  const feed = useMemo(() => {
    const allEvents = sessions.flatMap(s => {
      const evs = s.event_log || [];
      const sessionEvents = evs.map((e: any) => ({ ...e, session: s }));
      if (s.download_clicked) sessionEvents.push({ action: 'download', time: s.started_at, session: s });
      if (s.social_links_clicked) sessionEvents.push({ action: 'share', time: s.started_at, session: s });
      return sessionEvents;
    });
    return allEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20);
  }, [sessions]);

  const getFeedIcon = (action: string) => {
    switch (action) {
      case 'play': return <Play className="w-4 h-4 text-primary" />;
      case 'pause': return <Pause className="w-4 h-4 text-outline" />;
      case 'seeked': return <FastForward className="w-4 h-4 text-secondary" />;
      case 'download': return <Download className="w-4 h-4 text-primary" />;
      case 'share': return <Share2 className="w-4 h-4 text-secondary" />;
      default: return <Activity className="w-4 h-4 text-outline" />;
    }
  };

  const getFeedText = (ev: any) => {
    switch (ev.action) {
      case 'play': return <p className="font-body-sm text-on-surface">Listener played the track</p>;
      case 'pause': return <p className="font-body-sm text-on-surface">Listener paused the track</p>;
      case 'seeked': return <p className="font-body-sm text-on-surface">Listener scrubbed to <span className="text-primary">{formatTime(ev.timestamp)}</span></p>;
      case 'download': return <p className="font-body-sm text-on-surface">Track was downloaded</p>;
      case 'share': return <p className="font-body-sm text-on-surface">Social link was clicked</p>;
      default: return <p className="font-body-sm text-on-surface">Activity detected</p>;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'JUST NOW';
    if (diff < 60) return `${diff} MINS AGO`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} HOURS AGO`;
    return `${Math.floor(hours / 24)} DAYS AGO`;
  };

  // Retention Heatmap Calculation
  const heatmap = useMemo(() => {
    const bars = 20;
    const maxTime = Math.max(...sessions.map(s => s.completion_percentage || 0), 1); // Avoid 0
    const segment = maxTime / bars;
    const retentions = [];
    
    for (let i = 0; i < bars; i++) {
      const bucketTime = i * segment;
      // How many sessions listened AT LEAST up to this bucket?
      const survivors = sessions.filter(s => (s.completion_percentage || 0) >= bucketTime).length;
      const rate = totalOpens > 0 ? (survivors / totalOpens) * 100 : 0;
      retentions.push({
        bucket: i,
        timeLabel: formatTime(bucketTime),
        rate: Math.max(10, rate) // minimum 10% height for visual aesthetics
      });
    }
    return { retentions, maxTime };
  }, [sessions, totalOpens]);

  // Visual classes equivalent to .glass-card and .active-glow
  const glassCardClass = "bg-[#121214] border border-[#222226] transition-all hover:border-[#333338] hover:-translate-y-[2px] shadow-lg hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]";
  const activeGlowClass = "shadow-[0_0_30px_0_rgba(139,92,246,0.15)]";

  return (
    <div className="relative w-full h-full overflow-y-auto custom-scrollbar p-12 z-10">
      
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/analytics?tab=content" className="flex items-center gap-2 text-outline hover:text-primary transition-colors group">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-label-caps uppercase tracking-widest text-[10px]">Back to Dashboard</span>
        </Link>
        <div className="flex gap-4">
          <button className={`p-2 ${glassCardClass} rounded-lg flex items-center justify-center`}>
            <Share2 className="w-5 h-5 text-outline" />
          </button>
          <button className={`p-2 ${glassCardClass} rounded-lg flex items-center justify-center`}>
            <MoreVertical className="w-5 h-5 text-outline" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-end gap-8 mb-16">
        <div className="relative group">
          <div className="absolute -inset-1 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <img 
            className="w-64 h-64 object-cover rounded-lg relative z-10 border border-outline-variant/20 shadow-2xl" 
            src={track.cover_url || "/cover-placeholder.jpg"} 
            alt={track.title} 
          />
        </div>
        <div className="flex-1 pb-4">
          <span className="font-label-caps text-primary tracking-[0.2em] mb-4 block uppercase">Deep Dive Analytics</span>
          <h2 className="font-display-lg text-display-lg text-on-surface leading-tight mb-2">{track.title}</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden">
              {session?.user?.image && <img src={session.user.image} className="w-full h-full" />}
            </div>
            <p className="font-headline-md text-headline-md text-outline">{session?.user?.name || 'Creator'}</p>
          </div>
        </div>
      </section>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className={`${glassCardClass} p-6 rounded-xl flex flex-col justify-between h-40`}>
          <div>
            <span className="font-label-caps text-outline tracking-wider text-[10px]">TOTAL STREAMS</span>
            <h3 className="font-headline-lg text-headline-lg mt-1">{totalOpens}</h3>
          </div>
          <div className="h-8 w-full flex items-end gap-1">
            {[20, 40, 30, 60, 85].map((h, i) => (
              <div key={i} className={`w-full bg-primary rounded-t-sm ${i === 4 ? activeGlowClass : ''}`} style={{ height: `${h}%`, opacity: i === 4 ? 1 : 0.2 + (i*0.1) }}></div>
            ))}
          </div>
        </div>

        <div className={`${glassCardClass} p-6 rounded-xl flex flex-col justify-between h-40`}>
          <div>
            <span className="font-label-caps text-outline tracking-wider text-[10px]">AVG. LISTEN TIME</span>
            <h3 className="font-headline-lg text-headline-lg mt-1">{formatTime(avgListenTime)}</h3>
          </div>
          <div className="text-primary font-body-sm flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>Steady</span>
          </div>
        </div>

        <div className={`${glassCardClass} p-6 rounded-xl flex flex-col justify-between h-40`}>
          <div>
            <span className="font-label-caps text-outline tracking-wider text-[10px]">DOWNLOAD RATE</span>
            <h3 className="font-headline-lg text-headline-lg mt-1">{downloadRate}%</h3>
          </div>
          <div className="h-2 w-full bg-outline-variant/20 rounded-full overflow-hidden">
            <div className={`h-full bg-primary rounded-full ${activeGlowClass}`} style={{ width: `${Math.min(100, Math.max(5, parseFloat(downloadRate)))}%` }}></div>
          </div>
        </div>

        <div className={`${glassCardClass} p-6 rounded-xl flex flex-col justify-between h-40`}>
          <div>
            <span className="font-label-caps text-outline tracking-wider text-[10px]">SOCIAL SHARES</span>
            <h3 className="font-headline-lg text-headline-lg mt-1">{socialClicks}</h3>
          </div>
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full border-2 border-[#1e1f23] bg-surface-variant"></div>
            <div className="w-6 h-6 rounded-full border-2 border-[#1e1f23] bg-outline"></div>
            <div className="w-6 h-6 rounded-full border-2 border-[#1e1f23] bg-primary-container flex items-center justify-center text-[8px] text-on-primary-container font-bold">+{socialClicks > 2 ? socialClicks - 2 : socialClicks}</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Immersive Chart Area */}
        <div className={`lg:col-span-2 ${glassCardClass} rounded-2xl p-8 overflow-hidden relative min-h-[450px] flex flex-col`}>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h4 className="font-headline-md text-headline-md">Streams Over Time</h4>
              <p className="font-body-sm text-outline">Listener engagement last 7 days</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg font-label-caps text-[10px] bg-primary/10 text-primary border border-primary/20">7 DAYS</button>
            </div>
          </div>
          
          <div className="flex-1 w-full relative h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
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
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#chartGradient)" 
                  activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#ffffff', strokeWidth: 2, filter: 'url(#glow)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Feed */}
        <div className={`${glassCardClass} rounded-2xl p-6 h-[450px] flex flex-col`}>
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-headline-md text-headline-md">Listener Sessions</h4>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
            {feed.length === 0 ? (
              <p className="text-outline text-sm text-center py-10">No recent activity</p>
            ) : feed.map((ev: any, i: number) => (
              <div key={i} className="flex gap-4 relative group">
                <div className="flex flex-col items-center">
                  <div className={`${glassCardClass} w-8 h-8 rounded-full flex items-center justify-center relative z-10 group-hover:border-primary transition-colors`}>
                    {getFeedIcon(ev.action)}
                  </div>
                  {i !== feed.length - 1 && <div className="w-[1px] flex-1 bg-outline-variant/20 my-1"></div>}
                </div>
                <div className="pb-6 pt-1">
                  {getFeedText(ev)}
                  <span className="font-label-caps text-[10px] text-outline mt-1 block">
                    {getTimeAgo(ev.time)} • {ev.session.tracking_links?.reference_name || 'OPEN LINK'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Playback Heatmap Visualization */}
      <section className="mt-12">
        <div className={`${glassCardClass} rounded-2xl p-8`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-headline-md text-headline-md">Retention Heatmap</h4>
              <p className="font-body-sm text-outline">Estimated listener drop-off curve</p>
            </div>
            <div className="text-right">
              <span className="font-headline-md text-primary">{heatmap.retentions.length > 0 ? heatmap.retentions[heatmap.retentions.length-1].rate.toFixed(0) : 0}%</span>
              <p className="font-label-caps text-[10px] text-outline uppercase">Full Completion Rate</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative h-24 w-full flex items-end gap-[2px]">
              {heatmap.retentions.map((r, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-full transition-all duration-1000 ${i === 0 ? 'bg-primary' : 'bg-primary/80'} ${activeGlowClass}`} 
                  style={{ 
                    height: `${r.rate}%`, 
                    opacity: Math.max(0.2, r.rate / 100),
                    backgroundColor: r.rate < 30 && i > 0 ? '#ffb4ab' : '#8B5CF6' // turn red if huge dropoff
                  }}
                  title={`${r.rate.toFixed(0)}% retention at ${r.timeLabel}`}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-outline/50 font-label-caps text-[10px]">
              <span>0:00</span>
              <span>{formatTime(heatmap.maxTime / 4)}</span>
              <span className="text-primary">{formatTime(heatmap.maxTime / 2)} (MIDPOINT)</span>
              <span>{formatTime((heatmap.maxTime / 4) * 3)}</span>
              <span>{formatTime(heatmap.maxTime)}</span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-outline-variant/10 pt-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-body-lg font-bold">{totalOpens} Total Plays</h5>
                <p className="font-body-sm text-outline">Across all tracking links</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-body-lg font-bold">{heatmap.retentions.length > 0 ? (100 - heatmap.retentions[heatmap.retentions.length-1].rate).toFixed(0) : 0}% Drop-off</h5>
                <p className="font-body-sm text-outline">Overall listener abandonment</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-body-lg font-bold">Engagement Peak</h5>
                <p className="font-body-sm text-outline">Strongest retention in first quartile</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
