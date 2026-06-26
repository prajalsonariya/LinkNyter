"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDashboard } from "@/contexts/DashboardContext";
import { LrcSyncStudio } from "@/components/LrcSyncStudio";
import { Music, ArrowRight } from "lucide-react";

export default function LrcSyncPage() {
  const { tracks } = useDashboard();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  useEffect(() => {
    const trackId = searchParams.get("trackId");
    if (trackId) {
      setSelectedTrackId(trackId);
    } else {
      setSelectedTrackId(null);
    }
  }, [searchParams]);

  const handleSelectTrack = (id: string) => {
    router.push(`/lrc-sync?trackId=${id}`);
  };

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);

  return (
    <div className="flex-1 ml-64 w-[calc(100%-256px)] flex flex-col h-screen overflow-hidden">
      {selectedTrack ? (
        <LrcSyncStudio 
          track={selectedTrack} 
          onSaveSuccess={() => {
            // Can optionally redirect or show toast
          }} 
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="max-w-2xl w-full text-center space-y-8">
            <div>
              <h2 className="font-display-lg text-[32px] font-bold text-on-surface mb-4">Select a Track to Sync</h2>
              <p className="text-body-lg text-on-surface-variant max-w-lg mx-auto">
                Choose a track from your library to begin synchronizing lyrics using the LRC Sync Studio.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 text-left">
              {tracks.length === 0 ? (
                <div className="p-8 border border-outline-variant/30 rounded-2xl text-center text-on-surface-variant">
                  No tracks available. Upload a track in the Dashboard first.
                </div>
              ) : (
                tracks.map(track => (
                  <button
                    key={track.id}
                    onClick={() => handleSelectTrack(track.id)}
                    className="flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/50 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 border border-outline-variant/50 group-hover:border-primary/50 transition-colors"
                        style={{ backgroundImage: `url('${track.cover_url || "/cover-placeholder.jpg"}')` }}
                      >
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[18px] text-on-surface">{track.title}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-outline group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
