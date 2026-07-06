"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, Check, Copy, Loader2, Plus, Trash2, Music, ChevronDown } from "lucide-react";

import { useSearchParams } from 'next/navigation';

export function ManageLinksView({ tracks, playlists }: { tracks: any[], playlists?: any[] }) {
  const searchParams = useSearchParams();
  const urlPlaylistId = searchParams.get('playlistId');
  
  const [targetType, setTargetType] = useState<'track' | 'playlist'>(urlPlaylistId ? 'playlist' : 'track');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('ALL');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(urlPlaylistId || 'ALL');

  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLinkName, setNewLinkName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, [selectedTrackId, selectedPlaylistId, targetType]);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      let url = '/api/tracking-links';
      if (targetType === 'playlist' && selectedPlaylistId !== 'ALL') {
        url = `/api/tracking-links?playlist_id=${selectedPlaylistId}`;
      } else if (targetType === 'track' && selectedTrackId !== 'ALL') {
        url = `/api/tracking-links?track_id=${selectedTrackId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleCreateLink = async () => {
    if (!newLinkName.trim()) return;
    if (targetType === 'track' && selectedTrackId === 'ALL') return;
    if (targetType === 'playlist' && selectedPlaylistId === 'ALL') return;
    
    setIsGenerating(true);
    try {
      const payload = targetType === 'playlist' 
        ? { playlist_id: selectedPlaylistId, reference_name: newLinkName }
        : { track_id: selectedTrackId, reference_name: newLinkName };
        
      const res = await fetch('/api/tracking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const newLink = await res.json();
      if (!newLink.error) {
        setLinks([newLink, ...links]);
        setNewLinkName('');
      }
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  const handleCopy = (link: any) => {
    let url = '';
    if (link.playlist_id) {
      const playlist = playlists?.find(p => p.id === link.playlist_id);
      if (!playlist) return;
      url = `${window.location.origin}/p/${playlist.custom_slug}?ref=${link.custom_slug}`;
    } else {
      const track = tracks.find(t => t.id === link.track_id);
      if (!track) return;
      url = `${window.location.origin}/t/${track.slug}?ref=${link.custom_slug}`;
    }
    
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this tracking link? The analytics for this link will still be preserved, but the link will no longer work.")) return;
    try {
      const res = await fetch(`/api/tracking-links?id=${linkId}`, { method: 'DELETE' });
      if (res.ok) {
        setLinks(links.filter(l => l.id !== linkId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section className="p-4 md:p-12 flex flex-col gap-8 md:gap-10 max-w-7xl mx-auto w-full relative z-10 h-full overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Manage Links</h2>
        <p className="text-on-surface-variant font-body-lg text-body-lg max-w-2xl">Create and monitor custom distribution links for your tracks and playlists to track engagement and pitching performance across different platforms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create New Link & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Create New Link Panel */}
          <div className="bg-[#1a1a1d]/70 backdrop-blur-xl border border-[#333338] p-6 md:p-8 rounded-xl flex flex-col gap-6 relative z-50">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-primary/10 rounded-lg flex items-center justify-center w-[36px] h-[36px]">
                <img src="/logo.svg" alt="LinkNyter Logo" className="w-7 h-7 object-contain" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Create New Link</h3>
            </div>
            
            <div className="flex bg-[#121317] p-1 rounded-lg border border-outline-variant/20">
              <button 
                onClick={() => setTargetType('track')} 
                className={`flex-1 py-2 text-sm font-label-caps tracking-wider rounded-md transition-colors ${targetType === 'track' ? 'bg-[#333338] text-white' : 'text-outline hover:text-on-surface'}`}
              >
                Tracks
              </button>
              <button 
                onClick={() => setTargetType('playlist')} 
                className={`flex-1 py-2 text-sm font-label-caps tracking-wider rounded-md transition-colors ${targetType === 'playlist' ? 'bg-[#333338] text-white' : 'text-outline hover:text-on-surface'}`}
              >
                Playlists
              </button>
            </div>

            <form 
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateLink();
            }}
          >
              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps font-label-caps text-outline uppercase tracking-wider">{targetType === 'playlist' ? 'Select Playlist' : 'Select Track'}</label>
                <div className="relative">
                  <div 
                    className={`w-full bg-[#121317] border ${isDropdownOpen ? 'border-primary shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'border-outline-variant/30'} rounded-lg py-3 px-4 text-on-surface cursor-pointer flex items-center justify-between transition-all hover:border-primary/50`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className={(targetType === 'track' ? selectedTrackId : selectedPlaylistId) === 'ALL' ? 'text-outline' : 'text-on-surface font-medium'}>
                      {targetType === 'track' 
                        ? (selectedTrackId === 'ALL' ? '-- Select Track --' : tracks.find(t => t.id === selectedTrackId)?.title || '-- Select Track --')
                        : (selectedPlaylistId === 'ALL' ? '-- Select Playlist --' : playlists?.find(p => p.id === selectedPlaylistId)?.title || '-- Select Playlist --')}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-outline transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
                  </div>
                  
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                      <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1a1d] border border-outline-variant/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up-fade custom-scrollbar max-h-[240px] overflow-y-auto">
                        {targetType === 'track' ? (
                          tracks.map(t => (
                            <div 
                              key={t.id}
                              className={`px-4 py-3 hover:bg-primary/20 cursor-pointer transition-colors text-[14px] flex items-center gap-3 ${selectedTrackId === t.id ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface'}`}
                              onClick={() => { setSelectedTrackId(t.id); setIsDropdownOpen(false); }}
                            >
                              <div 
                                className="w-7 h-7 rounded bg-cover bg-center shrink-0 border border-outline-variant/50"
                                style={{ backgroundImage: `url('${t.cover_url || "/cover-placeholder.jpg"}')` }}
                              ></div>
                              <span className="truncate">{t.title}</span>
                            </div>
                          ))
                        ) : (
                          (playlists || []).map(p => (
                            <div 
                              key={p.id}
                              className={`px-4 py-3 hover:bg-primary/20 cursor-pointer transition-colors text-[14px] flex items-center gap-3 ${selectedPlaylistId === p.id ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface'}`}
                              onClick={() => { setSelectedPlaylistId(p.id); setIsDropdownOpen(false); }}
                            >
                              <div 
                                className="w-8 h-8 rounded shrink-0 bg-cover bg-center border border-outline-variant/30"
                                style={{ backgroundImage: `url('${p.cover_art_url || "/playlist-cover.png"}')` }}
                              />
                              <span className="truncate">{p.title}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps font-label-caps text-outline uppercase tracking-wider">Recipient / Purpose</label>
                <input 
                  className="w-full bg-[#121317] border border-outline-variant/30 rounded-lg py-3 px-4 text-on-surface focus:border-primary focus:ring-0 placeholder:text-surface-variant" 
                  placeholder="e.g., Warner Bros Pitch" 
                  type="text"
                  value={newLinkName}
                  onChange={e => setNewLinkName(e.target.value)}
                  disabled={(targetType === 'track' && selectedTrackId === 'ALL') || (targetType === 'playlist' && selectedPlaylistId === 'ALL')}
                />
              </div>
              <button 
                className={`mt-2 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${!newLinkName.trim() || (targetType === 'track' && selectedTrackId === 'ALL') || (targetType === 'playlist' && selectedPlaylistId === 'ALL') || isGenerating ? 'bg-surface-variant text-outline cursor-not-allowed' : 'bg-[#8b5cf6] text-white shadow-[0_0_30px_5px_rgba(139,92,246,0.15)] hover:brightness-110 active:scale-[0.98]'}`}
                disabled={!newLinkName.trim() || (targetType === 'track' && selectedTrackId === 'ALL') || (targetType === 'playlist' && selectedPlaylistId === 'ALL') || isGenerating}
                type="submit"
              >
                <span>{isGenerating ? 'Generating...' : 'Generate Tracking Link'}</span>
                {!isGenerating && <Plus className="w-5 h-5" />}
              </button>
            </form>
          </div>

          {/* Quick Stats Mini-Panel */}
          <div className="bg-primary/5 border border-primary/20 backdrop-blur-xl p-6 rounded-xl">
            <p className="text-label-caps font-label-caps text-primary/80 uppercase mb-4">Link Ecosystem</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-on-surface">{links.length}</p>
                <p className="text-xs text-outline">Active Links</p>
              </div>
            </div>
          </div>
        </div>

        {/* Command Center */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-[#1a1a1d]/70 backdrop-blur-xl border border-[#333338] rounded-xl overflow-hidden flex flex-col h-auto md:h-[700px]">
            {/* Filter Bar */}
            <div className="p-6 border-b border-outline-variant/10 bg-[#121317]/50">
              <h3 className="font-headline-md text-headline-md text-on-surface">Active Distribution Links</h3>
            </div>

            {/* List of Links */}
            <div className="p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : links.length === 0 ? (
                <div className="text-center py-20 text-outline">No tracking links found. Create one to get started!</div>
              ) : (
                links.map(link => {
                  let cover = '/cover-placeholder.jpg';
                  let title = 'Unknown';
                  let subtitle = '';
                  
                  if (link.playlist_id) {
                    const p = playlists?.find(p => p.id === link.playlist_id);
                    cover = p?.cover_art_url || cover;
                    title = p?.title || 'Unknown Playlist';
                    subtitle = `Playlist • Created ${new Date(link.created_at).toLocaleDateString()}`;
                  } else {
                    const t = tracks.find(t => t.id === link.track_id);
                    cover = t?.cover_url || cover;
                    title = t?.title || 'Unknown Track';
                    subtitle = `${title} • Created ${new Date(link.created_at).toLocaleDateString()}`;
                  }
                  
                  return (
                    <div key={link.id} className="group bg-transparent border border-transparent hover:bg-[#343539]/50 hover:border-[#333338] hover:-translate-y-[1px] p-4 rounded-xl flex items-center gap-6 transition-all">
                      <div className="w-12 h-12 rounded bg-surface-container-highest overflow-hidden shrink-0 shadow-md">
                        <img src={cover} alt={title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-on-surface truncate text-lg">{link.reference_name}</h4>
                        <p className="text-sm text-outline truncate">{subtitle}</p>
                      </div>
                      
                      <div className="flex flex-row md:flex-row items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleCopy(link)}
                          className="p-2 transition-all flex items-center justify-center rounded-lg hover:bg-surface-variant/50 w-[42px] h-[42px]"
                          title="Copy Link"
                        >
                          {copiedId === link.id ? (
                            <Check strokeWidth={1.5} className="w-[26px] h-[26px] text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] animate-in zoom-in duration-200" />
                          ) : (
                            <img src="/logo.svg" alt="Copy Link" className="w-[26px] h-[26px] object-contain opacity-70 hover:opacity-100 transition-opacity animate-in zoom-in duration-200" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleDelete(link.id)}
                          className="p-2 text-outline hover:text-error transition-colors"
                          title="Delete Link"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
