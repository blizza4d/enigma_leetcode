'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward, VolumeX, Disc3 } from 'lucide-react';

const MARQUEE_TEXT = '// ENIGMA LEETCODE RELAY // LIVE RANKINGS // NO DAYS OFF ';

interface SoundtrackTrack {
  id: string;
  title: string;
  artist: string;
}

const SOUNDTRACK_TRACKS: SoundtrackTrack[] = [
  {
    id: '2kLBYF0eTJ4',
    title: 'Lose My Mind (feat. Doja Cat)',
    artist: 'Don Toliver',
  },
  {
    id: 'YhX_Woa3kVA',
    title: 'F1 Main Theme',
    artist: 'Hans Zimmer',
  },
];

export function RacingMarquee() {
  const repeatedItems = Array.from({ length: 8 }, (_, idx) => idx);

  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const clickCountRef = useRef(0);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleBannerClick = () => {
    clickCountRef.current += 1;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      if (!isPlaying) {
        setTrackIndex(0);
        setIsPlaying(true);
      } else {
        // Already playing — cycle to the next track
        setTrackIndex((prev) => (prev + 1) % SOUNDTRACK_TRACKS.length);
      }
    } else {
      resetTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 3000);
    }
  };

  const handleNextTrack = () => {
    setTrackIndex((prev) => (prev + 1) % SOUNDTRACK_TRACKS.length);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const currentTrack = SOUNDTRACK_TRACKS[trackIndex];

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleBannerClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBannerClick();
          }
        }}
        aria-label="Enigma LeetCode Relay Marquee Banner"
        className="w-full overflow-hidden bg-[#D6FF00] text-black border-b border-black/20 cursor-pointer select-none focus:outline-none"
      >
        <div className="flex w-max animate-marquee py-1.5">
          <div className="flex shrink-0 items-center">
            {repeatedItems.map((i) => (
              <span
                key={`a-${i}`}
                className="font-display text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase whitespace-nowrap px-4"
              >
                {MARQUEE_TEXT}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center">
            {repeatedItems.map((i) => (
              <span
                key={`b-${i}`}
                className="font-display text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase whitespace-nowrap px-4"
              >
                {MARQUEE_TEXT}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden YouTube Audio Player (mounted directly on click unlock for autoplay permission) */}
      {isPlaying && (
        <iframe
          key={currentTrack.id}
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&enablejsapi=1&loop=1&playlist=${currentTrack.id}`}
          title={`${currentTrack.artist} – ${currentTrack.title}`}
          allow="autoplay; encrypted-media"
          className="fixed -left-[9999px] -top-[9999px] w-0 h-0 opacity-0 pointer-events-none"
        />
      )}

      {/* Floating F1 AUDIO TELEMETRY Pill (Bottom-Right) */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            key="audio-telemetry-pill"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            role="region"
            aria-label="F1 Race Audio Telemetry Player"
            className="fixed bottom-5 right-5 z-[65] w-[330px] sm:w-[375px] max-w-[calc(100vw-2.5rem)]"
          >
            <div className="f1-card-cut bg-[#080808]/95 backdrop-blur-md border border-[#D6FF00]/50 border-l-4 border-l-[#D6FF00] shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_26px_rgba(214,255,0,0.22)]">
              {/* Header Bar */}
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#D6FF00] text-black">
                <div className="flex items-center gap-2">
                  <Disc3 className="w-3.5 h-3.5 animate-spin" />
                  <span className="font-display font-bold text-[10px] tracking-[0.18em] uppercase">
                    AUDIO TELEMETRY // RACE AUDIO
                  </span>
                </div>
                <span className="font-mono font-bold text-[9px] tracking-widest uppercase">
                  TRK 0{trackIndex + 1}/0{SOUNDTRACK_TRACKS.length}
                </span>
              </div>

              {/* Body: Equalizer + Track Info + Controls */}
              <div className="p-3.5 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Animated Neon-Yellow Equalizer Bars */}
                  <div
                    aria-hidden="true"
                    className="flex items-end gap-[3px] h-8 shrink-0 px-2 py-1 bg-white/[0.04] border border-white/10"
                  >
                    {[0, 0.12, 0.26, 0.06, 0.2].map((delay, idx) => (
                      <span
                        key={idx}
                        style={{ animationDelay: `${delay}s` }}
                        className="animate-radio-bar w-[3px] h-full bg-[#D6FF00]"
                      />
                    ))}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#D6FF00] truncate">
                      {currentTrack.artist}
                    </p>
                    <p className="text-xs font-mono font-bold text-white truncate">
                      {currentTrack.title}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNextTrack}
                    aria-label="Switch to next soundtrack track"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.16em] bg-white/[0.06] text-white border border-white/15 hover:bg-[#D6FF00] hover:text-black hover:border-[#D6FF00] transition-colors focus:outline-none focus:ring-1 focus:ring-[#D6FF00]"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>NEXT TRACK</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStop}
                    aria-label="Stop and mute race audio"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.16em] bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-colors focus:outline-none focus:ring-1 focus:ring-rose-400"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>STOP / MUTE</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
