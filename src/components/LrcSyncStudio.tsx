"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, RotateCcw, Save, Trash2, Plus, Edit2, Keyboard, Check, AlertCircle, ArrowLeft, Music } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

interface LrcSyncStudioProps {
  track: any;
  onSaveSuccess: (updatedTrack: any) => void;
}

export interface SyncedLine {
  timestamp: string;
  text: string;
  seconds: number;
  isSection?: boolean;
}

export function LrcSyncStudio({ track, onSaveSuccess }: LrcSyncStudioProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhaseState] = useState<"paste" | "sync" | "edit">("paste");

  const setPhase = (newPhase: "paste" | "sync" | "edit") => {
    setPhaseState(newPhase);
    const stepStr = newPhase === "paste" ? "1" : newPhase === "sync" ? "2" : "3";
    router.push(`?trackId=${track.id}&step=${stepStr}`, { scroll: false });
  };

  useEffect(() => {
    const step = searchParams.get("step");
    if (step === "1" && phase !== "paste") setPhaseState("paste");
    else if (step === "2" && phase !== "sync") setPhaseState("sync");
    else if (step === "3" && phase !== "edit") setPhaseState("edit");
  }, [searchParams, phase]);
  const [timing, setTiming] = useState(track.lrc_timing || "600ms");
  const [rawLyrics, setRawLyrics] = useState("");
  const [lines, setLines] = useState<SyncedLine[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedRawLyrics, setHasUnsavedRawLyrics] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("00:00");
  const [durationStr, setDurationStr] = useState("00:00");
  const [initializedId, setInitializedId] = useState<string | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    onConfirm: () => {}
  });

  const requestConfirm = (title: string, message: string, confirmText: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Parse existing lrc_data if present
  useEffect(() => {
    if (initializedId === track.id) return;

    if (track.lrc_data) {
      const parsed = parseLrc(track.lrc_data);
      if (parsed.length > 0) {
        setLines(parsed);
        setRawLyrics(
          parsed
            .map((l) => (l.timestamp && l.timestamp !== "[00:00.00]" ? l.text : l.timestamp ? "" : l.text))
            .filter(Boolean)
            .join("\n")
        );
        setPhase("edit");
      }
    } else {
      setPhase("paste");
      setRawLyrics("");
      setLines([]);
    }
    setInitializedId(track.id);
  }, [track, initializedId]);

  // Handle Spacebar event in Phase A (Sync Mode)
  useEffect(() => {
    if (phase !== "sync") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!isPlaying) {
          togglePlay();
        } else {
          recordTimestamp();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase, isPlaying, activeIndex, lines]);

  // Force audio preload
  useEffect(() => {
    if ((phase === "sync" || phase === "edit") && audioRef.current) {
      audioRef.current.load();
    }
  }, [phase]);

  // Format time in seconds to LRC format: [mm:ss.xx]
  const formatLrcTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`;
  };

  const formatSimpleTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Parse [mm:ss.xx] back to total seconds
  const parseLrcTimeToSeconds = (timestamp: string): number => {
    const clean = timestamp.replace(/[\[\]]/g, "");
    const parts = clean.split(":");
    if (parts.length < 2) return 0;
    const mins = parseInt(parts[0], 10) || 0;
    const secParts = parts[1].split(".");
    const secs = parseInt(secParts[0], 10) || 0;
    const ms = secParts.length > 1 ? parseInt(secParts[1], 10) || 0 : 0;
    return mins * 60 + secs + ms / 100;
  };

  const parseLrc = (lrcString: string): SyncedLine[] => {
    if (!lrcString) return [];
    const rawLines = lrcString.split("\n");
    const parsed: SyncedLine[] = [];
    const lrcRegex = /^\[(\d+):(\d+)\.(\d+)\](.*)/;

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const match = trimmed.match(lrcRegex);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10);
        const totalSeconds = mins * 60 + secs + ms / 100;
        parsed.push({
          timestamp: `[${match[1]}:${match[2]}.${match[3]}]`,
          text: match[4].trim(),
          seconds: totalSeconds,
          isSection: false
        });
      } else {
        parsed.push({
          timestamp: "",
          text: trimmed,
          seconds: 0,
          isSection: /^\[.*?\]$/.test(trimmed)
        });
      }
    }
    return parsed;
  };

  const startSyncing = () => {
    if (!rawLyrics.trim()) {
      toast.error("Please paste or type some lyrics first!");
      return;
    }
    const rawLines = rawLyrics
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const formattedLines: SyncedLine[] = [
      { timestamp: "[00:00.00]", text: "...", seconds: 0, isSection: false },
      ...rawLines.map((text) => ({
        timestamp: "",
        text,
        seconds: 0,
        isSection: /^\[.*?\]$/.test(text)
      }))
    ];

    setLines(formattedLines);
    setActiveIndex(0);
    setPhase("sync");
    setIsPlaying(false);
  };

  const recordTimestamp = () => {
    if (phase !== "sync" || !audioRef.current) return;
    
    let nextIndex = activeIndex + 1;
    while (nextIndex < lines.length && lines[nextIndex].isSection) {
      nextIndex++;
    }

    if (nextIndex >= lines.length) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      toast.success("Lyrics fully timestamped! Transitioning to Micro-Editor.");
      setPhase("edit");
      setHasUnsavedChanges(true);
      return;
    }

    const currentTime = audioRef.current.currentTime;
    const formatted = formatLrcTime(currentTime);

    setLines((prev) => {
      const updated = [...prev];
      updated[nextIndex] = {
        ...updated[nextIndex],
        timestamp: formatted,
        seconds: currentTime,
      };
      return updated;
    });

    setActiveIndex(nextIndex);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    setProgress((cur / dur) * 100 || 0);
    setCurrentTimeStr(formatSimpleTime(cur));
    if (dur && !isNaN(dur) && isFinite(dur)) {
      setDurationStr(formatSimpleTime(dur));
    }
  };

  const backToText = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setPhase("paste");
  };

  const resetSync = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setLines((prev) => {
      const reset = prev.map((l) => ({ ...l, timestamp: "", seconds: 0 }));
      if (reset.length > 0) {
        reset[0] = { timestamp: "[00:00.00]", text: reset[0].text || "...", seconds: 0, isSection: false };
      }
      return reset;
    });
    setActiveIndex(0);
  };

  const handleSetTiming = (newTiming: string) => {
    setTiming(newTiming);
    setHasUnsavedChanges(true);
  };

  const updateLineTimestamp = (index: number, val: string) => {
    // Basic formatting correction: allow typing, but compute raw seconds
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        timestamp: val,
        seconds: parseLrcTimeToSeconds(val),
      };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const updateLineText = (index: number, val: string) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        text: val,
      };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const getPrevSyncIndex = (currentIndex: number) => {
    let idx = currentIndex - 1;
    while (idx > 0 && lines[idx]?.isSection) idx--;
    return idx;
  };

  const getNextSyncIndex = (currentIndex: number) => {
    let idx = currentIndex + 1;
    while (idx < lines.length && lines[idx]?.isSection) idx++;
    return idx;
  };

  const getSectionsForLine = (index: number) => {
    if (index < 0 || index >= lines.length) return null;
    const sections = [];
    let iter = index - 1;
    while (iter >= 0 && lines[iter]?.isSection) {
      sections.unshift(lines[iter].text.replace(/[\[\]]/g, '').trim());
      iter--;
    }
    return sections.length > 0 ? sections.join(" • ") : null;
  };

  const deleteLineEditRow = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const addLineEditRow = (index: number) => {
    setLines((prev) => {
      const updated = [...prev];
      const prevSecs = index >= 0 ? updated[index].seconds : 0;
      const placeholderTimestamp = formatLrcTime(prevSecs + 1.0);
      updated.splice(index + 1, 0, {
        timestamp: placeholderTimestamp,
        text: "",
        seconds: prevSecs + 1.0,
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const saveLrcData = async () => {
    setIsSaving(true);
    try {
      // Compile lines to single standard LRC string
      const lrcString = lines
        .map((l) => l.isSection ? l.text : `${l.timestamp || "[00:00.00]"} ${l.text}`)
        .join("\n");

      const response = await fetch(`/api/track/${track.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lrc_data: lrcString, lrc_timing: timing }),
      });

      if (!response.ok) throw new Error("Failed to save synced lyrics");
      const resJson = await response.json();
      onSaveSuccess(resJson.track);
      setHasUnsavedChanges(false);
      toast.success("Lyrics sync saved successfully!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "An error occurred while saving lyrics.");
    } finally {
      setIsSaving(false);
    }
  };

  const clearLrcData = async () => {
    requestConfirm(
      "Delete Synced Lyrics",
      "Are you sure you want to completely remove the synced lyrics for this track? This action cannot be undone.",
      "Delete Lyrics",
      async () => {
        setIsSaving(true);
        try {
          const response = await fetch(`/api/track/${track.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lrc_data: null }),
          });

          if (!response.ok) throw new Error("Failed to clear lyrics");
          const resJson = await response.json();
          onSaveSuccess(resJson.track);
          setPhase("paste");
          setRawLyrics("");
          setLines([]);
          setHasUnsavedRawLyrics(false);
          toast.success("Lyrics removed successfully!");
        } catch (e: any) {
          console.error(e);
          toast.error(e.message || "An error occurred while removing lyrics.");
        } finally {
          setIsSaving(false);
        }
      }
    );
  };

  const saveRawLyrics = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/track/${track.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lrc_data: rawLyrics }),
      });
      if (!response.ok) throw new Error("Failed to save lyrics");
      const resJson = await response.json();
      onSaveSuccess(resJson.track);
      setHasUnsavedRawLyrics(false);
      toast.success("Lyrics text saved successfully!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to save lyrics.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-[1280px] mx-auto w-full flex flex-col relative z-10">
      
      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-up-fade">
            <h3 className="text-[20px] font-headline-md font-bold text-on-surface mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-error" />
              {confirmDialog.title}
            </h3>
            <p className="text-[14px] text-on-surface-variant mb-8">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2 rounded-xl text-[12px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  confirmDialog.onConfirm();
                }}
                className="px-5 py-2 rounded-xl text-[12px] font-bold uppercase tracking-widest bg-error hover:bg-error/90 text-on-error shadow-lg shadow-error/20 transition-colors"
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Background Atmospheric Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* PHASE 1: Paste lyrics */}
      {phase === "paste" && (
        <div className="flex-1 max-w-container-max mx-auto w-full flex flex-col p-margin-desktop z-10">
          
          <div className="mb-6">
            <button onClick={() => router.push('/lrc-sync')} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-body-lg text-[16px] font-medium">Back to Track Selection</span>
            </button>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full font-label-caps text-[12px] font-bold uppercase">Step 1</span>
              <div className="h-px flex-1 bg-outline-variant/20"></div>
            </div>
            <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-2">LRC Sync Studio</h2>
            <p className="text-on-surface-variant font-body-lg text-[16px] opacity-80">Paste your track lyrics below. Ensure each sentence is on a new line for precise synchronization.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter flex-1 min-h-0">
            <div className="lg:col-span-8 flex flex-col">
              <div className="obsidian-container rounded-xl flex-1 flex flex-col overflow-hidden relative transition-shadow duration-500 shadow-[0_0_60px_15px_rgba(139,92,246,0.25)]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 bg-surface/30">
                  <span className="font-label-caps text-[12px] font-bold text-on-surface-variant uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">notes</span>
                    Lyrics Editor
                  </span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setRawLyrics(''); setHasUnsavedRawLyrics(true); }}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/50 hover:text-error transition-colors"
                      title="Clear notepad"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={saveRawLyrics}
                      disabled={isSaving || rawLyrics.trim().length === 0 || !hasUnsavedRawLyrics}
                      className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                      title="Save lyrics"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea 
                  className="flex-1 bg-transparent border-none resize-none p-8 font-body-lg text-[16px] leading-relaxed custom-scrollbar text-on-surface placeholder:text-outline-variant/40 focus:outline-none focus:border-primary focus:ring-0" 
                  id="lyrics-input" 
                  value={rawLyrics}
                  onChange={(e) => {
                    setRawLyrics(e.target.value);
                    setHasUnsavedRawLyrics(true);
                  }}
                  placeholder="Start typing or paste your lyrics here...&#10;&#10;[Verse 1]&#10;In the echo of the night&#10;We find our hidden light..."
                ></textarea>
                <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant/10 bg-surface/30">
                  <span className="font-label-caps text-[12px] font-bold text-on-surface-variant uppercase" id="line-count">
                    {rawLyrics.split('\n').filter(l => l.trim().length > 0).length} Lines
                  </span>
                  {track.lrc_data && (
                    <button 
                      onClick={clearLrcData}
                      disabled={isSaving}
                      className="font-label-caps text-[12px] font-bold text-error hover:text-error/80 transition-colors uppercase disabled:opacity-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isSaving ? "Deleting..." : "Delete Lyrics"}
                    </button>
                  )}
                </div>
                <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 focus-within:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6 relative z-10">
              <div className="glass-panel rounded-xl p-6">
                <h3 className="font-headline-md text-[20px] font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  Pro Tips
                </h3>
                <ul className="space-y-4 text-on-surface-variant text-[14px] leading-relaxed">
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Use square brackets for section labels like <code className="text-primary bg-primary/5 px-1 rounded">[Chorus]</code>. These are ignored in timing but help navigation.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Keep lines short. Long sentences might be cut off on smaller mobile player screens.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Syncing works by tapping the spacebar. Ready your rhythm before the next step.</span>
                  </li>
                </ul>
              </div>

              <div className="obsidian-container rounded-xl p-6 mt-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0 border border-outline-variant/50" style={{ backgroundImage: `url('${track.cover_url || "/cover-placeholder.jpg"}')` }}>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[14px] font-bold text-on-surface truncate">{track.title || "Unknown Track"}</p>
                    <p className="text-[10px] text-on-surface-variant opacity-60 uppercase tracking-widest truncate">Draft • 3:45 Duration</p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/lrc-sync')}
                  className="w-full py-3 px-4 border border-outline-variant/20 rounded-lg text-[14px] font-medium hover:bg-surface-variant/30 transition-colors flex items-center justify-between group"
                >
                  <span>Change Track</span>
                  <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-end border-t border-outline-variant/10 pt-8 pb-4">
            <button 
              onClick={startSyncing} 
              disabled={rawLyrics.trim().length === 0} 
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary px-8 py-3.5 rounded-full font-bold flex items-center gap-3 transition-all transform active:scale-95 group relative overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            >
              <span className="relative z-10">Start Sync Performance</span>
              <span className="material-symbols-outlined relative z-10 group-hover:translate-x-1 transition-transform">bolt</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: Spacebar performance sync */}
      {phase === "sync" && (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full min-h-[500px]">
          {/* Back Button */}
          <button 
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
              }
              setPhase("paste");
            }}
            className="absolute top-12 left-8 md:left-12 px-5 py-2 border border-outline-variant hover:bg-surface-container-high rounded-xl text-[12px] font-bold tracking-widest uppercase transition-colors flex items-center gap-2 z-50 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back
          </button>

          {/* Sync Status Header */}
          <div className="absolute top-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 bg-surface-container-high/50 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/30">
              <div className="w-2.5 h-2.5 bg-primary rounded-full recording-pulse shadow-[0_0_8px_#d0bcff]"></div>
              <span className="text-[12px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Recording Sync Performance</span>
            </div>
            <div className="text-center">
              <p className="text-on-surface-variant text-[14px] font-medium">Synchronizing: <span className="text-on-surface font-bold">{track.title || "Unknown Track"}</span></p>
            </div>
          </div>
          
          <audio
            ref={audioRef}
            src={`/api/stream/${track.id}`}
            preload="auto"
            onLoadedMetadata={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            className="hidden"
          />

          {/* Lyrics Display - Focused Centerpiece */}
          <div className="w-full max-w-4xl text-center space-y-12">
            {/* Previous Line (Ghosted) */}
            <div className="opacity-20 relative flex justify-center min-h-[40px] items-center">
              {(() => {
                const prevIdx = getPrevSyncIndex(activeIndex);
                const section = activeIndex > 0 ? getSectionsForLine(prevIdx) : null;
                return (
                  <div key={`prev-${activeIndex}`} className="animate-slide-up-fade flex flex-col items-center justify-center relative w-full">
                    {section && <span className="absolute -top-5 text-[10px] font-bold text-outline-variant tracking-widest uppercase">{section}</span>}
                    <p className="font-headline-md text-[20px] font-medium text-on-surface-variant">
                      {activeIndex > 0 ? lines[prevIdx]?.text || " " : " "}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Current Line (Primary Focus) */}
            <div className="relative py-4 bg-transparent flex justify-center min-h-[100px] items-center">
              {(() => {
                const section = getSectionsForLine(activeIndex);
                return (
                  <div key={`curr-${activeIndex}`} className="animate-slide-up-fade flex flex-col items-center justify-center relative w-full">
                    {section && <span className="absolute -top-2 text-[14px] font-bold text-primary tracking-[0.2em] uppercase" style={{ textShadow: "rgba(139, 92, 246, 0.4) 0px 0px 10px" }}>{section}</span>}
                    <h2 
                      className="font-display-lg text-[48px] text-primary relative px-8 leading-tight" 
                      style={{ textShadow: "rgba(139, 92, 246, 0.6) 0px 0px 20px", fontWeight: 500 }}
                    >
                      {activeIndex < lines.length ? lines[activeIndex]?.text || "" : "Recording Completed!"}
                    </h2>
                  </div>
                );
              })()}
            </div>

            {/* Upcoming Line (Sub-focus) */}
            <div className="opacity-40 relative flex justify-center min-h-[50px] items-center">
              {(() => {
                const nextIdx = getNextSyncIndex(activeIndex);
                const section = nextIdx < lines.length ? getSectionsForLine(nextIdx) : null;
                return (
                  <div key={`next-${activeIndex}`} className="animate-slide-up-fade flex flex-col items-center justify-center relative w-full">
                    {section && <span className="absolute -top-5 text-[12px] font-bold text-primary tracking-widest uppercase">{section}</span>}
                    <p className="font-headline-lg text-[32px] font-semibold text-on-surface-variant">
                      {nextIdx < lines.length ? lines[nextIdx]?.text || " " : " "}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Controls & Progress Dock */}
          <div className="absolute bottom-12 w-full max-w-3xl px-8">
            <div className="glass-panel rounded-2xl p-6 shadow-2xl space-y-6 relative">
              {/* Keyboard Interaction Indicator */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <kbd className="px-6 py-2 bg-[#1a1b1f] border border-outline-variant/30 rounded-xl font-bold text-on-surface-variant text-[14px] shadow-lg tracking-wider">SPACEBAR</kbd>
              </div>

              {/* Audio Progress */}
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                  <span>{currentTimeStr}</span>
                  <span>{durationStr}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(208,188,255,0.5)] transition-all duration-100 ease-out" style={{ width: `${progress}%` }}></div>
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-4 border-surface shadow-lg transition-all duration-100 ease-out" style={{ left: `calc(${progress}% - 8px)` }}></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6">
                {/* Left Side */}
                <div className="flex-1 flex justify-start items-center">
                  <button 
                    onClick={resetSync}
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">restart_alt</span>
                    <span className="text-[14px] font-bold">Reset Sync</span>
                  </button>
                </div>

                {/* Center Side */}
                <div className="flex flex-col shrink-0 justify-center items-center gap-3 px-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Current Step</span>
                    <span className="text-[14px] font-bold text-primary whitespace-nowrap">Line {activeIndex < lines.length ? activeIndex : lines.length} / {lines.length}</span>
                  </div>
                  <button 
                    onClick={togglePlay}
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-primary text-on-primary hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(208,188,255,0.6)]"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current pl-1" />}
                  </button>
                </div>

                {/* Right Side */}
                <div className="flex-1 flex justify-end items-center">
                  <button 
                    onClick={() => setPhase("edit")}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Finish Performance</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: Micro-Editor */}
      {phase === "edit" && (
        <div className="flex-1 flex flex-col p-8 max-w-[1400px] mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[12px] font-semibold tracking-widest uppercase">Step 3</span>
              </div>
              <h2 className="text-[32px] font-bold text-on-surface">Fine-Tuning & Export</h2>
              <p className="text-on-surface-variant text-[16px] opacity-80 mt-1">Perfect your timing. Adjust timestamps directly or use the quick actions.</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  requestConfirm(
                    "Retry Performance",
                    "Are you sure you want to discard these timestamps and try the performance again?",
                    "Retry",
                    () => {
                      resetSync();
                      setPhase("sync");
                    }
                  );
                }}
                className="px-6 py-2 border border-outline-variant hover:bg-surface-container-high rounded-xl text-[12px] font-bold tracking-widest uppercase transition-colors"
              >
                Retry Performance
              </button>
              <button 
                onClick={() => {
                  requestConfirm(
                    "Discard Lyrics",
                    "Discard this track's lyrics entirely and start over?",
                    "Discard",
                    () => backToText()
                  );
                }}
                className="px-6 py-2 border border-outline-variant hover:bg-surface-container-high rounded-xl text-[12px] font-bold tracking-widest uppercase transition-colors text-error hover:text-error/90 hover:bg-error/10"
              >
                Discard
              </button>
              <button 
                onClick={saveLrcData}
                disabled={isSaving || !hasUnsavedChanges}
                className="px-8 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary rounded-xl text-[12px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save & Publish"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-[500px]">
            {/* Left Side: Mini Player & Audio Viz */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/20 relative">
                  <img 
                    src={track.cover_url || "/cover-placeholder.jpg"} 
                    alt={track.title || "Track Cover"} 
                    className="w-full h-full object-cover"
                  />
                  <audio
                    ref={audioRef}
                    src={`/api/stream/${track.id}`}
                    preload="auto"
                    onLoadedMetadata={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    className="hidden"
                  />
                </div>
                <a 
                  href={`/t/${track.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface hover:bg-surface-container-high border border-outline-variant/20 text-[12px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Open in new tab
                </a>
              </div>

              <div className="obsidian-container rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] font-bold tracking-widest uppercase text-on-surface-variant">Animation Speed</span>
                  <span className="text-[12px] text-primary">{timing === "400ms" ? "Fast" : timing === "1000ms" ? "Relaxed" : "Default"}</span>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => handleSetTiming("400ms")}
                    className={`w-full py-3 rounded-xl text-[14px] font-medium transition-colors text-left px-4 flex justify-between items-center ${timing === "400ms" ? "bg-surface-container-high hover:bg-outline-variant/20 border border-primary/30 text-on-surface" : "bg-surface hover:bg-surface-container-high text-on-surface-variant border border-transparent"}`}
                  >
                    <span>Fast</span>
                    {timing === "400ms" && <Check className="w-4 h-4 text-primary" />}
                  </button>
                  <button 
                    onClick={() => handleSetTiming("600ms")}
                    className={`w-full py-3 rounded-xl text-[14px] font-medium transition-colors text-left px-4 flex justify-between items-center ${timing === "600ms" ? "bg-surface-container-high hover:bg-outline-variant/20 border border-primary/30 text-on-surface" : "bg-surface hover:bg-surface-container-high text-on-surface-variant border border-transparent"}`}
                  >
                    <span>Default</span>
                    {timing === "600ms" && <Check className="w-4 h-4 text-primary" />}
                  </button>
                  <button 
                    onClick={() => handleSetTiming("1000ms")}
                    className={`w-full py-3 rounded-xl text-[14px] font-medium transition-colors text-left px-4 flex justify-between items-center ${timing === "1000ms" ? "bg-surface-container-high hover:bg-outline-variant/20 border border-primary/30 text-on-surface" : "bg-surface hover:bg-surface-container-high text-on-surface-variant border border-transparent"}`}
                  >
                    <span>Relaxed</span>
                    {timing === "1000ms" && <Check className="w-4 h-4 text-primary" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: The Editor List */}
            <div className="lg:col-span-8 obsidian-container rounded-2xl overflow-hidden flex flex-col">
              <div className="grid grid-cols-[60px_100px_1fr_100px] gap-4 p-4 border-b border-outline-variant/10 bg-surface/50 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                <div className="text-center">Line</div>
                <div>Time</div>
                <div>Lyric</div>
                <div className="text-center">Actions</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-[60px_100px_1fr_100px] gap-4 items-center p-3 rounded-xl hover:bg-surface-container-high/50 transition-colors group/row">
                    <div className="text-center text-[12px] font-mono text-outline-variant group-hover/row:text-primary transition-colors">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <div>
                      {!line.isSection ? (
                        <input 
                          type="text" 
                          value={line.timestamp}
                          onChange={(e) => updateLineTimestamp(idx, e.target.value)}
                          className="bg-surface border border-outline-variant/20 focus:border-primary focus:ring-1 focus:ring-primary/50 text-primary font-mono text-[13px] rounded-lg px-2 py-1.5 w-full outline-none transition-all"
                        />
                      ) : (
                        <div className="flex items-center h-full px-2">
                          <span className="text-[10px] uppercase font-bold text-outline-variant tracking-widest border border-outline-variant/30 px-2 py-0.5 rounded-full">Section</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={line.text}
                        onChange={(e) => updateLineText(idx, e.target.value)}
                        className={`bg-transparent border border-transparent hover:border-outline-variant/20 focus:bg-surface focus:border-outline-variant/40 rounded-lg px-3 py-1.5 w-full outline-none transition-all ${line.isSection ? 'text-primary font-bold text-[16px]' : 'text-on-surface text-[14px]'}`}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button 
                        onClick={() => addLineEditRow(idx)}
                        className="p-1.5 text-outline-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Add row"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteLineEditRow(idx)}
                        className="p-1.5 text-outline-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        title="Delete row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {lines.length === 0 && (
                  <div className="text-center py-12 text-on-surface-variant/50">
                    No lyrics entered yet. Add lines above or start a new sync.
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-outline-variant/10 bg-surface/30">
                <button 
                  onClick={() => addLineEditRow(-1)}
                  className="w-full py-3 border border-dashed border-outline-variant/40 hover:border-primary/50 hover:bg-primary/5 rounded-xl text-[12px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Line
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
