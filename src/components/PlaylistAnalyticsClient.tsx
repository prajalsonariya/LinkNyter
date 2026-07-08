"use client";

import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { 
  ArrowLeft, Share2, MoreVertical, TrendingUp, Download, Heart, Check
} from "lucide-react";
import { InstagramIcon, TwitterIcon, YouTubeIcon, SpotifyIcon, AppleMusicIcon, GlobeIcon } from "@/components/SocialIcons";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function PlaylistAnalyticsClient({ playlist, sessions: initialSessions, trackingLinks }: { playlist: any, sessions: any[], trackingLinks?: any[] }) {
  const { data: session } = useSession();

  const [selectedLinkFilter, setSelectedLinkFilter] = useState<string>('all');
  const [isCopied, setIsCopied] = useState(false);
  const [trackDurations, setTrackDurations] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Extract all unique tracking links from sessions, and merge with explicitly passed trackingLinks
  const availableLinks = useMemo(() => {
    const links = new Map<string, string>();
    links.set('open', 'Public Link');
    
    // Add explicitly passed links first
    if (trackingLinks) {
      trackingLinks.forEach(link => {
        links.set(link.id, link.reference_name);
      });
    }

    // Fallback/merge from sessions (in case trackingLinks is omitted)
    initialSessions.forEach(s => {
      if (s.tracking_link_id && s.tracking_links && !links.has(s.tracking_link_id)) {
        links.set(s.tracking_link_id, s.tracking_links.reference_name);
      }
    });
    return Array.from(links.entries());
  }, [initialSessions, trackingLinks]);

  // Filter sessions based on selection
  const sessions = useMemo(() => {
    if (selectedLinkFilter === 'all') return initialSessions;
    if (selectedLinkFilter === 'open') return initialSessions.filter(s => !s.tracking_link_id);
    return initialSessions.filter(s => s.tracking_link_id === selectedLinkFilter);
  }, [initialSessions, selectedLinkFilter]);

  const handleCopy = () => {
    let url = `${window.location.origin}/p/${playlist.custom_slug}`;
    
    if (selectedLinkFilter !== 'all' && selectedLinkFilter !== 'open') {
      const explicitLink = trackingLinks?.find(l => l.id === selectedLinkFilter);
      if (explicitLink && explicitLink.custom_slug) {
        url = `${url}?ref=${explicitLink.custom_slug}`;
      } else {
        const selectedSession = initialSessions.find(s => s.tracking_link_id === selectedLinkFilter);
        if (selectedSession && selectedSession.tracking_links?.custom_slug) {
          url = `${url}?ref=${selectedSession.tracking_links.custom_slug}`;
        }
      }
    }
    
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalOpens = sessions.length;
  
  // Playlist level social clicks
  const socialEvents = sessions.filter(s => s.social_links_clicked);
  const platforms = {
    spotify: 0, apple: 0, instagram: 0, twitter: 0, youtube: 0, website: 0
  };
  
  sessions.forEach(session => {
    if (session.event_log) {
      session.event_log.forEach((ev: any) => {
        if (ev.action === 'share_spotify') platforms.spotify++;
        if (ev.action === 'share_apple_music') platforms.apple++;
        if (ev.action === 'share_instagram') platforms.instagram++;
        if (ev.action === 'share_twitter') platforms.twitter++;
        if (ev.action === 'share_youtube') platforms.youtube++;
        if (ev.action === 'share_website') platforms.website++;
      });
    }
  });

  const totalSocialClicks = Object.values(platforms).reduce((a, b) => a + b, 0);

  const getPlatformIcon = (key: string) => {
    switch(key) {
      case 'spotify': return <SpotifyIcon className="w-5 h-5 text-[#1DB954]" />;
      case 'apple': return <AppleMusicIcon className="w-5 h-5 text-[#fa243c]" />;
      case 'instagram': return <InstagramIcon className="w-5 h-5 text-[#E1306C]" />;
      case 'twitter': return <TwitterIcon className="w-5 h-5 text-[#1DA1F2]" />;
      case 'youtube': return <YouTubeIcon className="w-5 h-5 text-[#FF0000]" />;
      default: return <GlobeIcon className="w-5 h-5 text-secondary" />;
    }
  };

  const sortedPlatforms = Object.entries(platforms).sort((a, b) => b[1] - a[1]);

  const glassCardClass = "bg-[#121214] border border-[#222226] transition-all hover:border-[#333338] hover:-translate-y-[2px] shadow-lg hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]";

  // Ordered tracks from playlist
  const orderedTracks = useMemo(() => (playlist.playlist_tracks || [])
    .sort((a: any, b: any) => a.track_order - b.track_order)
    .map((pt: any) => pt.tracks)
    .filter(Boolean), [playlist.playlist_tracks]);

  useEffect(() => {
    orderedTracks.forEach((track: any) => {
      if (track?.id) {
        const audio = new Audio(`/api/stream/${track.id}`);
        audio.onloadedmetadata = () => {
          setTrackDurations(prev => ({ ...prev, [track.id]: audio.duration }));
        };
      }
    });
  }, [orderedTracks]);

  return (
    <div className="relative w-full h-full overflow-y-auto custom-scrollbar p-4 md:p-12 pt-6 md:pt-12 z-10">
      
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/analytics?tab=playlists" className="flex items-center gap-2 text-outline hover:text-primary transition-colors group">
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

      {/* Track Filters */}
      {availableLinks.length > 1 && (
        <div className="mb-12 border-b border-outline-variant/10 pb-8">
          <span className="font-label-caps text-outline tracking-widest text-[10px] mb-4 block">Filter by Tracking Link</span>
          <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 items-center">
            <button 
              onClick={() => setSelectedLinkFilter('all')}
              className={`px-5 py-2.5 rounded-full font-label-caps text-[11px] tracking-wider transition-all whitespace-nowrap border ${selectedLinkFilter === 'all' ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-[#121214] text-outline border-[#222226] hover:border-[#333338] hover:text-on-surface shadow-sm'}`}
            >
              ALL LINKS
            </button>
            {availableLinks.map(([id, name]) => (
              <button 
                key={id}
                onClick={() => setSelectedLinkFilter(id)}
                className={`px-5 py-2.5 rounded-full font-label-caps text-[11px] tracking-wider transition-all whitespace-nowrap border ${selectedLinkFilter === id ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-[#121214] text-outline border-[#222226] hover:border-[#333338] hover:text-on-surface shadow-sm'}`}
              >
                {name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Playlist Hero */}
      <section className="flex flex-col md:flex-row items-center md:items-end text-center md:text-left gap-8 mb-12 md:mb-16">
        <div className="relative group">
          <div className="absolute -inset-1 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <img 
            className="w-64 h-64 object-cover rounded-lg relative z-10 border border-outline-variant/20 shadow-2xl" 
            src={playlist.cover_art_url || "/playlist-cover.png"} 
            alt={playlist.title} 
          />
        </div>
        
        <div className="flex-1 pb-4 flex flex-col items-center md:items-start">
          <div className="mb-6 flex justify-center md:justify-start">
            <button 
              onClick={handleCopy}
              className={`transition-all hover:scale-105 active:scale-95 flex items-center justify-center min-w-[32px] h-[32px] ${isCopied ? '' : 'opacity-80 hover:opacity-100 drop-shadow-[0_0_15px_rgba(139,92,246,0.15)]'}`}
              title="Copy Active Link"
            >
              {isCopied ? (
                <Check strokeWidth={1.5} className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] animate-in zoom-in duration-200" />
              ) : (
                <img src="/logo.svg" alt="Copy Link" className="w-8 h-8 object-contain animate-in zoom-in duration-200" />
              )}
            </button>
          </div>
          <span className="font-label-caps uppercase tracking-[0.3em] text-primary mb-2 text-xs block">Playlist Analytics</span>
          <h2 className="font-display-lg text-display-lg text-on-surface leading-tight mb-2">{playlist.title}</h2>
          <p className="font-headline-md text-headline-md text-outline">{session?.user?.name || 'Creator'}</p>
        </div>
      </section>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 mb-12">
        <div className={`${glassCardClass} p-4 md:p-6 rounded-xl flex flex-col justify-between h-36 md:h-40`}>
          <div>
            <span className="font-label-caps text-outline tracking-wider text-[10px]">TOTAL PLAYS</span>
            <h3 className="font-headline-lg text-headline-lg mt-1">{totalOpens}</h3>
          </div>
          <div className="h-8 w-full flex items-end gap-1">
            {[20, 40, 30, 60, 85].map((h, i) => (
              <div key={i} className={`w-full bg-primary rounded-t-sm ${i === 4 ? "shadow-[0_0_30px_0_rgba(139,92,246,0.15)]" : ''}`} style={{ height: `${h}%`, opacity: i === 4 ? 1 : 0.2 + (i*0.1) }}></div>
            ))}
          </div>
        </div>

        <div className={`${glassCardClass} p-4 md:p-6 rounded-xl flex items-center justify-between h-36 md:h-40 relative group cursor-pointer overflow-hidden`}>
          <div className="flex flex-col justify-between h-full relative z-10 transition-transform duration-300 -translate-x-2 md:translate-x-0 md:group-hover:-translate-x-2">
            <div>
              <span className="font-label-caps text-outline tracking-wider text-[10px]">SOCIAL SHARES</span>
              <h3 className="font-headline-lg text-headline-lg mt-1">{totalSocialClicks}</h3>
            </div>
            <div className="flex -space-x-2">
              {sortedPlatforms.filter(p => p[1] > 0).length > 0 ? (
                sortedPlatforms.filter(p => p[1] > 0).slice(0, 5).map(([key, count], i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#121214] bg-[#1e1f23] flex items-center justify-center relative" style={{ zIndex: 10 - i }}>
                    {(() => {
                      const iconEl = getPlatformIcon(key) as any;
                      return iconEl ? { ...iconEl, props: { ...iconEl.props, className: iconEl.props.className.replace('w-5 h-5', 'w-3 h-3') } } : null;
                    })()}
                  </div>
                ))
              ) : (
                totalSocialClicks > 0 ? (
                  <div className="flex items-center gap-2 text-primary font-body-sm">
                    <Share2 className="w-4 h-4" /> untracked platforms
                  </div>
                ) : null
              )}
              {sortedPlatforms.filter(p => p[1] > 0).length > 5 && (
                <div className="w-6 h-6 rounded-full border-2 border-[#121214] bg-primary-container flex items-center justify-center text-[8px] text-on-primary-container font-bold relative" style={{ zIndex: 0 }}>
                  +{sortedPlatforms.filter(p => p[1] > 0).length - 5}
                </div>
              )}
            </div>
          </div>
          
          {/* Animated inside content on hover taking up the right side (always visible on mobile) */}
          {sortedPlatforms.filter(p => p[1] > 0).length > 0 && (
            <div className="flex-1 max-w-[55%] h-full flex flex-col justify-center gap-1 md:gap-2 opacity-100 translate-x-0 md:opacity-0 md:translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-300 relative z-10 pl-2 md:pl-4 border-l border-white/5">
              <div className="font-label-caps text-[9px] text-outline tracking-wider uppercase mb-0.5">Click Breakdown</div>
              {sortedPlatforms.filter(p => p[1] > 0).slice(0, 3).map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      {(() => {
                        const iconEl = getPlatformIcon(key) as any;
                        return iconEl ? { ...iconEl, props: { ...iconEl.props, className: iconEl.props.className.replace('w-5 h-5', 'w-3 h-3') } } : null;
                      })()}
                      <span className="truncate max-w-[65px]">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </div>
                    <span className="font-bold text-on-surface">{count}</span>
                  </div>
              ))}
            </div>
          )}
          
          {/* Subtle gradient background on hover to frame the inner breakdown (always visible on mobile) */}
          <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-[#1e1f23]/80 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"></div>
        </div>
      </div>

      <div className="w-full border-t border-outline-variant/20 pt-8 mb-6">
        <h3 className="font-label-caps text-lg text-on-surface uppercase tracking-wider mb-8">Per Track Analytics</h3>
        
        <div className="flex flex-col gap-8">
          {orderedTracks.map((track: any) => {
            const trackSessions = sessions.filter(s => s.track_id === track.id);
            const trackOpens = trackSessions.length;
            const trackDownloads = trackSessions.filter(s => s.download_clicked).length;
            
            // Heatmap calculation for this track
            const bars = 26;
            const trackDuration = trackDurations[track.id] || 0;
            const maxTime = trackDuration > 0 ? trackDuration : Math.max(...trackSessions.map(s => s.completion_percentage || 0), 1);
            const segment = maxTime / bars;
            const retentions = [];
            
            for (let i = 0; i < bars; i++) {
              const bucketTime = i * segment;
              const survivors = trackSessions.filter(s => (s.completion_percentage || 0) >= bucketTime).length;
              const rate = trackOpens > 0 ? (survivors / trackOpens) * 100 : 0;
              retentions.push({
                bucket: i,
                timeLabel: formatTime(bucketTime),
                rate: Math.max(10, rate)
              });
            }

            return (
              <div key={track.id} className={`${glassCardClass} rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-6 border-b border-outline-variant/10 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-surface-container-highest overflow-hidden shrink-0 shadow-md">
                      <img src={track.cover_url || "/cover-placeholder.jpg"} alt={track.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface text-lg">{track.title}</h4>
                      <p className="text-sm text-outline">{track.artist || "Unknown Artist"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-label-caps tracking-widest text-outline uppercase">Plays</span>
                      <span className="font-bold text-on-surface text-lg">{trackOpens}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-label-caps tracking-widest text-outline uppercase">Downloads</span>
                      <span className="font-bold text-on-surface text-lg">{trackDownloads}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    <h5 className="font-label-caps text-xs text-on-surface uppercase tracking-wider">Retention Heatmap</h5>
                  </div>
                  {trackOpens === 0 ? (
                    <div className="h-24 flex items-center justify-center text-outline text-sm">No session data for this track.</div>
                  ) : (
                    <div className="space-y-4 mt-4">
                      <div className="relative h-24 w-full flex items-end gap-[2px]">
                        {retentions.map((r, i) => (
                          <div 
                            key={i} 
                            className={`flex-1 rounded-full transition-all duration-1000 ${i === 0 ? 'bg-primary' : 'bg-primary/80'} shadow-[0_0_30px_0_rgba(139,92,246,0.15)]`} 
                            style={{ 
                              height: `${r.rate}%`, 
                              opacity: Math.max(0.2, r.rate / 100),
                              backgroundColor: r.rate < 30 && i > 0 ? '#ffb4ab' : '#8B5CF6'
                            }}
                            title={`${r.rate.toFixed(0)}% retention at ${r.timeLabel}`}
                          ></div>
                        ))}
                      </div>
                      <div className="flex justify-between text-outline/50 font-label-caps text-[10px]">
                        <span>0:00</span>
                        <span className="hidden md:inline">{formatTime(maxTime / 4)}</span>
                        <span className="text-primary">{formatTime(maxTime / 2)} (MID)</span>
                        <span className="hidden md:inline">{formatTime((maxTime / 4) * 3)}</span>
                        <span>{formatTime(maxTime)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
