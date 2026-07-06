"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Download, RotateCcw, RotateCw } from "lucide-react";
import { InstagramIcon, TwitterIcon, YouTubeIcon, SpotifyIcon, AppleMusicIcon, GlobeIcon } from "@/components/SocialIcons";
import Link from "next/link";

import TwoLineLyrics from "@/components/TwoLineLyrics";
import { BioDescription } from "@/components/BioDescription";

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
  const [accent, setAccent] = useState("255, 255, 255");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolume] = useState(1);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hasTrackedPlay = useRef(false);
  const isDraggingRef = useRef(false);

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

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 5);
    }
  };



  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  useEffect(() => {
    async function loadTrack() {
      const resolvedParams = await params;

      const urlParams = new URLSearchParams(window.location.search);
      const trackingRef = urlParams.get('ref');

      if (trackingRef) {
        const { data: linkData, error: linkError } = await supabase
          .from('tracking_links')
          .select('id')
          .eq('custom_slug', trackingRef)
          .single();
          
        if (linkError || !linkData) {
          setTrack(null);
          setLoading(false);
          return;
        }
      }

      const { data: trackData } = await supabase
        .from('tracks').select('*').eq('slug', resolvedParams.slug).single();
      if (trackData) {
        const { data: profile } = await supabase
          .from('profiles').select('name, bio, social_links').eq('email', trackData.user_email).single();
        setTrack({ ...trackData, artist_name: trackData.artist || profile?.name, artist_bio: profile?.bio, social_links: profile?.social_links });
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

  useEffect(() => {
    if (isPlaying && !hasTrackedPlay.current && track) {
      hasTrackedPlay.current = true;
      fetch(`/api/track/${track.id}/play`, { method: 'POST' }).catch(err => console.error('Failed to log play:', err));
    }
  }, [isPlaying, track]);

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
      if (document.visibilityState === 'hidden') sendBeacon();
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', sendBeacon);
    return () => {
      sendBeacon();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', sendBeacon);
    };
  }, [track]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime, tot = audioRef.current.duration;
    if (!isDraggingRef.current) {
      setProgress((cur / tot) * 100 || 0);
      setCurrentTime(formatTime(cur));
    }
    if (tot && tot !== Infinity && !isNaN(tot)) setDuration(formatTime(tot));
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const calculateProgress = (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current?.duration) return null;
    const rect = e.currentTarget.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, pct));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pct = calculateProgress(e);
    if (pct !== null) {
      setProgress(pct * 100);
      setCurrentTime(formatTime(pct * (audioRef.current?.duration || 0)));
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const pct = calculateProgress(e);
    if (pct !== null) {
      setProgress(pct * 100);
      setCurrentTime(formatTime(pct * (audioRef.current?.duration || 0)));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const pct = calculateProgress(e);
    if (pct !== null && audioRef.current) {
      audioRef.current.currentTime = pct * audioRef.current.duration;
      setProgress(pct * 100);
    }
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

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden" style={{ backgroundColor: '#060607', color: '#e3e2e7', fontFamily: "'Geist', sans-serif" }}>

      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-40 blur-3xl scale-125">
          <img src={`/_next/image?url=${encodeURIComponent(coverSrc)}&w=1080&q=75`} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] pointer-events-none" style={{ background: `radial-gradient(circle, rgba(${accent}, 0.12) 0%, rgba(${accent}, 0) 70%)`, filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-30%] left-[-10%] w-[80vw] h-[80vw] pointer-events-none" style={{ background: `radial-gradient(circle, rgba(${accent}, 0.08) 0%, rgba(${accent}, 0) 70%)`, filter: 'blur(150px)' }} />
        {/* Dark Overlay for better legibility */}
        <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
      </div>

      <nav className="absolute top-0 left-0 w-full h-20 flex items-center justify-between px-4 md:px-12 z-50">
        <Link href="/" className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.svg" alt="LinkNyter Logo" className="h-8 md:h-10 w-auto" />
          <span className="text-headline-md font-bold tracking-tight text-white/90">LinkNyter</span>
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start pt-[max(6rem,calc(50vh-300px))] px-4 md:px-12 pb-12 min-h-[100dvh]">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-10 lg:gap-12 xl:gap-16 items-stretch mx-auto">
          
          <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[400px] xl:max-w-[500px] transition-all duration-500">
            <div className="absolute inset-0 bg-white/5 blur-2xl rounded-2xl opacity-0 transition-opacity duration-1000" />
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 transition-all duration-1000" style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)' }}>
              <img
                ref={imgRef}
                alt={track.title}
                className="w-full h-full object-cover animate-fade-in"
                src={`/_next/image?url=${encodeURIComponent(coverSrc)}&w=1080&q=75`}
                onError={(e) => { e.currentTarget.src = "/cover-placeholder.jpg" }}
              />
              {/* MOBILE ONLY: Track Title on Cover Art */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none lg:hidden" />
              <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 flex flex-col justify-end lg:hidden">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter text-white mb-1.5 leading-tight drop-shadow-lg">{track.title}</h1>
                <p className="text-body-lg font-medium tracking-tight opacity-90 drop-shadow-md" style={{ color: `rgb(${accent})` }}>
                  {artistName}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full max-w-xl mx-auto lg:mx-0 min-h-full">
            <div className="flex flex-col gap-4 lg:gap-6">
              {/* DESKTOP ONLY: Track Title & Description */}
              <section className={`hidden lg:block space-y-4 order-2 lg:order-1 ${track.lrc_data ? 'text-left' : 'text-center lg:text-left'}`}>
                <div>
                  <h1 className="text-3xl sm:text-[36px] md:text-display-lg font-bold tracking-tighter text-white mb-2 leading-tight">{track.title}</h1>
                  <p className="text-headline-md font-medium tracking-tight opacity-90" style={{ color: `rgb(${accent})` }}>
                    {artistName}
                  </p>
                </div>
                <BioDescription 
                  text={track.description || track.artist_bio} 
                  className={track.lrc_data ? 'items-start' : 'items-start mx-auto lg:mx-0'} 
                />
              </section>

              {track.lrc_data && (
                <div className="order-1 lg:order-2 w-full mt-auto mb-0">
                  <TwoLineLyrics 
                    lrcData={track.lrc_data} 
                    isPlaying={isPlaying} 
                    audioRef={audioRef} 
                    accent={accent} 
                    lrcTiming={track.lrc_timing}
                  />
                </div>
              )}

              {/* MOBILE ONLY BIO - Displayed regardless of lyrics */}
              <div className={`lg:hidden w-full pb-0 order-3 ${track.lrc_data ? 'mt-4 mb-0' : 'mt-auto mb-0'}`}>
                <BioDescription 
                  text={track.description || track.artist_bio} 
                  className="items-start mx-auto" 
                />
              </div>
            </div>

            <section className={`w-full lg:mt-auto space-y-6 lg:space-y-8 pt-4 lg:pt-8`}>
              <div className="space-y-3">
                <div 
                  className="relative py-6 md:py-4 w-full cursor-pointer group/rail flex items-center" 
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <div className="relative h-[1px] w-full bg-white/10 rounded-full">
                    <div className="absolute top-0 left-0 h-full bg-white transition-all duration-75 ease-out rounded-full" style={{ width: `${progress}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover/rail:opacity-100 transition-all duration-75 ease-out" style={{ left: `${progress}%`, boxShadow: '0 0 10px rgba(255,255,255,0.4)' }} />
                  </div>
                </div>
                <div className="flex justify-between text-[11px] font-semibold tracking-[0.15em] text-white/40 uppercase">
                  <span>{currentTime}</span>
                  <span>{duration}</span>
                </div>
              </div>

              <div className="flex items-center flex-col md:flex-row gap-8 md:gap-0 justify-center lg:gap-24">
                <div className="flex items-center gap-6 md:gap-10">
                  <button onClick={skipBackward} className="relative text-white/40 hover:text-white transition-colors active:scale-95" aria-label="Skip Backward 5s">
                    <RotateCcw className="w-7 h-7 stroke-[1.5]" />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">5</span>
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-20 h-20 lg:w-16 lg:h-16 shrink-0 aspect-square rounded-full flex items-center justify-center text-white transition-all active:scale-95 hover:scale-105 hover:border-white/30"
                    style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {isPlaying ? (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="7" y="6" width="3" height="12" rx="1" />
                        <rect x="14" y="6" width="3" height="12" rx="1" />
                      </svg>
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="translate-x-0.5">
                        <path d="M7 5.5C7 4.5 8.1 3.9 8.9 4.4L18.4 10.9C19.1 11.4 19.1 12.6 18.4 13.1L8.9 19.6C8.1 20.1 7 19.5 7 18.5V5.5Z" />
                      </svg>
                    )}
                  </button>
                  <button onClick={skipForward} className="relative text-white/40 hover:text-white transition-colors active:scale-95" aria-label="Skip Forward 5s">
                    <RotateCw className="w-7 h-7 stroke-[1.5]" />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">5</span>
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-4 group">
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

            {track.allow_downloads && (
              <div className="flex justify-center mt-10">
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

            {hasSocials && (
              <div className="mt-12 pt-8 flex items-center gap-6 md:gap-8 border-t border-white/5 justify-center mx-auto flex-wrap w-full">
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
