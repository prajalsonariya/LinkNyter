"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Download } from "lucide-react";
import { InstagramIcon, TwitterIcon, YouTubeIcon, SpotifyIcon, AppleMusicIcon, GlobeIcon } from "@/components/SocialIcons";
import Link from "next/link";
import { Lrc } from "react-lrc";

function extractDominantColor(imgElement: HTMLImageElement): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve([139, 92, 246]); return; }
    canvas.width = 50; canvas.height = 50;
    ctx.drawImage(imgElement, 0, 0, 50, 50);
    const d = ctx.getImageData(0, 0, 50, 50).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < d.length; i += 16) {
      const brightness = (d[i] + d[i+1] + d[i+2]) / 3;
      if (brightness > 30 && brightness < 220) { r += d[i]; g += d[i+1]; b += d[i+2]; count++; }
    }
    if (count === 0) { resolve([139, 92, 246]); return; }
    resolve([Math.round(r/count), Math.round(g/count), Math.round(b/count)]);
  });
}

export default function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accent, setAccent] = useState("255, 255, 255"); // default to neutral white before extraction
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolume] = useState(1);
  const [currentMillisecond, setCurrentMillisecond] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hasTrackedPlay = useRef(false);

  // Advanced Telemetry Engine State
  const sessionId = useRef<string>('');
  const telemetry = useRef({
    events: [] as { action: string; timestamp: number; time: string }[],
    downloads: 0,
    social_clicks: 0
  });

  useEffect(() => {
    sessionId.current = crypto.randomUUID();
  }, []);

  const onPlay = () => telemetry.current.events.push({ action: 'play', timestamp: audioRef.current?.currentTime || 0, time: new Date().toISOString() });
  const onPause = () => telemetry.current.events.push({ action: 'pause', timestamp: audioRef.current?.currentTime || 0, time: new Date().toISOString() });
  const onSeeked = () => telemetry.current.events.push({ action: 'seeked', timestamp: audioRef.current?.currentTime || 0, time: new Date().toISOString() });

  useEffect(() => {
    async function loadTrack() {
      const resolvedParams = await params;
      const { data: trackData } = await supabase
        .from('tracks').select('*').eq('slug', resolvedParams.slug).single();
      if (trackData) {
        const { data: profile } = await supabase
          .from('profiles').select('name, bio, social_links').eq('email', trackData.user_email).single();
        setTrack({ ...trackData, artist_name: profile?.name, artist_bio: profile?.bio, social_links: profile?.social_links });
      }
      setLoading(false);
    }
    loadTrack();
  }, [params]);

  useEffect(() => {
    if (!track) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = track.cover_url || "/cover-placeholder.jpg";
    img.onload = async () => {
      try { const [r,g,b] = await extractDominantColor(img); setAccent(`${r},${g},${b}`); } catch {}
    };
  }, [track]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Track stream analytics once per session when audio starts playing
  useEffect(() => {
    if (isPlaying && !hasTrackedPlay.current && track) {
      hasTrackedPlay.current = true;
      // Send the analytics event in the background
      fetch(`/api/track/${track.id}/play`, { method: 'POST' }).catch(err => console.error('Failed to log play:', err));
    }
  }, [isPlaying, track]);

  // Batch Telemetry Dispatch Engine
  useEffect(() => {
    if (!track) return;

    const sendBeacon = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const trackingRef = searchParams.get('ref');

      const payload = {
        session_id: sessionId.current,
        track_id: track.id,
        tracking_ref: trackingRef,
        events: telemetry.current.events,
        downloads: telemetry.current.downloads,
        social_clicks: telemetry.current.social_clicks
      };

      if (telemetry.current.events.length > 0 || telemetry.current.downloads > 0 || telemetry.current.social_clicks > 0) {
        navigator.sendBeacon('/api/analytics/ingest', JSON.stringify(payload));
      }
    };

    const handleVisibilityChange = () => {
      // Send beacon periodically to ensure backend has the latest state, 
      // but don't wipe the local state since we are upserting on the backend.
      if (document.visibilityState === 'hidden') {
        sendBeacon();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', sendBeacon);

    return () => {
      sendBeacon();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', sendBeacon);
    };
  }, [track]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ backgroundColor: '#060607' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30" />
    </div>
  );

  if (!track) return (
    <div className="flex h-screen items-center justify-center flex-col" style={{ backgroundColor: '#060607' }}>
      <h2 className="text-headline-lg font-bold text-white mb-2">Track Not Found</h2>
      <p className="text-white/50">This link may be invalid or expired.</p>
    </div>
  );

  const coverSrc = track.cover_url || "/cover-placeholder.jpg";
  const artistName = track.artist_name || track.user_email?.split('@')[0] || "Unknown Artist";

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    if (!track || !track.allow_downloads) return;
    setIsDownloading(true);
    telemetry.current.downloads += 1;
    try {
      const response = await fetch(`/api/stream/${track.id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Determine file extension from content-type
      let ext = 'wav';
      const contentType = response.headers.get('content-type');
      if (contentType) {
        if (contentType.includes('mpeg') || contentType.includes('mp3')) ext = 'mp3';
        else if (contentType.includes('wav')) ext = 'wav';
        else if (contentType.includes('ogg')) ext = 'ogg';
        else if (contentType.includes('flac')) ext = 'flac';
        else if (contentType.includes('aac')) ext = 'aac';
        else if (contentType.includes('mp4')) ext = 'm4a';
      }

      a.download = `${artistName} - ${track.title}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  // Smoothly update currentMillisecond for the lyrics sync
  useEffect(() => {
    let rafId: number;
    const updateRaf = () => {
      if (audioRef.current && isPlaying) {
        setCurrentMillisecond(audioRef.current.currentTime * 1000);
      }
      rafId = requestAnimationFrame(updateRaf);
    };
    if (isPlaying) {
      rafId = requestAnimationFrame(updateRaf);
    }
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime, tot = audioRef.current.duration;
    setProgress((cur / tot) * 100 || 0);
    setCurrentTime(formatTime(cur));
    if (!isPlaying) {
      setCurrentMillisecond(cur * 1000); // fallback update when scrubbed while paused
    }
    if (tot && tot !== Infinity && !isNaN(tot)) setDuration(formatTime(tot));
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
    setProgress(pct * 100);
  };

  const socials = track.social_links || {};
  const hasSocials = Object.values(socials).some((v: any) => v && v.trim());
  const socialConfig = [
    { key: 'instagram', label: 'Instagram', icon: <InstagramIcon className="w-5 h-5" /> },
    { key: 'twitter', label: 'X', icon: <TwitterIcon className="w-5 h-5" /> },
    { key: 'youtube', label: 'YouTube', icon: <YouTubeIcon className="w-5 h-5" /> },
    { key: 'spotify', label: 'Spotify', icon: <SpotifyIcon className="w-5 h-5" /> },
    { key: 'apple_music', label: 'Apple Music', icon: <AppleMusicIcon className="w-5 h-5" /> },
    { key: 'website', label: 'Web', icon: <GlobeIcon className="w-5 h-5" /> },
  ];

  const lineRenderer = ({ index, active, line }: { index: number; active: boolean; line: any }) => {
    return (
      <div 
        className={`transition-all duration-500 py-3 text-left ${
          active 
            ? 'text-white font-bold opacity-100 scale-105 origin-left' 
            : 'text-white/30 font-medium opacity-40 scale-95 origin-left hover:opacity-60'
        }`}
        style={{
          fontSize: active ? '1.875rem' : '1.5rem',
          lineHeight: '1.25',
          textShadow: active ? `0 0 20px rgba(${accent}, 0.6)` : 'none',
          cursor: 'pointer'
        }}
        onClick={() => {
          if (audioRef.current) {
            audioRef.current.currentTime = line.startMillisecond / 1000;
            setCurrentMillisecond(line.startMillisecond);
          }
        }}
      >
        {line.content}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden" style={{ backgroundColor: '#060607', color: '#e3e2e7', fontFamily: "'Geist', sans-serif" }}>

      {/* Dynamic Atmosphere */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125" style={{ backgroundImage: `url('${coverSrc}')` }} />
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] pointer-events-none" style={{ background: `radial-gradient(circle, rgba(${accent}, 0.12) 0%, rgba(${accent}, 0) 70%)`, filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-30%] left-[-10%] w-[80vw] h-[80vw] pointer-events-none" style={{ background: `radial-gradient(circle, rgba(${accent}, 0.08) 0%, rgba(${accent}, 0) 70%)`, filter: 'blur(150px)' }} />
      </div>

      {/* Header */}
      <nav className="fixed top-0 left-0 w-full h-20 flex items-center justify-between px-4 md:px-12 z-50">
        <Link href="/" className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.svg" alt="LinkNyter Logo" className="h-8 md:h-10 w-auto" />
          <span className="text-headline-md font-bold tracking-tight text-white/90">LinkNyter</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-12 pt-24 pb-12">
        <div className={`w-full max-w-7xl grid grid-cols-1 ${track.lrc_data ? 'lg:grid-cols-12 gap-10 lg:gap-16' : 'lg:grid-cols-2 gap-10 lg:gap-16'} items-center mx-auto`}>
          
          {track.lrc_data ? (
            <>
              {/* Left Column: Cover & Player (Col span 5) */}
              <div className="lg:col-span-5 flex flex-col items-center gap-8 w-full max-w-[450px] mx-auto">
                {/* Cover Art */}
                <div className="relative group w-full max-w-[240px] md:max-w-[280px]">
                  <div className="absolute inset-0 bg-white/5 blur-2xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/5" style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)' }}>
                    <img
                      ref={imgRef}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      src={coverSrc}
                      onError={(e) => { e.currentTarget.src = "/cover-placeholder.jpg" }}
                    />
                  </div>
                </div>

                {/* Info & Playback */}
                <div className="flex flex-col gap-6 w-full text-center">
                  <div>
                    <h1 className="text-[28px] md:text-[36px] font-bold tracking-tighter text-white mb-1.5 leading-tight">{track.title}</h1>
                    <p className="text-body-lg font-medium tracking-tight opacity-90" style={{ color: `rgb(${accent})` }}>
                      {artistName}
                    </p>
                  </div>
                  <p className="text-body-md text-white/40 max-w-lg leading-relaxed font-light mx-auto line-clamp-3">
                    {track.description || track.artist_bio || "A secure, private stream hosted on LinkNyter."}
                  </p>
                  
                  {/* Playback System */}
                  <div className="space-y-6 mt-4">
                    {/* Timeline */}
                    <div className="space-y-3">
                      <div className="relative h-[2px] w-full bg-white/10 cursor-pointer group/rail" onClick={handleSeek}>
                        <div className="absolute top-0 left-0 h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover/rail:opacity-100 transition-opacity" style={{ left: `${progress}%`, boxShadow: '0 0 10px rgba(255,255,255,0.4)' }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold tracking-[0.15em] text-white/40 uppercase">
                        <span>{currentTime}</span>
                        <span>{duration}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-12">
                      <button className="text-white/40 hover:text-white transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="16 18 9 12 16 6 16 18" />
                          <line x1="7" y1="18" x2="7" y2="6" />
                        </svg>
                      </button>
                      <button
                        onClick={togglePlay}
                        className="w-14 h-14 shrink-0 aspect-square rounded-full flex items-center justify-center text-white transition-all active:scale-95 hover:scale-105 hover:border-white/30"
                        style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        {isPlaying ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="7" y="6" width="3" height="12" rx="1" />
                            <rect x="14" y="6" width="3" height="12" rx="1" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="translate-x-0.5">
                            <path d="M7 5.5C7 4.5 8.1 3.9 8.9 4.4L18.4 10.9C19.1 11.4 19.1 12.6 18.4 13.1L8.9 19.6C8.1 20.1 7 19.5 7 18.5V5.5Z" />
                          </svg>
                        )}
                      </button>
                      <button className="text-white/40 hover:text-white transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="8 6 15 12 8 18 8 6" />
                          <line x1="17" y1="6" x2="17" y2="18" />
                        </svg>
                      </button>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center justify-center gap-4 group mt-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 group-hover:text-white/60 transition-colors">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                      <div className="relative flex items-center w-20 h-4">
                        <div className="absolute w-full h-[1px] bg-white/20 rounded-full pointer-events-none" />
                        <div className="absolute h-[1px] bg-white/50 rounded-full pointer-events-none" style={{ width: `${volume * 100}%` }} />
                        <input 
                          type="range" 
                          min="0" max="1" step="0.01" 
                          value={volume} 
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ left: `calc(${volume * 100}% - 5px)` }} />
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  {track.allow_downloads && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="group flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait text-white font-label-caps text-[10px] tracking-widest uppercase border border-white/10 hover:border-white/30 backdrop-blur-md shadow-xl"
                        style={{ boxShadow: isDownloading ? `0 0 20px rgba(${accent}, 0.2)` : 'none' }}
                      >
                        {isDownloading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span className="opacity-80">Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Social Links */}
                  {hasSocials && (
                    <div className="pt-4 flex items-center gap-6 border-t border-white/5 justify-center mx-auto flex-wrap">
                      {socialConfig.map(({ key, label, icon }) => {
                        const rawUrl = (socials as any)[key];
                        if (!rawUrl || !rawUrl.trim()) return null;
                        const url = rawUrl.trim().startsWith('http') ? rawUrl.trim() : `https://${rawUrl.trim()}`;
                        return (
                          <a key={key} href={url} target="_blank" rel="noopener noreferrer" onMouseDown={() => {
                            telemetry.current.social_clicks += 1;
                            telemetry.current.events.push({ action: `share_${key}`, timestamp: audioRef.current?.currentTime || 0, time: new Date().toISOString() });
                          }} className="group flex items-center justify-center text-white/40 hover:text-white transition-all">
                            <span className="group-hover:scale-110 transition-transform">{icon}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Synced Lyrics View (Col span 7) */}
              <div className="lg:col-span-7 w-full h-[65vh] lg:h-[75vh] flex flex-col justify-center bg-black/10 border border-white/5 backdrop-blur-md rounded-3xl p-6 md:p-10 overflow-hidden relative">
                <div className="absolute top-4 left-6 flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-widest font-semibold font-label-caps">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ backgroundColor: `rgb(${accent})` }} />
                  Lyrics
                </div>
                <div className="flex-1 overflow-hidden mt-6">
                  <Lrc
                    lrc={track.lrc_data}
                    currentMillisecond={currentMillisecond}
                    verticalSpace
                    recoverAutoScrollInterval={3000}
                    lineRenderer={lineRenderer}
                    className="h-full custom-scrollbar animate-fade-in"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Default View: Cover Art (Left Column) */}
              <div className="relative group mx-auto w-full max-w-[360px] md:max-w-[500px]">
                <div className="absolute inset-0 bg-white/5 blur-2xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/5" style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)' }}>
                  <img
                    ref={imgRef}
                    alt={track.title}
                    className="w-full h-full object-cover"
                    src={coverSrc}
                    onError={(e) => { e.currentTarget.src = "/cover-placeholder.jpg" }}
                  />
                </div>
              </div>

              {/* Default View: Info & Playback (Right Column) */}
              <div className="flex flex-col gap-8 lg:gap-14 w-full max-w-[500px]">
                {/* Metadata */}
                <section className="space-y-4 text-center lg:text-center flex flex-col items-center">
                  <div>
                    <h1 className="text-[36px] md:text-display-lg font-bold tracking-tighter text-white mb-2 leading-tight">{track.title}</h1>
                    <p className="text-headline-md font-medium tracking-tight opacity-90" style={{ color: `rgb(${accent})` }}>
                      {artistName}
                    </p>
                  </div>
                  <p className="text-body-lg text-white/40 max-w-lg leading-relaxed font-light mx-auto">
                    {track.description || track.artist_bio || "A secure, private stream hosted on LinkNyter."}
                  </p>
                </section>

                {/* Playback System */}
                <section className="space-y-10">
                  {/* Timeline */}
                  <div className="space-y-3">
                    <div className="relative h-[1px] w-full bg-white/10 cursor-pointer group/rail" onClick={handleSeek}>
                      <div className="absolute top-0 left-0 h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover/rail:opacity-100 transition-opacity" style={{ left: `${progress}%`, boxShadow: '0 0 10px rgba(255,255,255,0.4)' }} />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold tracking-[0.15em] text-white/40 uppercase">
                      <span>{currentTime}</span>
                      <span>{duration}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center flex-col md:flex-row gap-8 md:gap-0 justify-center lg:gap-24">
                    <div className="flex items-center gap-10">
                      <button className="text-white/40 hover:text-white transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="16 18 9 12 16 6 16 18" />
                          <line x1="7" y1="18" x2="7" y2="6" />
                        </svg>
                      </button>
                      <button
                        onClick={togglePlay}
                        className="w-16 h-16 shrink-0 aspect-square rounded-full flex items-center justify-center text-white transition-all active:scale-95 hover:scale-105 hover:border-white/30"
                        style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        {isPlaying ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="7" y="6" width="3" height="12" rx="1" />
                            <rect x="14" y="6" width="3" height="12" rx="1" />
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="translate-x-0.5">
                            <path d="M7 5.5C7 4.5 8.1 3.9 8.9 4.4L18.4 10.9C19.1 11.4 19.1 12.6 18.4 13.1L8.9 19.6C8.1 20.1 7 19.5 7 18.5V5.5Z" />
                          </svg>
                        )}
                      </button>
                      <button className="text-white/40 hover:text-white transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="8 6 15 12 8 18 8 6" />
                          <line x1="17" y1="6" x2="17" y2="18" />
                        </svg>
                      </button>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-4 group">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 group-hover:text-white/60 transition-colors">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                      <div className="relative flex items-center w-24 h-4">
                        <div className="absolute w-full h-[2px] bg-white/20 rounded-full pointer-events-none" />
                        <div className="absolute h-[2px] bg-white/50 rounded-full pointer-events-none" style={{ width: `${volume * 100}%` }} />
                        <input 
                          type="range" 
                          min="0" max="1" step="0.01" 
                          value={volume} 
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ left: `calc(${volume * 100}% - 6px)` }} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Download Button */}
                {track.allow_downloads && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait text-white font-label-caps text-label-caps tracking-widest uppercase border border-white/10 hover:border-white/30 backdrop-blur-md shadow-xl"
                      style={{ boxShadow: isDownloading ? `0 0 20px rgba(${accent}, 0.2)` : 'none' }}
                    >
                      {isDownloading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span className="opacity-80">Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-[18px] h-[18px] group-hover:-translate-y-0.5 transition-transform" />
                          <span>Download Audio</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Social Links */}
                {hasSocials && (
                  <div className="pt-4 flex items-center gap-6 md:gap-8 border-t border-white/5 justify-center mx-auto flex-wrap">
                    {socialConfig.map(({ key, label, icon }) => {
                      const rawUrl = (socials as any)[key];
                      if (!rawUrl || !rawUrl.trim()) return null;
                      const url = rawUrl.trim().startsWith('http') ? rawUrl.trim() : `https://${rawUrl.trim()}`;
                      return (
                        <a key={key} href={url} target="_blank" rel="noopener noreferrer" onMouseDown={() => {
                          telemetry.current.social_clicks += 1;
                          telemetry.current.events.push({ action: `share_${key}`, timestamp: audioRef.current?.currentTime || 0, time: new Date().toISOString() });
                        }} className="group flex items-center justify-center text-white/40 hover:text-white transition-all">
                          <span className="group-hover:scale-110 transition-transform">{icon}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>

      <audio
        ref={audioRef}
        src={`/api/stream/${track.id}`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={handleTimeUpdate}
        onPlay={onPlay}
        onPause={onPause}
        onSeeked={onSeeked}
        className="hidden"
      />
    </div>
  );
}
