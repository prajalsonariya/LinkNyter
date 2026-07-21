"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { Play, Pause, Trash2, Upload, Hourglass, Lock, FileUp, ArrowLeft, Plus, Music, ListMusic, ChevronDown, ChevronRight, Folder, Check } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/contexts/DashboardContext";
import { TrackItem } from "@/components/TrackItem";
import { PlaylistEditor } from "@/components/PlaylistEditor";
import { PlaylistItem } from "@/components/PlaylistItem";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { 
    tracks, setTracks, 
    playlists, setPlaylists, 
    selectedTrack, setSelectedTrack, 
    selectedPlaylist, setSelectedPlaylist,
    isUploading, inputRef, setDragActive,
    fetchPlaylists
  } = useDashboard();
  
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set());

  const togglePlaylistExpand = (id: string) => {
    const next = new Set(expandedPlaylists);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedPlaylists(next);
  };

  const handlePlaylistDrop = async (e: React.DragEvent, playlist: any) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary/20');
    try {
      const data = e.dataTransfer.getData("application/json");
      if (data) {
        const track = JSON.parse(data);
        const currentTracks = playlist.playlist_tracks || [];
        if (currentTracks.some((pt: any) => pt.track_id === track.id)) {
          toast.error("Track already in playlist");
          return;
        }
        const newTrackIds = [...currentTracks.map((pt: any) => pt.track_id), track.id];
        
        const res = await fetch(`/api/playlists/${playlist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracks: newTrackIds })
        });
        
        if (res.ok) {
          toast.success(`Added ${track.title} to ${playlist.title}`);
          fetchPlaylists();
          setExpandedPlaylists(prev => new Set(prev).add(playlist.id)); // Auto-expand to show new track
        } else {
          toast.error("Failed to add track");
        }
      }
    } catch (err) {}
  };

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Edit Mode States
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isCoverDragActive, setIsCoverDragActive] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [isAudioReplacing, setIsAudioReplacing] = useState(false);
  const audioReplaceRef = useRef<HTMLInputElement>(null);

  const [isAddingYoutube, setIsAddingYoutube] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'track' | 'playlist', name: string } | null>(null);

  useEffect(() => {
    if (selectedTrack) {
      setEditTitle(selectedTrack.title);
      setEditDescription(selectedTrack.description || "");
      setEditArtist(selectedTrack.artist || "");
      setEditCoverUrl(selectedTrack.cover_url || "");
    }
  }, [selectedTrack]);

  const handleCreatePlaylist = async () => {
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: "New Playlist", cover_art_url: "" })
      });
      const data = await res.json();
      if (res.ok) {
        setPlaylists(prev => [data.playlist, ...prev]);
        setSelectedPlaylist(data.playlist);
        setSelectedTrack(null);
      } else {
        toast.error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    setIsAddingYoutube(true);
    const loadingToast = toast.loading("Adding YouTube track...");
    try {
      const res = await fetch('/api/track/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl })
      });
      const data = await res.json();
      if (res.ok && data.track) {
        setTracks([data.track, ...tracks]);
        setYoutubeUrl("");
        toast.success("YouTube track added!", { id: loadingToast });
      } else {
        throw new Error(data.error || "Failed to add YouTube track");
      }
    } catch (e: any) {
      toast.error(e.message, { id: loadingToast });
    } finally {
      setIsAddingYoutube(false);
    }
  };

  const handleCoverDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsCoverDragActive(true);
    } else if (e.type === "dragleave") {
      setIsCoverDragActive(false);
    }
  };

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCoverDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await handleCoverUploadDirect(file);
      } else {
        toast.error("Please drop an image file.");
      }
    }
  };

  const handleAudioReplace = async (file: File) => {
    if (!selectedTrack) return;
    if (!file.type.startsWith('audio/')) {
      toast.error("Please select a valid audio file.");
      return;
    }
    
    setIsAudioReplacing(true);
    toast.loading("Uploading new audio file...", { id: 'audio-replace' });
    try {
      // 1. Initialize upload session
      const initRes = await fetch('/api/upload/init', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ type: 'track audio' }) 
      });
      if (!initRes.ok) throw new Error('Failed to initialize upload');
      const { folderId, accessToken } = await initRes.json();

      // 2. Start resumable upload
      const driveInitRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`, 
          'Content-Type': 'application/json', 
          'X-Upload-Content-Type': file.type, 
          'X-Upload-Content-Length': file.size.toString() 
        },
        body: JSON.stringify({ name: file.name, parents: [folderId] })
      });
      if (!driveInitRes.ok) throw new Error('Failed to start upload');
      const uploadUrl = driveInitRes.headers.get('Location');
      
      // 3. Upload bytes
      const driveRes = await fetch(uploadUrl!, { 
        method: 'PUT', 
        headers: { 'Content-Length': file.size.toString() }, 
        body: file 
      });
      const driveData = await driveRes.json();

      // 4. Update the track in our database and delete old file
      const res = await fetch(`/api/track/${selectedTrack.id}/replace`, { 
        method: "PUT", 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ newDriveFileId: driveData.id }) 
      });
      const data = await res.json();
      
      if (res.ok && data.track) {
        setTracks(tracks.map(t => t.id === selectedTrack.id ? data.track : t));
        setSelectedTrack(data.track);
        toast.dismiss('audio-replace');
        setShowSuccessBanner(true);
      } else {
        throw new Error(data.error || "Failed to replace audio");
      }
    } catch (err: any) {
      toast.error("Audio replacement failed: " + err.message, { id: 'audio-replace' });
    } finally {
      setIsAudioReplacing(false);
      if (audioReplaceRef.current) audioReplaceRef.current.value = '';
    }
  };

  const handleCoverUploadDirect = async (file: File) => {
    if (!selectedTrack) return;
    setIsCoverUploading(true);
    try {
      const initRes = await fetch('/api/upload/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'cover art' }) });
      if (!initRes.ok) throw new Error('Failed to initialize upload');
      const { folderId, accessToken } = await initRes.json();

      const driveInitRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Upload-Content-Type': file.type, 'X-Upload-Content-Length': file.size.toString() },
        body: JSON.stringify({ name: file.name, parents: [folderId] })
      });
      if (!driveInitRes.ok) throw new Error('Failed to start upload');
      const uploadUrl = driveInitRes.headers.get('Location');
      
      const driveRes = await fetch(uploadUrl!, { method: 'PUT', headers: { 'Content-Length': file.size.toString() }, body: file });
      const driveData = await driveRes.json();

      const res = await fetch("/api/upload-image", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ driveFileId: driveData.id }) });
      const data = await res.json();
      
      if (res.ok && data.cover_url) {
        setEditCoverUrl(data.cover_url);
        const saveRes = await fetch(`/api/track/${selectedTrack.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cover_url: data.cover_url }) });
        if (saveRes.ok) {
          const saveData = await saveRes.json();
          setTracks(tracks.map(t => t.id === selectedTrack.id ? saveData.track : t));
          setSelectedTrack(saveData.track);
        }
      }
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsCoverUploading(false);
    }
  };

  const handleSaveTrack = async () => {
    if (!selectedTrack) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/track/${selectedTrack.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription, artist: editArtist, cover_url: editCoverUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setTracks(tracks.map(t => t.id === selectedTrack.id ? data.track : t));
        setSelectedTrack(data.track);
        toast.success("Track updated");
      } else {
        toast.error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrack = (targetId?: string) => {
    const trackIdToDelete = targetId || selectedTrack?.id;
    if (!trackIdToDelete) return;
    const track = tracks.find(t => t.id === trackIdToDelete);
    setItemToDelete({ id: trackIdToDelete, type: 'track', name: track?.title || "Track" });
  };

  const handleDeletePlaylist = (targetId?: string) => {
    const playlistIdToDelete = targetId || selectedPlaylist?.id;
    if (!playlistIdToDelete) return;
    const playlist = playlists.find(p => p.id === playlistIdToDelete);
    setItemToDelete({ id: playlistIdToDelete, type: 'playlist', name: playlist?.title || "Playlist" });
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    
    try {
      if (itemToDelete.type === 'track') {
        const res = await fetch(`/api/track/${itemToDelete.id}`, { method: "DELETE" });
        if (res.ok) {
          setTracks(tracks.filter(t => t.id !== itemToDelete.id));
          if (selectedTrack?.id === itemToDelete.id) setSelectedTrack(null);
          toast.success("Track deleted");
        } else {
          toast.error("Failed to delete track");
        }
      } else if (itemToDelete.type === 'playlist') {
        const res = await fetch(`/api/playlists/${itemToDelete.id}`, { method: "DELETE" });
        if (res.ok) {
          setPlaylists(playlists.filter(p => p.id !== itemToDelete.id));
          if (selectedPlaylist?.id === itemToDelete.id) setSelectedPlaylist(null);
          toast.success("Playlist deleted");
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to delete playlist");
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const toggleDownloads = async (trackId: string, allowDownloads: boolean) => {
    try {
      const res = await fetch(`/api/track/${trackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allow_downloads: allowDownloads })
      });
      if (res.ok) {
        setTracks(tracks.map(t => t.id === trackId ? { ...t, allow_downloads: allowDownloads } : t));
      }
    } catch (e: any) {}
  };

  const copyLink = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/t/${slug}`);
    toast.success("Public link copied to clipboard!");
  };

  const togglePlay = (trackId: string) => {
    if (playingTrackId === trackId) {
      audioPlayer?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioPlayer) audioPlayer.pause();
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        const newAudio = new Audio(`/api/stream/${track.id}`);
        newAudio.play();
        newAudio.onended = () => setPlayingTrackId(null);
        setAudioPlayer(newAudio);
        setPlayingTrackId(trackId);
      }
    }
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 md:ml-64 md:mr-80 pb-32 pt-20 md:pt-0 md:pb-0">
        <header className="sticky top-0 w-full z-40 hidden md:flex items-center px-margin-desktop h-20 bg-surface/60 backdrop-blur-xl">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Music Library</h2>
        </header>

        <div className="p-4 md:p-margin-desktop max-w-4xl mx-auto space-y-8 md:space-y-12">
          
          {!selectedTrack && !selectedPlaylist && (
            <section className="flex md:hidden flex-col gap-1 mb-4">
              <span className="text-label-caps font-label-caps text-primary tracking-widest">CREATOR STUDIO</span>
              <h2 className="font-display-sm text-[28px] font-bold text-on-surface">Upload your music</h2>
            </section>
          )}

          <section className="space-y-8 animate-fade-in">
            {selectedPlaylist ? (
              <div className="space-y-8 md:space-y-12">
                <button 
                  onClick={() => setSelectedPlaylist(null)}
                  className="md:hidden flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps tracking-widest"
                >
                  <ArrowLeft className="w-5 h-5" /> Back to Library
                </button>
                <PlaylistEditor 
                  playlist={selectedPlaylist} 
                  allTracks={tracks}
                  onUpdate={(updated) => {
                    setPlaylists(playlists.map(p => p.id === updated.id ? updated : p));
                    setSelectedPlaylist(updated);
                  }} 
                  onDelete={() => handleDeletePlaylist(selectedPlaylist.id)} 
                />
              </div>
            ) : selectedTrack ? (
              <div className="space-y-8 md:space-y-12">
                <button 
                  onClick={() => setSelectedTrack(null)}
                  className="md:hidden flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps tracking-widest"
                >
                  <ArrowLeft className="w-5 h-5" /> Back to Library
                </button>
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                  <div className="w-full md:w-[320px] shrink-0 space-y-4">
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Cover Art</h3>
                    <div 
                      onClick={() => !isCoverUploading && coverInputRef.current?.click()}
                      onDragEnter={handleCoverDrag}
                      onDragOver={handleCoverDrag}
                      onDragLeave={handleCoverDrag}
                      onDrop={handleCoverDrop}
                      className={`w-full aspect-square rounded-xl overflow-hidden shadow-2xl border ${isCoverDragActive ? 'border-primary border-2 scale-105' : 'border-outline-variant/30'} relative bg-surface-container-high flex items-center justify-center transition-all duration-300 ${isCoverUploading ? 'cursor-default' : 'group cursor-pointer'}`}
                    >
                      {editCoverUrl ? (
                        <img className={`w-full h-full object-cover transition-all duration-700 ${isCoverUploading ? 'blur-sm scale-105' : 'group-hover:scale-105'}`} src={editCoverUrl} alt="Cover Art" onError={() => setEditCoverUrl("")} />
                      ) : (
                        <img className={`w-full h-full object-cover transition-all duration-700 ${isCoverUploading ? 'blur-sm scale-105' : 'group-hover:scale-105'}`} src="/cover-placeholder.jpg" alt="Placeholder" />
                      )}
                      
                      {!isCoverUploading && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Upload className="w-12 h-12 text-white/90 drop-shadow-lg" />
                        </div>
                      )}

                      {!isCoverUploading && editCoverUrl && (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              setEditCoverUrl("");
                              const saveRes = await fetch(`/api/track/${selectedTrack.id}`, { 
                                method: "PUT", 
                                headers: { "Content-Type": "application/json" }, 
                                body: JSON.stringify({ cover_url: null }) 
                              });
                              if (saveRes.ok) {
                                const saveData = await saveRes.json();
                                setTracks(tracks.map(t => t.id === selectedTrack.id ? saveData.track : t));
                                setSelectedTrack(saveData.track);
                                toast.success("Cover art removed");
                              }
                            } catch (err: any) {
                              toast.error("Failed to remove cover: " + err.message);
                            }
                          }}
                          className="absolute top-3 right-3 p-2 bg-error hover:bg-error/90 active:scale-95 transition-all rounded-full cursor-pointer shadow-lg z-20 flex items-center justify-center opacity-0 group-hover:opacity-100"
                          title="Delete Cover Art"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      )}

                      {isCoverUploading && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in z-10">
                          <div className="relative flex items-center justify-center">
                            <div className="absolute w-14 h-14 bg-primary/20 rounded-full animate-ping duration-1000" />
                            <div className="relative w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50 border border-white/10">
                              <Upload className="w-5 h-5 text-white animate-pulse" />
                            </div>
                          </div>
                          <span className="mt-4 font-label-caps text-[10px] md:text-[11px] text-primary-fixed-dim tracking-widest uppercase animate-pulse">
                            Uploading...
                          </span>
                        </div>
                      )}
                    </div>
                    <input className="hidden" type="file" accept="image/*" ref={coverInputRef} onChange={(e) => e.target.files?.[0] && handleCoverUploadDirect(e.target.files[0])} />
                  </div>

                  <div className="flex-1 space-y-8">
                    <div className="space-y-2">
                      <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Track Title</h3>
                      <input className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-lg px-4 py-4 font-body-lg text-on-surface placeholder:text-outline-variant outline-none transition-all" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Artist Name</h3>
                      <input className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-lg px-4 py-4 font-body-lg text-on-surface placeholder:text-outline-variant outline-none transition-all" type="text" placeholder="Defaults to your artist name" value={editArtist} onChange={(e) => setEditArtist(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Description</h3>
                      <textarea className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-lg px-4 py-4 font-body-lg text-on-surface placeholder:text-outline-variant outline-none transition-all resize-none" placeholder="Write a description, mood, or tracks credits..." rows={6} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-4">
                        <button onClick={handleSaveTrack} disabled={isSaving} className="px-6 py-2 font-label-caps text-label-caps rounded transition-all bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary">
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button 
                          onClick={() => !isAudioReplacing && audioReplaceRef.current?.click()} 
                          disabled={isAudioReplacing} 
                          className="px-6 py-2 font-label-caps text-label-caps rounded transition-all border border-outline-variant hover:border-primary text-on-surface hover:text-primary disabled:opacity-50 flex items-center gap-2"
                        >
                          {isAudioReplacing ? <Hourglass className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                          {isAudioReplacing ? 'Uploading...' : 'Change Audio File'}
                        </button>
                        <input className="hidden" type="file" accept="audio/*" ref={audioReplaceRef} onChange={(e) => e.target.files?.[0] && handleAudioReplace(e.target.files[0])} />
                      </div>
                      <button onClick={() => handleDeleteTrack()} disabled={isDeleting} className="p-2 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center">
                        {isDeleting ? <Hourglass className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : isUploading ? (
              <div className="space-y-3 p-8 border border-outline-variant rounded-xl bg-surface-container-lowest">
                <div className="flex justify-between items-end font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                  <span>Uploading tracks...</span>
                  <span className="text-primary">In Progress</span>
                </div>
                <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary active-glow transition-all duration-300 ease-out w-full animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative group cursor-pointer border-2 border-dashed border-outline-variant hover:border-primary transition-colors rounded-xl p-12 text-center bg-surface-container-low" onClick={() => inputRef.current?.click()}>
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

                {/* YouTube Add Area */}
                <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/50">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Or paste a YouTube URL to add as a presentation video..." 
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-lg px-4 py-3 font-body-md text-on-surface placeholder:text-outline-variant outline-none transition-all"
                    />
                  </div>
                  <button 
                    onClick={handleAddYoutube}
                    disabled={!youtubeUrl.trim() || isAddingYoutube}
                    className="px-6 py-3 font-label-caps text-label-caps rounded-lg transition-all bg-primary text-on-primary hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    {isAddingYoutube ? <Hourglass className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Add Video
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* MOBILE ONLY LIBRARY: Rendered under upload when on mobile, only if nothing is selected for editing */}
          {!selectedTrack && !selectedPlaylist && (
            <div className="md:hidden space-y-8 pt-4">
              {/* Playlists Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-on-surface font-semibold flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" /> Playlists
                  </h3>
                  <button 
                    onClick={handleCreatePlaylist}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {playlists.length === 0 ? (
                  <p className="text-on-surface-variant text-sm">No playlists yet.</p>
                ) : (
                  <div className="space-y-3">
                    {playlists.map((playlist) => (
                      <div key={playlist.id} onClick={() => { setSelectedPlaylist(playlist); setSelectedTrack(null); }}>
                        <PlaylistItem
                          playlist={playlist}
                          isSelected={selectedPlaylist?.id === playlist.id}
                          isExpanded={expandedPlaylists.has(playlist.id)}
                          tracks={tracks}
                          onSelect={() => { setSelectedPlaylist(playlist); setSelectedTrack(null); }}
                          onToggleExpand={() => togglePlaylistExpand(playlist.id)}
                          onPlaylistDrop={handlePlaylistDrop}
                          onTrackSelect={(trackId) => {
                            const fullTrack = tracks.find(t => t.id === trackId);
                            if (fullTrack) { setSelectedTrack(fullTrack); setSelectedPlaylist(null); }
                          }}
                          onDelete={handleDeletePlaylist}
                          selectedTrackId={selectedTrack?.id}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Tracks Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-6">
                  <h3 className="font-headline-sm text-on-surface font-semibold flex items-center gap-2">
                    <ListMusic className="w-5 h-5 text-primary" /> Your Tracks
                  </h3>
                  <span className="text-xs text-on-surface-variant uppercase tracking-widest">{tracks.length} TOTAL</span>
                </div>
                {tracks.length === 0 ? (
                  <p className="text-on-surface-variant text-sm">No tracks uploaded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {tracks.map((track) => (
                      <TrackItem
                        key={track.id}
                        track={track}
                        isSelected={selectedTrack?.id === track.id}
                        isPlaying={playingTrackId === track.id}
                        onSelect={() => {
                          setSelectedTrack(track);
                          setSelectedPlaylist(null);
                        }}
                        onTogglePlay={(e) => { e.stopPropagation(); togglePlay(track.id); }}
                        onDelete={(e) => { e.stopPropagation(); handleDeleteTrack(track.id); }}
                        onCopyLink={(e) => { e.stopPropagation(); copyLink(e, track.slug); }}
                        onToggleDownload={toggleDownloads}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar (Unified Tree View) - Desktop Only */}
      <aside className="hidden md:flex fixed right-0 top-0 h-screen w-80 border-l border-outline-variant glass-panel flex-col py-margin-desktop z-40">
        
        <div className="px-6 mb-4 flex items-center justify-between">
          <h3 className="font-headline-sm text-on-surface font-semibold">Library</h3>
          <button 
            onClick={handleCreatePlaylist}
            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
            title="Create Playlist"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-8 pr-3">
          
          {/* Playlists Section */}
          <section>
            <h4 className="font-label-caps text-label-caps tracking-widest text-on-surface-variant mb-4 flex items-center gap-2 uppercase">
              <Folder className="w-4 h-4" /> Playlists
            </h4>
            
            {playlists.length === 0 ? (
              <p className="text-on-surface-variant text-sm pl-6">No playlists yet.</p>
            ) : (
              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <PlaylistItem
                    key={playlist.id}
                    playlist={playlist}
                    isSelected={selectedPlaylist?.id === playlist.id}
                    isExpanded={expandedPlaylists.has(playlist.id)}
                    tracks={tracks}
                    onSelect={() => { setSelectedPlaylist(playlist); setSelectedTrack(null); }}
                    onToggleExpand={() => togglePlaylistExpand(playlist.id)}
                    onPlaylistDrop={handlePlaylistDrop}
                    onTrackSelect={(trackId) => {
                      const fullTrack = tracks.find(t => t.id === trackId);
                      if (fullTrack) { setSelectedTrack(fullTrack); setSelectedPlaylist(null); }
                    }}
                    onDelete={handleDeletePlaylist}
                    selectedTrackId={selectedTrack?.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* All Tracks Section */}
          <section>
            <h4 className="font-label-caps text-label-caps tracking-widest text-on-surface-variant mb-4 flex items-center gap-2 uppercase mt-8 border-t border-outline-variant/30 pt-6">
              <ListMusic className="w-4 h-4" /> All Tracks
            </h4>
            
            {tracks.length === 0 ? (
              <p className="text-on-surface-variant text-sm pl-6">No tracks uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {tracks.map((track) => (
                  <TrackItem
                    key={track.id}
                    track={track}
                    isSelected={selectedTrack?.id === track.id}
                    isPlaying={playingTrackId === track.id}
                    onSelect={() => {
                      setSelectedTrack(track);
                      setSelectedPlaylist(null);
                    }}
                    onTogglePlay={(e) => { e.stopPropagation(); togglePlay(track.id); }}
                    onDelete={(e) => { e.stopPropagation(); handleDeleteTrack(track.id); }}
                    onCopyLink={(e) => { e.stopPropagation(); copyLink(e, track.slug); }}
                    onToggleDownload={toggleDownloads}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </aside>

      {/* Item Deletion Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-up-fade">
            <h3 className="text-[24px] font-headline-md font-bold text-error mb-4 flex items-center gap-2">
              <Trash2 className="w-6 h-6" />
              Delete {itemToDelete.type === 'track' ? 'Track' : 'Playlist'}
            </h3>
            
            <p className="text-[14px] text-on-surface-variant mb-4 leading-relaxed">
              You are about to <span className="font-bold text-on-surface">permanently delete</span> <strong className="text-on-surface">{itemToDelete.name}</strong>. This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest bg-error hover:bg-error/90 text-on-error shadow-lg shadow-error/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner Modal */}
      {showSuccessBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
            onClick={() => setShowSuccessBanner(false)}
          />
          <div className="relative w-full max-w-sm bg-surface-container rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-outline-variant/20 p-8 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="font-display-sm text-2xl font-bold text-on-surface mb-2">
              Audio Replaced
            </h2>
            <p className="text-on-surface-variant font-body-md mb-8">
              Your audio track has been successfully updated. All your stats, lyrics, and metadata have been perfectly preserved.
            </p>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
