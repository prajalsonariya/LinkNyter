"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { Play, Pause, Search, Bell, Trash2, Upload, Hourglass, Lock, FileUp } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/contexts/DashboardContext";
import { TrackItem } from "@/components/TrackItem";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { tracks, setTracks, selectedTrack, setSelectedTrack, isUploading, inputRef, setDragActive } = useDashboard();
  
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  
  // Edit Mode States
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isCoverDragActive, setIsCoverDragActive] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedTrack) {
      setEditTitle(selectedTrack.title);
      setEditDescription(selectedTrack.description || "");
      setEditCoverUrl(selectedTrack.cover_url || "");
    }
  }, [selectedTrack]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedTrack) return;
    const file = e.target.files[0];
    await handleCoverUploadDirect(file);
  };

  const handleCoverDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isCoverUploading) setIsCoverDragActive(true);
  };

  const handleCoverDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCoverDragActive(false);
  };

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCoverDragActive(false);
    setDragActive(false); // Fix: Clear the global drag overlay
    
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !isCoverUploading) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await handleCoverUploadDirect(file);
      } else {
        toast.error("Please upload a valid image file.");
      }
    }
  };

  const handleCoverUploadDirect = async (file: File) => {
    if (!selectedTrack) return;
    setIsCoverUploading(true);
    try {
      // 1. Get auth and folder id
      const initRes = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cover art' })
      });
      if (!initRes.ok) throw new Error('Failed to initialize upload');
      const { folderId, accessToken } = await initRes.json();

      // 2. Start Google Drive Resumable Upload Session
      const driveInitRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': file.type,
          'X-Upload-Content-Length': file.size.toString()
        },
        body: JSON.stringify({
          name: file.name,
          parents: [folderId]
        })
      });

      if (!driveInitRes.ok) throw new Error('Failed to start Google Drive upload');
      const uploadUrl = driveInitRes.headers.get('Location');
      if (!uploadUrl) throw new Error('Google Drive did not return an upload URL');

      // 3. Upload File Data
      const driveRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': file.size.toString()
        },
        body: file
      });

      if (!driveRes.ok) throw new Error('Failed to upload bytes to Google Drive');
      const driveData = await driveRes.json();
      const driveFileId = driveData.id;

      // 4. Make public and get url
      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveFileId }),
      });
      
      const data = await res.json();
      if (res.ok && data.cover_url) {
        setEditCoverUrl(data.cover_url);
        
        // Auto-save immediately to prevent disappearing on refresh
        const saveRes = await fetch(`/api/track/${selectedTrack.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cover_url: data.cover_url })
        });
        
        if (saveRes.ok) {
          const saveData = await saveRes.json();
          setTracks(tracks.map(t => t.id === selectedTrack.id ? saveData.track : t));
          setSelectedTrack(saveData.track);
        }
      } else {
        toast.error("Failed to set cover permissions: " + data.error);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsCoverUploading(false);
    }
  };

  const handleDeleteCover = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedTrack) return;
    
    setEditCoverUrl("");
    
    // Auto-save immediately to prevent disappearing on refresh
    const saveRes = await fetch(`/api/track/${selectedTrack.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cover_url: "" })
    });
    
    if (saveRes.ok) {
      const saveData = await saveRes.json();
      setTracks(tracks.map(t => t.id === selectedTrack.id ? saveData.track : t));
      setSelectedTrack(saveData.track);
    }
  };

  const handleSaveTrack = async () => {
    if (!selectedTrack) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/track/${selectedTrack.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription, cover_url: editCoverUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setTracks(tracks.map(t => t.id === selectedTrack.id ? data.track : t));
        setSelectedTrack(data.track);
        toast.success("Track updated");
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrack = async (targetId?: string) => {
    const trackIdToDelete = targetId || selectedTrack?.id;
    if (!trackIdToDelete) return;
    const confirm = window.confirm("Are you sure you want to delete this track?");
    if (!confirm) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/track/${trackIdToDelete}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTracks(tracks.filter(t => t.id !== trackIdToDelete));
        if (selectedTrack?.id === trackIdToDelete) {
          setSelectedTrack(null);
        }
        toast.success("Track deleted");
      } else {
        const data = await res.json();
        toast.error(data.error || "Delete failed");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleDownloads = async (trackId: string, allowDownloads: boolean) => {
    try {
      const res = await fetch(`/api/track/${trackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allow_downloads: allowDownloads })
      });
      const data = await res.json();
      if (res.ok) {
        setTracks(tracks.map(t => t.id === trackId ? { ...t, allow_downloads: allowDownloads } : t));
      } else {
        toast.error(`Failed to update download settings: ${data.error}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Error updating download settings: ${e.message}`);
    }
  };

  const copyLink = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/t/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied to clipboard!");
  };

  const togglePlay = (trackId: string) => {
    if (playingTrackId === trackId) {
      audioPlayer?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioPlayer) {
        audioPlayer.pause();
      }
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        const streamUrl = `/api/stream/${track.id}`;
        const newAudio = new Audio(streamUrl);
        newAudio.play();
        newAudio.onended = () => setPlayingTrackId(null);
        setAudioPlayer(newAudio);
        setPlayingTrackId(trackId);
      }
    }
  };

  const hasChanges = selectedTrack ? (
    editTitle !== selectedTrack.title ||
    editDescription !== (selectedTrack.description || "") ||
    editCoverUrl !== (selectedTrack.cover_url || "")
  ) : false;

  return (
    <>
      <main className="flex-1 ml-64 overflow-y-auto custom-scrollbar relative z-10 mr-80">
        <header className="sticky top-0 w-full z-40 flex justify-between items-center px-margin-desktop h-20 bg-surface/60 backdrop-blur-xl">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Artist Dashboard</h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <input className="bg-surface-container border border-outline-variant rounded-full px-6 py-2 w-64 text-body-sm focus:outline-none focus:border-primary transition-all text-on-surface" placeholder="Search library..." type="text" />
              <Search className="text-on-surface-variant absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" />
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-on-surface-variant hover:text-primary transition-all">
                <Bell className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 rounded-full border-2 border-primary-container p-0.5">
                <div 
                  className="w-full h-full rounded-full bg-cover bg-center" 
                  style={{ backgroundImage: `url('${session?.user?.image || "/cover-placeholder.jpg"}')` }} 
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-margin-desktop max-w-4xl mx-auto space-y-12">
          <section className="space-y-8 animate-fade-in">
            {selectedTrack ? (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row gap-12">
                  {/* Left Column: Cover Art */}
                  <div className="w-full md:w-[320px] shrink-0 space-y-4">
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Cover Art</h3>
                    <div 
                      onClick={() => !isCoverUploading && coverInputRef.current?.click()}
                      onDragOver={handleCoverDragOver}
                      onDragLeave={handleCoverDragLeave}
                      onDrop={handleCoverDrop}
                      className={`w-full aspect-square rounded-xl overflow-hidden shadow-2xl border ${isCoverDragActive ? 'border-primary border-2 scale-105' : 'border-outline-variant/30'} relative bg-surface-container-high flex items-center justify-center transition-all duration-300 ${isCoverUploading ? 'cursor-default' : 'group cursor-pointer'}`}
                    >
                      {editCoverUrl ? (
                        <>
                          <img 
                            className={`w-full h-full object-cover transition-all duration-700 ${isCoverUploading ? 'blur-sm scale-105' : 'group-hover:scale-105'}`} 
                            src={editCoverUrl} 
                            alt="Cover Art"
                            onError={() => setEditCoverUrl("")}
                          />
                          {!isCoverUploading && (
                            <button 
                              onClick={handleDeleteCover}
                              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-error/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-lg backdrop-blur-md flex items-center justify-center"
                              title="Delete Cover Art"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <img 
                          className={`w-full h-full object-cover transition-all duration-700 ${isCoverUploading ? 'blur-sm scale-105' : 'group-hover:scale-105'}`} 
                          src="/cover-placeholder.jpg" 
                          alt="Placeholder"
                        />
                      )}
                      
                      {/* Hover Overlay for Uploading new image */}
                      {!isCoverUploading && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Upload className="w-12 h-12 text-white/90 drop-shadow-lg" />
                        </div>
                      )}

                      {/* Persistent Loading Overlay */}
                      {isCoverUploading && (
                        <div className="absolute inset-0 bg-surface/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-10">
                          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 shadow-lg"></div>
                          <span className="font-label-caps text-label-caps text-on-surface animate-pulse tracking-widest drop-shadow-md">Uploading...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-center text-on-surface-variant font-body-sm">Click to change artwork</p>
                    <input className="hidden" type="file" accept="image/*" ref={coverInputRef} onChange={handleCoverUpload} />
                  </div>

                  {/* Right Column: Details */}
                  <div className="flex-1 space-y-8">
                    <div className="space-y-2">
                      <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Track Title</h3>
                      <input 
                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-lg px-4 py-4 font-body-lg text-on-surface placeholder:text-outline-variant outline-none transition-all" 
                        type="text" 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Description</h3>
                      <textarea 
                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-lg px-4 py-4 font-body-lg text-on-surface placeholder:text-outline-variant outline-none transition-all resize-none" 
                        placeholder="Enter track details, mood, or credits..." 
                        rows={6} 
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-4">
                        <button 
                          onClick={handleSaveTrack} 
                          disabled={isSaving || !hasChanges} 
                          className="px-6 py-2 font-label-caps text-label-caps rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:hover:bg-surface-container-high disabled:hover:text-on-surface-variant"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button onClick={() => setSelectedTrack(null)} className="px-6 py-2 border border-outline-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps text-on-surface rounded">
                          Discard
                        </button>
                      </div>
                      <button onClick={() => handleDeleteTrack()} disabled={isDeleting} className="p-2 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center" title="Delete Track">
                        {isDeleting ? <Hourglass className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : isUploading ? (
              <div className="space-y-3 p-8 border border-outline-variant rounded-xl bg-surface-container-lowest">
                <div className="flex justify-between items-end font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                  <span>Uploading securely...</span>
                  <span className="text-primary">In Progress</span>
                </div>
                <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary active-glow transition-all duration-300 ease-out w-full animate-pulse" />
                </div>
              </div>
            ) : (
              <div 
                className="relative group cursor-pointer border-2 border-dashed border-outline-variant hover:border-primary transition-colors rounded-xl p-12 text-center bg-surface-container-low"
                onClick={() => inputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <FileUp className="w-9 h-9" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-headline-md text-headline-md text-on-surface">Drag &amp; drop track files</h3>
                    <p className="text-on-surface-variant font-body-sm">WAV, FLAC, or MP3 up to 200MB</p>
                  </div>
                </div>
              </div>
            )}
          </section>


        </div>
      </main>

      {/* Right Sidebar (Track Management) */}
      <aside className="fixed right-0 top-0 h-screen w-80 border-l border-outline-variant glass-panel flex flex-col py-margin-desktop px-6 z-40">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Your Tracks</h2>
          <span className="text-primary font-label-caps text-label-caps">{tracks.length} Total</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {tracks.length === 0 ? (
            <p className="text-on-surface-variant text-body-sm text-center mt-10">No tracks uploaded yet.</p>
          ) : (
            tracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                isSelected={selectedTrack?.id === track.id}
                isPlaying={playingTrackId === track.id}
                onSelect={() => {
                  setSelectedTrack(track);
                  setEditTitle(track.title);
                  setEditDescription(track.description || "");
                  setEditCoverUrl(track.cover_url || "");
                }}
                onTogglePlay={(e) => {
                  e.stopPropagation();
                  togglePlay(track.id);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  handleDeleteTrack(track.id);
                }}
                onCopyLink={(e) => {
                  e.stopPropagation();
                  copyLink(e, track.slug);
                }}
                onToggleDownload={toggleDownloads}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
}
