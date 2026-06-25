"use client";

import { useState } from "react";
import { ArrowLeft, Play, Pause, FastForward, Download, Share2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export function TrackAnalyticsClient({ track, sessions }: { track: any, sessions: any[] }) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalOpens = sessions.length;
  const avgListenTime = totalOpens > 0 ? Math.round(sessions.reduce((acc, s) => acc + (s.total_listen_time_seconds || 0), 0) / totalOpens) : 0;
  const downloads = sessions.filter(s => s.download_clicked).length;
  const socialClicks = sessions.filter(s => s.social_links_clicked).length;

  const getEventIcon = (action: string) => {
    switch (action) {
      case 'play': return <Play className="w-3 h-3 text-primary" />;
      case 'pause': return <Pause className="w-3 h-3 text-on-surface-variant" />;
      case 'seeked': return <FastForward className="w-3 h-3 text-secondary" />;
      default: return null;
    }
  };

  return (
    <div className="relative w-full h-full p-12 pr-16 z-10">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>
      
      <Link href="/analytics" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-8 font-label-caps uppercase text-xs">
        <ArrowLeft className="w-4 h-4" /> Back to Overview
      </Link>

      <header className="flex items-center gap-6 mb-10">
        <div className="w-24 h-24 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-high shrink-0 shadow-2xl">
          <img className="w-full h-full object-cover" src={track.cover_url || "/cover-placeholder.jpg"} alt={track.title} />
        </div>
        <div>
          <span className="font-label-caps text-label-caps text-primary mb-2 block tracking-[0.2em] uppercase">Deep Dive</span>
          <h2 className="font-display-lg text-display-lg text-on-surface">{track.title}</h2>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-6 flex flex-col justify-between transition-all hover:border-outline-variant hover:-translate-y-0.5">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Tracked Opens</span>
          <div className="text-3xl font-headline-lg font-black text-on-surface">{totalOpens}</div>
        </div>
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-6 flex flex-col justify-between transition-all hover:border-outline-variant hover:-translate-y-0.5">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Avg. Listen Time</span>
          <div className="text-3xl font-headline-lg font-black text-on-surface">{formatTime(avgListenTime)}</div>
        </div>
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-6 flex flex-col justify-between transition-all hover:border-outline-variant hover:-translate-y-0.5">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Downloads</span>
          <div className="text-3xl font-headline-lg font-black text-on-surface">{downloads}</div>
        </div>
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl p-6 flex flex-col justify-between transition-all hover:border-outline-variant hover:-translate-y-0.5">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">Social Clicks</span>
          <div className="text-3xl font-headline-lg font-black text-on-surface">{socialClicks}</div>
        </div>
      </div>

      <section>
        <h3 className="font-headline-sm text-on-surface mb-6">Listener Sessions</h3>
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant bg-surface-container-low/50 rounded-2xl border border-outline-variant/50">
              No sessions recorded yet. Share a tracking link to get started!
            </div>
          ) : sessions.map(session => (
            <div key={session.id} className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-2xl overflow-hidden transition-colors hover:border-outline-variant">
              <div 
                className="p-6 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              >
                <div>
                  <div className="font-body-lg font-semibold text-on-surface flex items-center gap-3">
                    {session.tracking_links?.reference_name || 'Open Link'}
                    {session.download_clicked && <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-sm font-label-caps uppercase flex items-center gap-1"><Download className="w-3 h-3"/> Downloaded</span>}
                  </div>
                  <div className="text-sm text-on-surface-variant mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(session.started_at).toLocaleDateString()} at {new Date(session.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="font-body-lg text-primary">{formatTime(session.total_listen_time_seconds || 0)}</div>
                    <div className="text-[10px] text-on-surface-variant uppercase mt-1 tracking-wider">Listen Time</div>
                  </div>
                  <button className="text-on-surface-variant p-2 hover:bg-surface-container-high rounded-full transition-colors">
                    {expandedSession === session.id ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                  </button>
                </div>
              </div>

              {/* Expanded Event Timeline */}
              {expandedSession === session.id && (
                <div className="border-t border-outline-variant/30 bg-surface-container-lowest/50 p-6">
                  <h4 className="font-label-caps text-[10px] uppercase text-on-surface-variant tracking-wider mb-4">Playback Timeline</h4>
                  <div className="relative border-l border-outline-variant/50 ml-2 space-y-6">
                    {(session.event_log || []).length === 0 ? (
                      <div className="pl-6 text-sm text-on-surface-variant">No detailed events logged.</div>
                    ) : (
                      session.event_log.map((ev: any, i: number) => (
                        <div key={i} className="relative pl-6">
                          <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-primary flex items-center justify-center">
                            {/* Inner dot */}
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-on-surface">{formatTime(ev.timestamp)}</span>
                            <span className="text-on-surface-variant text-xs uppercase tracking-wider font-label-caps flex items-center gap-1">
                              {getEventIcon(ev.action)}
                              {ev.action === 'seeked' ? 'Scrubbed to' : ev.action}
                            </span>
                            <span className="text-xs text-outline ml-auto">{new Date(ev.time).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
