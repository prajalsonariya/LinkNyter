"use client";

import React, { useEffect, useState, useMemo } from "react";

const TwoLineLyrics = ({ lrcData, isPlaying, audioRef, accent, lrcTiming = "600ms" }: { lrcData: string, isPlaying: boolean, audioRef: React.RefObject<HTMLAudioElement | null>, accent: string, lrcTiming?: string }) => {
  const [currentMillisecond, setCurrentMillisecond] = useState(0);

  useEffect(() => {
    let rafId: number;
    const updateRaf = () => {
      if (audioRef.current && isPlaying) {
        setCurrentMillisecond(audioRef.current.currentTime * 1000);
      }
      rafId = requestAnimationFrame(updateRaf);
    };
    if (isPlaying) {
      rafId = requestAnimationFrame(updateRaf);
    }
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, audioRef]);

  useEffect(() => {
    if (!isPlaying) {
      const handleTime = () => {
        if (audioRef.current) setCurrentMillisecond(audioRef.current.currentTime * 1000);
      };
      const audioEl = audioRef.current;
      audioEl?.addEventListener('timeupdate', handleTime);
      return () => audioEl?.removeEventListener('timeupdate', handleTime);
    }
  }, [isPlaying, audioRef]);

  const parsed = useMemo(() => {
    const rawLines = lrcData.split("\n");
    const arr = [];
    const lrcRegex = /^\[(\d+):(\d+)\.(\d+)\](.*)/;
    for (const line of rawLines) {
      const match = line.trim().match(lrcRegex);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10);
        arr.push({
          ms: (mins * 60 + secs) * 1000 + ms * 10,
          text: match[4].trim() || "..."
        });
      }
    }
    
    if (arr.length > 0 && arr[0].ms > 0) {
      arr.unshift({ ms: 0, text: "..." });
    } else if (arr.length === 0) {
      arr.push({ ms: 0, text: "..." });
    }
    
    return arr;
  }, [lrcData]);

  let activeIndex = 0;
  for (let i = 0; i < parsed.length; i++) {
    if (currentMillisecond >= parsed[i].ms) {
      activeIndex = i;
    } else {
      break;
    }
  }

  if (parsed.length === 0) return null;

  return (
    <div 
      className="relative w-full h-[6rem] md:h-[7rem] overflow-hidden flex flex-col justify-center items-center pointer-events-none select-none"
      style={{ 
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)', 
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)' 
      }}
    >
      {parsed.map((line, i) => {
        const offset = i - activeIndex;

        if (offset < -2 || offset > 2) return null;

        const isActive = offset === 0;

        let translateY = "0px";
        let opacity = 0;
        let scale = 0.75;
        
        if (offset < -1) {
          translateY = "-2rem";
          opacity = 0;
          scale = 0.7;
        } else if (offset === -1) {
          translateY = "0.5rem";
          opacity = 0.4;
          scale = 0.75;
        } else if (offset === 0) {
          translateY = "3.2rem";
          opacity = 1; 
          scale = 1;
        } else if (offset > 0) {
          translateY = "6rem";
          opacity = 0;
          scale = 0.8;
        }

        let durationClass = "duration-[600ms]";
        let durationMs = 600;
        if (lrcTiming === "400ms") { durationClass = "duration-[400ms]"; durationMs = 400; }
        if (lrcTiming === "1000ms") { durationClass = "duration-[1000ms]"; durationMs = 1000; }

        let innerOpacity = 1;
        let innerDuration = "0ms";
        let innerDelay = "0ms";
        
        if (offset === -1) {
          innerOpacity = 0;
          innerDuration = `${durationMs / 2}ms`;
          innerDelay = `${durationMs}ms`;
        } else if (offset < -1) {
          innerOpacity = 0;
        }

        return (
          <div
            key={i}
            className={`absolute top-0 left-0 w-full text-center transition-all ${durationClass} ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform origin-center`}
            style={{
              transform: `translateY(${translateY}) scale(${scale})`,
              opacity: opacity,
              textShadow: isActive ? `0 0 30px rgba(${accent}, 0.8)` : 'none'
            }}
          >
            <div 
              className="text-[20px] md:text-[24px] font-bold text-white px-4 transition-opacity ease-linear"
              style={{
                opacity: innerOpacity,
                transitionDuration: innerDuration,
                transitionDelay: innerDelay
              }}
            >
              {line.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TwoLineLyrics;
