"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, Check, Copy, Loader2, Plus, Trash2 } from "lucide-react";

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
    <div className="relative w-full h-full overflow-y-auto custom-scrollbar p-12 pr-16 z-10">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>
      
      <header className="flex justify-between items-end mb-10">
        <div>
          <span className="font-label-caps text-label-caps text-primary mb-2 block tracking-[0.2em] uppercase">Distribution</span>
          <h2 className="font-display-lg text-display-lg text-on-surface">Manage Links</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Link Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-2xl p-6">
            <h3 className="font-headline-sm text-on-surface mb-6">Create New Link</h3>
            
            <div className="space-y-4">
              <div>
                <label className="font-label-caps text-[10px] uppercase text-on-surface-variant block mb-2 tracking-wider">Select Track</label>
                <select 
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:border-primary outline-none appearance-none cursor-pointer"
                  value={selectedTrackId}
                  onChange={e => setSelectedTrackId(e.target.value)}
                >
                  <option value="ALL">-- Filter Links / Select Track --</option>
                  {tracks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-label-caps text-[10px] uppercase text-on-surface-variant block mb-2 tracking-wider">Recipient / Reference Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Warner Bros Pitch" 
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:border-primary outline-none"
                  value={newLinkName}
                  onChange={e => setNewLinkName(e.target.value)}
                  disabled={selectedTrackId === 'ALL'}
                />
              </div>

              <button 
                className={`w-full py-3 rounded-xl font-label-caps uppercase text-xs flex items-center justify-center gap-2 transition-all ${!newLinkName.trim() || selectedTrackId === 'ALL' || isGenerating ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed' : 'bg-primary text-on-primary hover:opacity-90'}`}
                onClick={handleCreateLink}
                disabled={!newLinkName.trim() || selectedTrackId === 'ALL' || isGenerating}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Generate Tracking Link
              </button>
            </div>
          </div>
        </div>

        {/* Existing Links List */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container-low/50 backdrop-blur-xl border border-outline-variant/50 rounded-2xl p-6 h-[600px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-sm text-on-surface">Existing Links</h3>
              <span className="font-label-caps text-xs text-on-surface-variant">{links.length} Links</span>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary w-8 h-8" />
                </div>
              ) : links.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-label-caps">
                  No tracking links found
                </div>
              ) : (
                links.map(link => (
                  <div key={link.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 hover:border-primary/30 transition-colors gap-4">
                    <div>
                      <div className="font-body-lg font-semibold text-on-surface">{link.reference_name}</div>
                      <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                        <span className="bg-surface-container-highest px-2 py-0.5 rounded font-mono text-[10px]">{getTrackName(link.track_id)}</span>
                        <span>•</span>
                        <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => handleCopy(link)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface border border-outline-variant/50 hover:border-primary text-on-surface transition-colors"
                      >
                        {copiedId === link.id ? (
                          <><Check className="w-4 h-4 text-green-500" /> <span className="font-label-caps text-[10px] uppercase text-green-500">Copied</span></>
                        ) : (
                          <><Copy className="w-4 h-4 text-primary" /> <span className="font-label-caps text-[10px] uppercase">Copy Link</span></>
                        )}
                      </button>
                      <button 
                        onClick={() => handleDelete(link.id)}
                        className="flex items-center justify-center p-2 rounded-lg bg-surface border border-outline-variant/50 hover:border-error text-on-surface-variant hover:text-error transition-colors"
                        title="Delete Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
