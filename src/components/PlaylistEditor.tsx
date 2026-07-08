"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical, Save, Upload, Link as LinkIcon, ListMusic, Plus, X } from "lucide-react";
import { toast } from "sonner";

function SortableTrackItem({ id, track, onRemove }: { id: string, track: any, onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-4 p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl mb-2 ${isDragging ? 'shadow-2xl border-primary' : ''}`}>
      <div {...attributes} {...listeners} className="cursor-grab p-1 text-on-surface-variant hover:text-primary">
        <GripVertical className="w-5 h-5" />
      </div>
      <img src={track.cover_url || "/cover-placeholder.jpg"} alt={track.title} className="w-10 h-10 rounded shadow-sm object-cover" />
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold text-on-surface truncate">{track.title}</p>
        {track.artist && <p className="text-sm text-on-surface-variant truncate">{track.artist}</p>}
      </div>
      <button onClick={() => onRemove(id)} className="p-2 text-on-surface-variant hover:text-error transition-colors" title="Remove from playlist">
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}

export function PlaylistEditor({ playlist, allTracks, onUpdate, onDelete }: { playlist: any, allTracks: any[], onUpdate: (updated: any) => void, onDelete: () => void }) {
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [originalTracks, setOriginalTracks] = useState<string[]>([]);
  const [editTitle, setEditTitle] = useState(playlist.title);
  const [editCoverArtUrl, setEditCoverArtUrl] = useState(playlist.cover_art_url || "/playlist-cover.png");
  const [isSaving, setIsSaving] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isCoverDragActive, setIsCoverDragActive] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!showAddPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowAddPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddPicker]);

  const playlistTrackIds = new Set(playlistTracks.map(t => t.id));
  const remainingTracks = (allTracks || []).filter((t) => !playlistTrackIds.has(t.id));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setEditTitle(playlist.title);
    setEditCoverArtUrl(playlist.cover_art_url || "/playlist-cover.png");
    fetchTracks();
  }, [playlist]);

  const fetchTracks = async () => {
    const { data, error } = await supabase
      .from('playlist_tracks')
      .select('track_id, track_order, tracks(id, title, artist, cover_url)')
      .eq('playlist_id', playlist.id)
      .order('track_order', { ascending: true });
      
    if (data) {
      const mapped = data.map((d: any) => ({ ...d.tracks, unique_id: `${d.track_id}-${Math.random()}` }));
      setPlaylistTracks(mapped);
      setOriginalTracks(mapped.map((t: any) => t.id));
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPlaylistTracks((items) => {
        const oldIndex = items.findIndex((i) => i.unique_id === active.id);
        const newIndex = items.findIndex((i) => i.unique_id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Add a drop zone for external tracks from the sidebar
  const handleDropExternal = (e: React.DragEvent) => {
    e.preventDefault();
    const trackDataStr = e.dataTransfer.getData("application/json");
    if (trackDataStr) {
      try {
        const track = JSON.parse(trackDataStr);
        setPlaylistTracks(prev => [...prev, { ...track, unique_id: `${track.id}-${Math.random()}` }]);
        toast.success("Track added to playlist");
      } catch (err) {}
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

  const handleCoverUploadDirect = async (file: File) => {
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
        setEditCoverArtUrl(data.cover_url);
        const saveRes = await fetch(`/api/playlists/${playlist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cover_art_url: data.cover_url
          })
        });
        if (saveRes.ok) {
          onUpdate({ ...playlist, cover_art_url: data.cover_url });
          toast.success("Cover art updated successfully!");
        } else {
          toast.success("Cover art uploaded! Click 'Save Playlist' to commit.");
        }
      } else {
        throw new Error(data.error || 'Failed to process cover art');
      }
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsCoverUploading(false);
    }
  };

  const tracksChanged = JSON.stringify(playlistTracks.map(t => t.id)) !== JSON.stringify(originalTracks);
  const titleChanged = editTitle !== playlist.title;
  const coverChanged = editCoverArtUrl !== (playlist.cover_art_url || "/playlist-cover.png");
  const hasChanges = titleChanged || tracksChanged || coverChanged;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const trackIds = playlistTracks.map(t => t.id);
      const savedCoverUrl = editCoverArtUrl === "/playlist-cover.png" ? null : editCoverArtUrl;
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          tracks: trackIds,
          cover_art_url: savedCoverUrl
        })
      });
      if (!res.ok) throw new Error("Failed to save playlist");
      toast.success("Playlist saved");
      setOriginalTracks(trackIds);
      onUpdate({ ...playlist, title: editTitle, cover_art_url: savedCoverUrl });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${playlist.custom_slug}`);
    toast.success("Playlist link copied!");
  };

  return (
    <div className="space-y-8 animate-fade-in" onDragOver={(e) => e.preventDefault()} onDrop={handleDropExternal}>
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Playlist Cover Art Upload Section */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div 
            onDragEnter={handleCoverDrag}
            onDragOver={handleCoverDrag}
            onDragLeave={handleCoverDrag}
            onDrop={handleCoverDrop}
            className={`relative w-40 h-40 group rounded-2xl overflow-hidden border bg-surface-container-high shadow-lg transition-all duration-300 ${isCoverDragActive ? 'border-primary border-2 scale-105' : 'border-outline-variant/30'}`}
          >
            <img 
              src={editCoverArtUrl} 
              alt="Playlist Cover" 
              className={`w-full h-full object-cover transition-all duration-300 ${isCoverUploading ? 'blur-sm scale-105' : 'group-hover:scale-105'}`} 
            />
            {!isCoverUploading && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-white/90" />
              </div>
            )}

            {!isCoverUploading && editCoverArtUrl !== "/playlist-cover.png" && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    setEditCoverArtUrl("/playlist-cover.png");
                    const saveRes = await fetch(`/api/playlists/${playlist.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        cover_art_url: null
                      })
                    });
                    if (saveRes.ok) {
                      onUpdate({ ...playlist, cover_art_url: null });
                      toast.success("Cover art removed successfully!");
                    }
                  } catch (err: any) {
                    toast.error("Failed to remove cover: " + err.message);
                  }
                }}
                className="absolute top-2 right-2 p-1.5 bg-error hover:bg-error/90 active:scale-95 transition-all rounded-full cursor-pointer shadow-lg z-20 flex items-center justify-center opacity-0 group-hover:opacity-100"
                title="Remove Cover Art"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
              </button>
            )}

            {isCoverUploading && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in z-10">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ping duration-1000" />
                  <div className="relative w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50 border border-white/10">
                    <Upload className="w-4 h-4 text-white animate-pulse" />
                  </div>
                </div>
                <span className="mt-3 font-label-caps text-[9px] text-primary-fixed-dim tracking-widest uppercase animate-pulse">
                  Uploading...
                </span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCoverUploadDirect(file);
            }} 
          />
        </div>

        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Playlist Title</h3>
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-lg px-4 py-4 font-body-lg text-on-surface placeholder:text-outline-variant outline-none transition-all" 
              type="text" 
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={handleSave} 
              disabled={isSaving || !hasChanges} 
              className="px-6 py-2 font-label-caps text-label-caps rounded transition-all bg-primary text-on-primary hover:bg-primary/90 disabled:bg-outline-variant/20 disabled:text-on-surface-variant/30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Playlist'}
            </button>
            <button onClick={copyLink} className="px-6 py-2 border border-outline-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps text-on-surface rounded flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Copy Link
            </button>
            <a href={`/analytics?playlistId=${playlist.id}`} className="px-6 py-2 border border-outline-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps text-on-surface rounded flex items-center gap-2">
              Analytics
            </a>
            <a href={`/manage-links?playlistId=${playlist.id}`} className="px-6 py-2 border border-outline-variant hover:bg-surface-container-high transition-colors font-label-caps text-label-caps text-on-surface rounded flex items-center gap-2">
              Manage Links
            </a>
            <button 
              onClick={() => onDelete()} 
              className="px-6 py-2 border border-error/50 hover:bg-error/10 text-error transition-colors font-label-caps text-label-caps rounded flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Playlist
            </button>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-outline-variant/20">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">Playlist Tracks</h3>
            <p className="text-sm text-on-surface-variant mt-1">Dragg tracks from your library here, or reorder the list below.</p>
          </div>
          <span className="text-primary font-label-caps text-label-caps tracking-widest">{playlistTracks.length} TRACKS</span>
        </div>
        
        <div className="bg-surface-container-lowest p-6 rounded-2xl min-h-[200px] border-2 border-dashed border-outline-variant/30">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={playlistTracks.map(t => t.unique_id)} strategy={verticalListSortingStrategy}>
              {playlistTracks.map((track) => (
                <SortableTrackItem key={track.unique_id} id={track.unique_id} track={track} onRemove={(id) => setPlaylistTracks(prev => prev.filter(t => t.unique_id !== id))} />
              ))}
            </SortableContext>
          </DndContext>
          {playlistTracks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-50 py-12">
              <ListMusic className="w-12 h-12 mb-4" />
              <p>No tracks added yet.</p>
              <p className="text-sm mt-2">Drag tracks from your library here, or click &quot;Add Tracks&quot; below.</p>
            </div>
          )}

          {/* Add Track Button & Picker */}
          <div className="relative pt-4 mt-2" ref={pickerRef}>
            {!showAddPicker ? (
              <div className="flex justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (remainingTracks.length === 0) {
                      toast.info("All tracks are already in this playlist");
                      return;
                    }
                    setShowAddPicker(true);
                  }}
                  className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition-colors text-sm 
                    text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-dashed border-outline-variant/30 hover:border-primary/50 w-fit"
                >
                  <div className="w-8 h-8 rounded bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Add Tracks</span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-surface-container overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Picker header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface-container-high">
                  <span className="text-xs font-label-caps tracking-widest text-white/50">
                    Select a track to add
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddPicker(false);
                    }}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-on-surface-variant" />
                  </button>
                </div>

                {/* Track list */}
                <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                  {remainingTracks.length === 0 ? (
                    <p className="text-sm text-on-surface-variant p-4 text-center">
                      All tracks are in this playlist.
                    </p>
                  ) : (
                    remainingTracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaylistTracks(prev => [...prev, { ...track, unique_id: `${track.id}-${Math.random()}` }]);
                          setShowAddPicker(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 w-full text-left hover:bg-white/5 rounded-lg transition-colors text-sm"
                      >
                        <img
                          src={track.cover_url || "/cover-placeholder.jpg"}
                          className="w-10 h-10 rounded object-cover shrink-0 border border-white/5 shadow-sm"
                          alt="Cover"
                        />
                        <div className="overflow-hidden flex-1">
                          <span className="truncate block font-medium text-on-surface">
                            {track.title}
                          </span>
                          {track.artist && (
                            <span className="truncate block text-xs text-on-surface-variant">
                              {track.artist}
                            </span>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
