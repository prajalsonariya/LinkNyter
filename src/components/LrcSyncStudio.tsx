"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, RotateCcw, Save, Trash2, Plus, Edit2, Keyboard, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface LrcSyncStudioProps {
  track: any;
  onSaveSuccess: (updatedTrack: any) => void;
}

interface SyncedLine {
  timestamp: string; // e.g. "[00:12.50]"
  text: string;
  seconds: number;
}

export function LrcSyncStudio({ track, onSaveSuccess }: LrcSyncStudioProps) {
  const [phase, setPhase] = useState<"paste" | "sync" | "edit">("paste");
  const [rawLyrics, setRawLyrics] = useState("");
  const [lines, setLines] = useState<SyncedLine[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Parse existing lrc_data if present
  useEffect(() => {
    if (track.lrc_data) {
      const parsed = parseLrc(track.lrc_data);
      if (parsed.length > 0) {
        setLines(parsed);
        setPhase("edit");
      }
    } else {
      setPhase("paste");
      setRawLyrics("");
      setLines([]);
    }
  }, [track]);

  // Handle Spacebar event in Phase A (Sync Mode)
  useEffect(() => {
    if (phase !== "sync" || !isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        recordTimestamp();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase, isPlaying, activeIndex, lines]);

  // Format time in seconds to LRC format: [mm:ss.xx]
  const formatLrcTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`;
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
        });
      } else {
        parsed.push({
          timestamp: "",
          text: trimmed,
          seconds: 0,
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
      { timestamp: "[00:00.00]", text: "🎵", seconds: 0 },
      ...rawLines.map((text) => ({
        timestamp: "",
        text,
        seconds: 0,
      }))
    ];

    setLines(formattedLines);
    setActiveIndex(1); // Start at the first actual lyric
    setPhase("sync");
    setIsPlaying(false);
  };

  const recordTimestamp = () => {
    if (!audioRef.current || activeIndex >= lines.length) return;

    const currentTime = audioRef.current.currentTime;
    const formatted = formatLrcTime(currentTime);

    setLines((prev) => {
      const updated = [...prev];
      updated[activeIndex] = {
        ...updated[activeIndex],
        timestamp: formatted,
        seconds: currentTime,
      };
      return updated;
    });

    // Auto-scroll inside Phase A list
    if (listContainerRef.current) {
      const activeEl = listContainerRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        const container = listContainerRef.current;
        container.scrollTo({
          top: activeEl.offsetTop - (container.offsetHeight / 2) + (activeEl.offsetHeight / 2),
          behavior: "smooth",
        });
      }
    }

    if (activeIndex + 1 >= lines.length) {
      // Finished all lines!
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      toast.success("Lyrics fully timestamped! Transitioning to Micro-Editor.");
      setPhase("edit");
    } else {
      setActiveIndex((prev) => prev + 1);
    }
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

  const resetSync = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setActiveIndex(1);
    setLines((prev) => {
      const reset = prev.map((l) => ({ ...l, timestamp: "", seconds: 0 }));
      if (reset.length > 0) {
        reset[0] = { timestamp: "[00:00.00]", text: reset[0].text || "🎵", seconds: 0 };
      }
      return reset;
    });
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
  };

  const deleteLineEditRow = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
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
  };

  const saveLrcData = async () => {
    setIsSaving(true);
    try {
      // Compile lines to single standard LRC string
      const lrcString = lines
        .map((l) => `${l.timestamp || "[00:00.00]"} ${l.text}`)
        .join("\n");

      const response = await fetch(`/api/track/${track.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lrc_data: lrcString }),
      });

      if (!response.ok) throw new Error("Failed to save synced lyrics");
      const resJson = await response.json();
      onSaveSuccess(resJson.track);
      toast.success("Lyrics sync saved successfully!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "An error occurred while saving lyrics.");
    } finally {
      setIsSaving(false);
    }
  };

  const clearLrcData = async () => {
    if (!confirm("Are you sure you want to completely remove synced lyrics for this track?")) return;
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
      toast.success("Lyrics removed successfully!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "An error occurred while removing lyrics.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/10 pb-4">
        <div>
          <h3 className="text-xl font-bold text-on-surface">LRC Sync Studio & Editor</h3>
          <p className="text-sm text-on-surface-variant">Apple Music-style manually synchronized lyrics generator</p>
        </div>
        <div className="flex items-center gap-2">
          {phase === "edit" && (
            <>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear this sync and record again?")) {
                    setPhase("paste");
                    // Exclude the '🎵' line if it's the very first line and exactly matches "🎵"
                    const textLines = lines.map(l => l.text);
                    if (textLines[0] === "🎵") textLines.shift();
                    setRawLyrics(textLines.join("\n"));
                  }
                }}
                className="px-4 py-2 text-xs font-label-caps text-outline hover:text-primary transition-all border border-outline-variant rounded-lg"
              >
                Re-sync Lyrics
              </button>
              <button
                onClick={clearLrcData}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-label-caps text-error hover:bg-error/10 transition-all border border-error/20 rounded-lg flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* PHASE 1: Paste lyrics */}
      {phase === "paste" && (
        <div className="space-y-4">
          <label className="block text-xs font-label-caps uppercase tracking-wider text-on-surface-variant">
            Paste Plain Text Lyrics
          </label>
          <textarea
            className="w-full bg-[#121214] border border-[#222226] focus:border-primary/50 rounded-xl px-4 py-4 font-body-lg text-on-surface placeholder:text-outline-variant/50 outline-none transition-all resize-none custom-scrollbar"
            placeholder="Line one&#10;Line two&#10;Line three..."
            rows={10}
            value={rawLyrics}
            onChange={(e) => setRawLyrics(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-primary" /> Separate each line by hitting enter.
            </span>
            <button
              onClick={startSyncing}
              className="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary/90 font-label-caps text-xs rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            >
              <Keyboard className="w-4 h-4" /> Start Sync Performance
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: Spacebar performance sync */}
      {phase === "sync" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Guide Card */}
            <div className="bg-primary/10 border border-primary/25 rounded-xl p-4 flex gap-4 items-start">
              <div className="p-2 bg-primary/20 rounded-lg text-primary shrink-0">
                <Keyboard className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">Spacebar Sync Method</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Start playback, then tap your <strong className="text-primary">Spacebar</strong> exactly when the current highlighted line is sung.
                  The sync will record the timestamp and automatically advance to the next line.
                </p>
              </div>
            </div>

            {/* Performance Lyrics Tracklist */}
            <div
              ref={listContainerRef}
              className="relative h-[300px] overflow-y-auto border border-outline-variant/20 rounded-xl bg-[#121214] p-4 space-y-2 custom-scrollbar"
            >
              {lines.map((line, idx) => {
                const isActive = idx === activeIndex;
                const isSynced = !!line.timestamp;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg flex items-center justify-between transition-all duration-300 ${
                      isActive
                        ? "bg-primary/20 border border-primary/40 scale-[1.01] shadow-lg shadow-primary/5"
                        : isSynced
                        ? "bg-surface-container-high/40 opacity-50 border border-transparent"
                        : "opacity-80 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded ${
                          isSynced
                            ? "bg-primary-container text-on-primary-container"
                            : "bg-surface-container-high text-outline"
                        }`}
                      >
                        {line.timestamp || "00:00.00"}
                      </span>
                      <p className={`font-body-md ${isActive ? "text-primary font-bold text-base" : "text-on-surface"}`}>
                        {line.text}
                      </p>
                    </div>
                    {isSynced && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Player controls */}
          <div className="bg-[#121214] border border-[#222226] rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="font-label-caps text-xs tracking-widest text-outline uppercase">Recording Deck</h4>
              <audio
                ref={audioRef}
                src={`/api/stream/${track.id}`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="bg-surface-container-high rounded-xl p-4 text-center">
                <span className="text-xs text-on-surface-variant block mb-1 font-label-caps uppercase">Active Line</span>
                <p className="font-bold text-on-surface text-lg line-clamp-2 min-h-[3rem]">
                  {activeIndex < lines.length ? lines[activeIndex].text : "Recording Completed!"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Play/Pause Trigger */}
              <button
                onClick={togglePlay}
                className="w-full py-4 bg-primary text-on-primary hover:bg-primary/95 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 font-bold transition-all text-sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" /> Pause Recording
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" /> Start Playback
                  </>
                )}
              </button>

              <button
                onClick={resetSync}
                className="w-full py-2.5 border border-outline-variant hover:bg-surface-container-high text-on-surface rounded-xl flex items-center justify-center gap-1.5 text-xs font-label-caps transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: Micro-Editor */}
      {phase === "edit" && (
        <div className="space-y-6">
          <div className="bg-[#121214] border border-[#222226] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <span className="text-sm text-on-surface-variant">
              Fine-tune your timestamps and lyrics below. You can adjust timing directly using the `[mm:ss.xx]` input blocks.
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => addLineEditRow(-1)}
                className="px-4 py-2 border border-outline-variant hover:bg-surface-container-high text-on-surface rounded-xl flex items-center gap-1.5 text-xs font-label-caps transition-all"
              >
                <Plus className="w-4 h-4" /> Add Start Line
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-[#121214] border border-[#222226] rounded-xl hover:border-outline-variant/40 transition-colors group"
              >
                <span className="text-xs font-mono text-outline w-6 text-center">{idx + 1}</span>
                <input
                  type="text"
                  placeholder="[00:00.00]"
                  className="bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono rounded-lg px-3 py-2 w-32 outline-none focus:border-primary text-sm"
                  value={line.timestamp}
                  onChange={(e) => updateLineTimestamp(idx, e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Lyric line text"
                  className="flex-1 bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-lg px-4 py-2 outline-none focus:border-primary text-sm"
                  value={line.text}
                  onChange={(e) => updateLineText(idx, e.target.value)}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => addLineEditRow(idx)}
                    className="p-2 text-outline hover:text-primary transition-colors flex items-center justify-center rounded-lg"
                    title="Insert row after"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteLineEditRow(idx)}
                    className="p-2 text-outline hover:text-error transition-colors flex items-center justify-center rounded-lg"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
            <button
              onClick={() => {
                if (confirm("Discard all lyric modifications?")) {
                  if (track.lrc_data) {
                    setLines(parseLrc(track.lrc_data));
                  } else {
                    setPhase("paste");
                  }
                }
              }}
              className="px-6 py-2.5 border border-outline-variant hover:bg-surface-container-high text-on-surface font-label-caps text-xs rounded-xl transition-all"
            >
              Discard Changes
            </button>
            <button
              onClick={saveLrcData}
              disabled={isSaving}
              className="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary/90 font-label-caps text-xs rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {isSaving ? "Saving Sync..." : "Save Sync"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
