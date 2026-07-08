import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';

interface QrShareCardProps {
  item: {
    id: string;
    title: string;
    artist?: string;
    cover_url?: string | null;
    cover_art_url?: string | null;
    slug?: string;
    custom_slug?: string;
  };
  type: 'track' | 'playlist';
  aspectRatio: '1:1' | '9:16';
}

export const QrShareCard = forwardRef<HTMLDivElement, QrShareCardProps>(
  ({ item, type, aspectRatio }, ref) => {
    // Generate functional URL matching the public routes (using slug/custom_slug)
    const resolvedSlug = type === 'track' ? item.slug : item.custom_slug;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://linknyter.com';
    const url = `${origin}/${type === 'track' ? 't' : 'p'}/${resolvedSlug || item.id}`;
    
    // Choose correct cover art fallback depending on item type
    const coverArt = item.cover_url || item.cover_art_url || (type === 'playlist' ? '/playlist-cover.png' : '/cover-placeholder.jpg');

    // Dynamic sizing based on aspect ratio to prevent overlapping content
    const containerClasses = aspectRatio === '1:1' 
      ? 'aspect-square w-[400px]' 
      : 'aspect-[9/16] w-[360px]';

    const imgSizeClass = aspectRatio === '1:1' 
      ? 'max-h-[175px] max-w-[175px]' 
      : 'max-h-[280px] max-w-[280px]';

    const title = item.title || "Unknown Title";
    const titleSizeClass = title.length > 22 
      ? 'text-[18px]' 
      : title.length > 14 
        ? 'text-[21px]' 
        : 'text-[24px]';

    return (
      <div 
        ref={ref}
        className={`relative overflow-hidden bg-[#121212] shadow-2xl flex flex-col justify-between ${containerClasses}`}
        style={{ borderRadius: '24px' }}
      >
        {/* Blurred Background from Cover Art */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center scale-105 blur-[30px] opacity-85"
          style={{ backgroundImage: `url('${coverArt}')` }}
        />
        {/* Softer Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="relative z-10 flex flex-col h-full p-8 md:p-10 justify-between">
          {/* Top: Cover Art (Scales flexibly without overlapping) */}
          <div className="flex-1 flex items-center justify-center min-h-0 relative mb-4">
             <img 
               src={coverArt} 
               alt="Cover" 
               crossOrigin="anonymous"
               className={`aspect-square w-full object-cover rounded-2xl shadow-2xl ${imgSizeClass}`}
             />
          </div>

          {/* Bottom: Details & QR (Fixed size area) */}
          <div className="flex items-end justify-between gap-4 shrink-0">
             {/* Text Info */}
             <div className="flex-1 min-w-0 flex flex-col justify-end">
               <h2 className={`text-white font-display-sm font-bold leading-tight tracking-tight line-clamp-2 ${titleSizeClass}`}>
                 {title}
               </h2>
               <p className="text-white/80 font-body-lg text-[15px] truncate mt-1">
                 {item.artist || "Unknown Artist"}
               </p>
               <div className="mt-4 flex items-center gap-2">
                 <img src="/logo.svg" alt="LinkNyter" className="w-5 h-5 opacity-90 brightness-0 invert" crossOrigin="anonymous" />
                 <span className="text-white/60 text-[10px] font-label-caps tracking-widest uppercase">Scan to Listen</span>
               </div>
             </div>
             
             {/* QR Code */}
             <div className="shrink-0 bg-white/20 p-2.5 rounded-2xl border border-white/30 shadow-xl">
               <QRCode 
                 value={url} 
                 size={aspectRatio === '1:1' ? 80 : 90} 
                 fgColor="#ffffff" 
                 bgColor="transparent" 
                 level="H" 
               />
             </div>
          </div>
        </div>
      </div>
    );
  }
);

QrShareCard.displayName = 'QrShareCard';
