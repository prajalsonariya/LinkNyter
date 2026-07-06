"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { extractDominantColor } from "@/lib/color";
import { toast } from "sonner";

interface PlaylistItemProps {
  playlist: any;
  isSelected: boolean;
  isExpanded: boolean;
  tracks: any[];
  onSelect: () => void;
  onToggleExpand: () => void;
  onPlaylistDrop: (e: React.DragEvent, playlist: any) => void;
  onTrackSelect?: (trackId: string) => void;
  selectedTrackId?: string;
}

export function PlaylistItem({
  playlist,
  isSelected,
  isExpanded,
  tracks,
  onSelect,
  onToggleExpand,
  onPlaylistDrop,
  onTrackSelect,
  selectedTrackId,
}: PlaylistItemProps) {
  const [accent, setAccent] = useState("139, 92, 246");
  const [isCopied, setIsCopied] = useState(false);
  const pTracks = playlist.playlist_tracks || [];

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/p/${playlist.custom_slug}`);
    toast.success("Playlist link copied!");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // ALL track covers (with placeholder fallback for missing covers)
  const allTrackCovers: string[] = pTracks.map((pt: any) => {
    const t = pt.tracks || tracks.find((x) => x.id === pt.track_id);
    return t?.cover_url || "/cover-placeholder.jpg";
  });

  const mainCover = allTrackCovers[0] ?? null;

  // Extract dominant color from first track cover
  useEffect(() => {
    if (!mainCover || mainCover === "/cover-placeholder.jpg") {
      setAccent("139, 92, 246");
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mainCover;
    img.onload = async () => {
      try {
        const [r, g, b] = await extractDominantColor(img);
        setAccent(`${r}, ${g}, ${b}`);
      } catch {
        setAccent("139, 92, 246");
      }
    };
  }, [mainCover]);

  // 2x2 grid cover if >= 4 tracks, otherwise single image
  const renderCover = () => {
    if (pTracks.length === 0) {
      return (
        <img
          src="/cover-placeholder.jpg"
          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/5"
          alt="Cover"
        />
      );
    }

    if (pTracks.length >= 4) {
      return (
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/10 grid grid-cols-2 grid-rows-2">
          {allTrackCovers.slice(0, 4).map((url, i) => (
            <img key={i} src={url} className="w-full h-full object-cover" alt="" />
          ))}
        </div>
      );
    }

    return (
      <img
        src={allTrackCovers[0]}
        className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/5"
        alt="Cover"
      />
    );
  };

  return (
    <div
      className={`relative p-3 rounded-xl border transition-all overflow-hidden shadow-lg space-y-1
        ${isSelected
          ? "border-primary active-glow bg-surface/60"
          : "border-outline-variant/30 bg-surface/40 hover:bg-surface/60"
        }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("border-primary");
      }}
      onDragLeave={(e) => e.currentTarget.classList.remove("border-primary")}
      onDrop={(e) => onPlaylistDrop(e, playlist)}
    >
      {/* Dynamic ambient glow from track cover */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 20% 40%, rgba(${accent}, 0.3) 0%, rgba(${accent}, 0.1) 40%, transparent 70%)`,
        }}
      />

      {/* Main row */}
      <div className="relative z-10 flex items-center gap-2 cursor-pointer">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="p-1 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <div
          onClick={onSelect}
          className="flex-1 flex items-center gap-3 overflow-hidden"
        >
          {renderCover()}
          <div className="overflow-hidden flex-1">
            <span className="font-semibold truncate text-sm block text-on-surface">
              {playlist.title}
            </span>
            <span className="text-[11px] font-label-caps tracking-widest text-white/65">
              {pTracks.length} {pTracks.length === 1 ? "track" : "tracks"}
            </span>
          </div>
        </div>

        {/* Copy link button */}
        <button
          onClick={copyLink}
          title="Copy public link"
          className="p-1.5 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-white transition-colors shrink-0"
        >
          {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <img src="/logo.svg" className="w-5 h-5 opacity-50 hover:opacity-100 transition-opacity" alt="Copy link" />}
        </button>
      </div>

      {/* Expanded track list */}
      {isExpanded && (
        <div className="relative z-10 pl-4 border-l border-white/10 ml-5 space-y-1 mt-2 pt-1">
          {pTracks.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-2">
              Empty playlist. Add tracks below.
            </p>
          ) : (
            pTracks.map((pt: any) => {
              const track = pt.tracks || tracks.find((x) => x.id === pt.track_id);
              if (!track) return null;
              return (
                <div
                  key={pt.track_id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrackSelect?.(pt.track_id);
                  }}
                  className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors text-xs
                    ${selectedTrackId === pt.track_id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-white/5 text-on-surface-variant hover:text-on-surface"
                    }`}
                >
                  <img
                    src={track.cover_url || "/cover-placeholder.jpg"}
                    className="w-6 h-6 rounded object-cover shrink-0"
                    alt="Cover"
                  />
                  <span className="truncate font-medium">{track.title}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
