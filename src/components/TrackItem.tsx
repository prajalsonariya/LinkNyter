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
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkRecipient, setLinkRecipient] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

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
              className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors" 
              title="Copy Share Link"
              onClick={handleCopy}
            >
              {isCopied ? <Check className="w-[28px] h-[28px] text-green-500" /> : <img src="/logo.svg" alt="Copy Link" className="w-[28px] h-[28px] object-contain opacity-70 hover:opacity-100 transition-opacity" />}
            </button>
            <button 
              className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 font-label-caps text-[10px] uppercase"
              title="Create Tracking Link"
              onClick={() => setShowLinkModal(true)}
            >
              <BarChart2 className="w-4 h-4" /> Tracking Link
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Public Downloads</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={track.allow_downloads || false}
                onChange={(e) => onToggleDownload(track.id, e.target.checked)}
              />
              <div className="w-8 h-4 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setShowLinkModal(false); }}>
          <div className="bg-surface border border-outline-variant/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline-md text-on-surface mb-2">Create Tracking Link</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">Who are you sending this to?</p>
            
            {!generatedLink ? (
              <>
                <input 
                  type="text" 
                  placeholder="e.g. Warner Bros Pitch" 
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface mb-4 focus:border-primary outline-none"
                  value={linkRecipient}
                  onChange={(e) => setLinkRecipient(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button className="px-4 py-2 text-on-surface-variant font-label-caps uppercase text-[11px]" onClick={() => setShowLinkModal(false)}>Cancel</button>
                  <button className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-caps uppercase text-[11px]" onClick={async () => {
                    if(!linkRecipient.trim()) return;
                    const slug = linkRecipient.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
                    const { error } = await supabase.from('tracking_links').insert({
                      track_id: track.id,
                      reference_name: linkRecipient.trim(),
                      custom_slug: slug
                    });
                    if(!error) {
                      setGeneratedLink(`${window.location.origin}/t/${track.slug}?ref=${slug}`);
                    }
                  }}>Generate</button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-[12px] font-mono text-on-surface break-all mb-4">
                  {generatedLink}
                </div>
                <button className="w-full py-2 bg-primary text-on-primary rounded-lg font-label-caps uppercase text-[11px]" onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  setShowLinkModal(false);
                  setGeneratedLink('');
                  setLinkRecipient('');
                }}>Copy Link & Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
