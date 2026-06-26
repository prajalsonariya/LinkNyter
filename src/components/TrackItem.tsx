"use client";

import { useState, useEffect } from "react";
import { Trash2, Play, Pause, BarChart2, Check } from "lucide-react";
import { extractDominantColor } from "@/lib/color";
import { supabase } from "@/lib/supabase";

interface TrackItemProps {
  track: any;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onTogglePlay: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onCopyLink: (e: React.MouseEvent) => void;
  onToggleDownload: (trackId: string, allow: boolean) => void;
}

export function TrackItem({
  track,
  isSelected,
  isPlaying,
  onSelect,
  onTogglePlay,
  onDelete,
  onCopyLink,
  onToggleDownload
}: TrackItemProps) {
  const [accent, setAccent] = useState("139, 92, 246"); // Default primary color
  const [isCopied, setIsCopied] = useState(false);
  const [optimisticAllowDownloads, setOptimisticAllowDownloads] = useState(track.allow_downloads || false);

  useEffect(() => {
    setOptimisticAllowDownloads(track.allow_downloads || false);
  }, [track.allow_downloads]);

  const handleCopy = (e: React.MouseEvent) => {
    onCopyLink(e);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = track.cover_url || "/cover-placeholder.jpg";
    img.onload = async () => {
      try {
        const [r, g, b] = await extractDominantColor(img);
        setAccent(`${r}, ${g}, ${b}`);
      } catch {}
    };
  }, [track.cover_url]);

  return (
    <div 
      className={`relative p-4 rounded-xl border ${isSelected ? 'border-primary' : 'border-outline-variant/30'} bg-surface/40 backdrop-blur-xl hover:bg-surface/60 transition-all group overflow-hidden shadow-lg ${isSelected ? 'active-glow' : ''}`}
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
    >
      {/* Ambient glassmorphic glow based on cover art */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{ background: `radial-gradient(circle at 15% 30%, rgba(${accent}, 0.5) 0%, rgba(${accent}, 0.15) 50%, rgba(${accent}, 0.02) 100%)` }}
      />
      
      <button 
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-error/10 text-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-error hover:text-on-error z-20" 
        onClick={onDelete}
        title="Delete Track"
      >
        <Trash2 className="w-[14px] h-[14px]" />
      </button>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-16 h-16 rounded-lg bg-cover bg-center shrink-0 border border-outline-variant relative group/play overflow-hidden"
            onClick={onTogglePlay}
            style={{ backgroundImage: `url('${track.cover_url || "/cover-placeholder.jpg"}')` }}
          >
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover/play:opacity-100'}`}>
              {isPlaying ? <Pause className="text-white w-8 h-8" /> : <Play className="text-white w-8 h-8 ml-1" />}
            </div>
          </div>
          
          <div className="overflow-hidden flex-1">
            <h4 className="font-body-lg font-semibold text-on-surface truncate">{track.title}</h4>
            <div className="flex items-center gap-1 text-primary">
              <BarChart2 className="w-4 h-4" />
              <span className="font-label-caps text-label-caps">{track.play_count || 0} streams</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-outline-variant/30" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <button 
              className="p-3 transition-all hover:-translate-y-[2px] flex items-center justify-center min-w-[50px] h-[50px]"
              title="Copy Share Link"
              onClick={handleCopy}
            >
              {isCopied ? (
                <Check strokeWidth={1.5} className="w-[28px] h-[28px] text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] animate-in zoom-in duration-200" />
              ) : (
                <img src="/logo.svg" alt="Copy Link" className="w-[28px] h-[28px] object-contain opacity-70 hover:opacity-100 transition-opacity animate-in zoom-in duration-200" />
              )}
            </button>
          </div>
          
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              const newValue = !optimisticAllowDownloads;
              setOptimisticAllowDownloads(newValue);
              onToggleDownload(track.id, newValue); 
            }}
            className="flex items-center gap-3 group"
            title={optimisticAllowDownloads ? "Disable Public Downloads" : "Enable Public Downloads"}
          >
            <span className={`font-label-caps text-[10px] uppercase tracking-widest transition-colors ${optimisticAllowDownloads ? 'text-primary drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]' : 'text-on-surface-variant group-hover:text-outline'}`}>
              Download
            </span>
            <div className={`relative w-9 h-5 rounded-full transition-all duration-300 ${optimisticAllowDownloads ? 'bg-primary shadow-[0_0_12px_rgba(139,92,246,0.6)]' : 'bg-[#2a2b30] group-hover:bg-[#33343a]'}`}>
              <div className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full transition-all duration-300 ${optimisticAllowDownloads ? 'translate-x-4' : 'translate-x-0 opacity-40'}`} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
