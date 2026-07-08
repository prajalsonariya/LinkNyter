"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { QrShareCard } from "@/components/QrShareCard";
import { Download, Smartphone, Square, Image as ImageIcon, Music, ListMusic, Share2 } from "lucide-react";
import { toast } from "sonner";
import * as htmlToImage from "html-to-image";

export default function QrCodesPage() {
  const { tracks, playlists } = useDashboard();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemType, setItemType] = useState<'track' | 'playlist'>('track');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16'>('9:16');
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile) setProfile(data.profile);
      })
      .catch(console.error);
  }, []);

  const handleExport = async () => {
    if (!cardRef.current || !selectedItem) return;
    setIsExporting(true);
    
    // Suppress html-to-image CSSOM SecurityError in Next.js dev overlay
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.toString().includes('cssRules') || args[1]?.toString().includes('cssRules')) return;
      originalError(...args);
    };
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        fontEmbedCSS: '',
      });
      
      const link = document.createElement('a');
      link.download = `${selectedItem.title || 'qr-code'}-linknyter.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("QR Code downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image.");
    } finally {
      console.error = originalError;
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current || !selectedItem) return;
    setIsSharing(true);
    
    // Suppress html-to-image CSSOM SecurityError in Next.js dev overlay
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.toString().includes('cssRules') || args[1]?.toString().includes('cssRules')) return;
      originalError(...args);
    };
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        fontEmbedCSS: '',
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${selectedItem.title || 'qr-code'}-linknyter.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Listen to ${selectedItem.title || 'this'}`,
          text: `Check out ${selectedItem.title || 'this'} on LinkNyter!`,
        });
        toast.success("Shared successfully!");
      } else {
        toast.error("Your device doesn't support native image sharing. Try saving the image first.");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error("Failed to share image.");
      }
    } finally {
      console.error = originalError;
      setIsSharing(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 md:ml-64 pb-32 md:pb-0 pt-20 md:pt-0">
      <header className="sticky top-0 w-full z-40 hidden md:flex justify-between items-center px-margin-desktop h-20 bg-surface/60 backdrop-blur-xl border-b border-outline-variant/10">
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">QR Share Studio</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-auto min-h-[calc(100vh-80px)]">
        
        {/* Left Side: Controls & Selection */}
        <div className="lg:col-span-4 border-r border-outline-variant/10 bg-surface-container-lowest/50 p-6 flex flex-col gap-8">
           
           <div>
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">1. Select Audio</h3>
               <div className="flex bg-surface-container rounded-lg p-1">
                 <button 
                   onClick={() => { setItemType('track'); setSelectedItem(null); }}
                   className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${itemType === 'track' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}
                 >
                   Tracks
                 </button>
                 <button 
                   onClick={() => { setItemType('playlist'); setSelectedItem(null); }}
                   className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${itemType === 'playlist' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}
                 >
                   Playlists
                 </button>
               </div>
             </div>

             <div className="space-y-2">
               {(itemType === 'track' ? tracks : playlists).length === 0 ? (
                 <div className="text-center py-8 text-on-surface-variant text-sm">
                   No {itemType}s available.
                 </div>
               ) : (
                 (itemType === 'track' ? tracks : playlists).map((item: any) => (
                   <div 
                     key={item.id}
                     onClick={() => setSelectedItem(item)}
                     className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${
                       selectedItem?.id === item.id 
                         ? 'bg-primary/10 border-primary text-primary' 
                         : 'bg-surface border-transparent hover:bg-surface-container-high text-on-surface'
                     }`}
                   >
                     <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-surface-container-high flex items-center justify-center">
                       <img 
                         src={item.cover_url || item.cover_art_url || (itemType === 'playlist' ? "/playlist-cover.png" : "/cover-placeholder.jpg")} 
                         alt="" 
                         crossOrigin="anonymous" 
                         className="w-full h-full object-cover" 
                       />
                     </div>
                     <div className="overflow-hidden flex-1">
                       <p className="font-bold text-[14px] truncate leading-tight">{item.title || "Untitled"}</p>
                       <p className="text-[12px] opacity-70 truncate">{itemType === 'track' ? item.artist : `${item.playlist_tracks?.length || 0} tracks`}</p>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>

           <div>
             <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-4">2. Choose Format</h3>
             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setAspectRatio('9:16')}
                 className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${aspectRatio === '9:16' ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'}`}
               >
                 <Smartphone className="w-6 h-6" />
                 <span className="font-label-caps text-[10px] uppercase tracking-widest">Story (9:16)</span>
               </button>
               <button 
                 onClick={() => setAspectRatio('1:1')}
                 className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${aspectRatio === '1:1' ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'}`}
               >
                 <Square className="w-6 h-6" />
                 <span className="font-label-caps text-[10px] uppercase tracking-widest">Square (1:1)</span>
               </button>
             </div>
           </div>

        </div>

        {/* Right Side: Live Preview */}
        <div className="lg:col-span-8 bg-surface/30 p-6 flex flex-col items-center justify-center min-h-[600px] relative">
          
          <div className="absolute top-6 right-6 flex gap-3 z-20">
            <button 
              onClick={handleShare}
              disabled={!selectedItem || isSharing || isExporting}
              className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-label-caps text-label-caps hover:bg-surface-container-highest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {isSharing ? (
                <div className="animate-spin w-4 h-4 border-2 border-on-surface border-t-transparent rounded-full" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
            <button 
              onClick={handleExport}
              disabled={!selectedItem || isExporting}
              className="px-6 py-3 bg-primary text-on-primary rounded-full font-label-caps text-label-caps hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              {isExporting ? (
                <div className="animate-spin w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Saving...' : 'Save as Image'}
            </button>
          </div>

          {!selectedItem ? (
            <div className="flex flex-col items-center justify-center text-on-surface-variant opacity-60 mt-12 md:mt-0">
              <ImageIcon className="w-16 h-16 mb-4" />
              <p>Select a track or playlist to generate QR Code</p>
            </div>
          ) : (
            <div className="flex-1 w-full flex items-center justify-center p-4 md:p-8 overflow-hidden mt-12 md:mt-0">
              <div className="scale-75 md:scale-90 lg:scale-100 origin-center transition-transform duration-500 flex items-center justify-center w-full">
                 <QrShareCard 
                   ref={cardRef} 
                   item={{
                     ...selectedItem,
                     artist: selectedItem.artist || profile?.name || "Unknown Artist"
                   }} 
                   type={itemType} 
                   aspectRatio={aspectRatio} 
                 />
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
