"use client";

import { useState, useRef, useEffect } from 'react';

interface BioDescriptionProps {
  text: string;
  className?: string;
}

export function BioDescription({ text, className = "" }: BioDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        setIsOverflowing(
          textRef.current.scrollWidth > textRef.current.clientWidth || 
          textRef.current.scrollHeight > textRef.current.clientHeight
        );
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  if (!text) return null;

  return (
    <div 
      className={`flex flex-col cursor-pointer group w-full relative ${className}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div 
        className={`relative w-full overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? 'max-h-[800px]' : 'max-h-[28px]'}`}
        style={!isExpanded && isOverflowing ? { WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 95%)' } : {}}
      >
        <p 
          ref={textRef}
          className={`text-body-lg text-white/40 leading-relaxed font-light whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-1'}`}
        >
          {text}
        </p>
      </div>
      
      {!isExpanded && isOverflowing && (
        <div className="absolute top-0 right-0 h-[28px] flex items-center pr-1">
          <span className="text-white/60 text-[14px] font-medium group-hover:text-white transition-colors tracking-tight shadow-black drop-shadow-md">...more</span>
        </div>
      )}
      
      {isExpanded && isOverflowing && (
        <span className="text-white/60 text-[13px] font-medium mt-1 inline-block group-hover:text-white transition-colors">
          Show less
        </span>
      )}
    </div>
  );
}
