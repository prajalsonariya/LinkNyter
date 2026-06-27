"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, Check, Copy, Loader2, Plus, Trash2, Music, ChevronDown } from "lucide-react";

export function ManageLinksView({ tracks }: { tracks: any[] }) {
  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('ALL');
  const [newLinkName, setNewLinkName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, [selectedTrackId]);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const url = selectedTrackId !== 'ALL' ? `/api/tracking-links?track_id=${selectedTrackId}` : '/api/tracking-links';
      const res = await fetch(url);
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleCreateLink = async () => {
    if (!newLinkName.trim() || selectedTrackId === 'ALL') return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/tracking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: selectedTrackId,
          reference_name: newLinkName
        })
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
    const track = tracks.find(t => t.id === link.track_id);
    if (!track) return;
    
    const url = `${window.location.origin}/t/${track.slug}?ref=${link.custom_slug}`;
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

  const getTrackName = (trackId: string) => {
    const t = tracks.find(t => t.id === trackId);
    return t ? t.title : 'Unknown Track';
  };

  return (
    <section className="p-4 md:p-12 flex flex-col gap-8 md:gap-10 max-w-7xl mx-auto w-full relative z-10 h-full overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Manage Links</h2>
        <p className="text-on-surface-variant font-body-lg text-body-lg max-w-2xl">Create and monitor custom distribution links for your tracks to track engagement and pitching performance across different platforms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create New Link & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Create New Link Panel */}
          <div className="bg-[#1a1a1d]/70 backdrop-blur-xl border border-[#333338] p-6 md:p-8 rounded-xl flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-primary/10 rounded-lg flex items-center justify-center w-[36px] h-[36px]">
                <img src="/logo.svg" alt="LinkNyter Logo" className="w-7 h-7 object-contain" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Create New Link</h3>
            </div>
            <form 
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateLink();
            }}
          >
              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps font-label-caps text-outline uppercase tracking-wider">Select Track</label>
                <div className="relative">
                  <select 
                    className="w-full bg-[#121317] border border-outline-variant/30 rounded-lg py-3 px-4 text-on-surface appearance-none focus:border-primary focus:ring-0"
                    value={selectedTrackId}
                    onChange={e => setSelectedTrackId(e.target.value)}
                  >
                    <option value="ALL">-- Select Track --</option>
                    {tracks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
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
                  disabled={selectedTrackId === 'ALL'}
                />
              </div>
              <button 
                className={`mt-2 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${!newLinkName.trim() || selectedTrackId === 'ALL' || isGenerating ? 'bg-surface-variant text-outline cursor-not-allowed' : 'bg-[#8b5cf6] text-white shadow-[0_0_30px_5px_rgba(139,92,246,0.15)] hover:brightness-110 active:scale-[0.98]'}`}
                disabled={!newLinkName.trim() || selectedTrackId === 'ALL' || isGenerating}
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
                  const track = tracks.find(t => t.id === link.track_id);
                  return (
                    <div key={link.id} className="group bg-transparent border border-transparent hover:bg-[#343539]/50 hover:border-[#333338] hover:-translate-y-[1px] p-4 rounded-xl flex items-center gap-6 transition-all">
                      <div className="w-12 h-12 rounded bg-surface-container-highest overflow-hidden shrink-0 shadow-md">
                        <img src={track?.cover_url || '/cover-placeholder.jpg'} alt={track?.title || 'Track Cover'} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-on-surface truncate text-lg">{link.reference_name}</h4>
                        <p className="text-sm text-outline truncate">{track?.title || 'Unknown Track'} • Created {new Date(link.created_at).toLocaleDateString()}</p>
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
