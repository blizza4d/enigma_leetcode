'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Radio, Zap, X, RotateCcw } from 'lucide-react';

const TEAM_RADIO_MESSAGES = [
  'BOX BOX — TIME TO SOLVE A HARD DP PROBLEM',
  'TYRES ARE GONE, SWITCHING TO C++',
  'FASTEST LAP: O(1) SPACE COMPLEXITY',
  'COPY, WE ARE CHECKING... TLE ON TEST CASE 99',
  'PUSH NOW, PUSH NOW — SEGMENT TREE DEPLOYED',
  'NO HEROICS INTO HARD PROBLEMS, JUST BINARY SEARCH',
];

export function Navbar() {
  const [radioMessage, setRadioMessage] = useState<string | null>(null);
  const clickCountRef = useRef(0);
  const clickResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const radioDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastIndexRef = useRef(-1);

  useEffect(() => {
    return () => {
      if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
      if (radioDismissTimerRef.current) clearTimeout(radioDismissTimerRef.current);
    };
  }, []);

  const handleLogoClick = () => {
    clickCountRef.current += 1;

    if (clickResetTimerRef.current) {
      clearTimeout(clickResetTimerRef.current);
    }

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;

      // Pick a random message different from the previous one
      let nextIdx = Math.floor(Math.random() * TEAM_RADIO_MESSAGES.length);
      if (nextIdx === lastIndexRef.current) {
        nextIdx = (nextIdx + 1) % TEAM_RADIO_MESSAGES.length;
      }
      lastIndexRef.current = nextIdx;
      setRadioMessage(TEAM_RADIO_MESSAGES[nextIdx]);

      if (radioDismissTimerRef.current) {
        clearTimeout(radioDismissTimerRef.current);
      }
      radioDismissTimerRef.current = setTimeout(() => {
        setRadioMessage(null);
      }, 5500);
    } else {
      // Reset combo if user pauses for more than 3 seconds
      clickResetTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 3000);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Block (Easter Egg 2: Click 5x for Pit Wall Team Radio) */}
          <button
            type="button"
            onClick={handleLogoClick}
            aria-label="Enigma Timing Tower Logo"
            className="group flex items-center gap-3.5 text-left focus:outline-none select-none cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-9 h-9 bg-[#D6FF00] text-black font-display font-bold text-sm tracking-tighter shadow-[0_0_20px_rgba(214,255,0,0.3)] group-active:scale-90 transition-transform">
              <Zap className="w-4 h-4 fill-black text-black" />
            </div>
            <div className="leading-none">
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-xs sm:text-sm tracking-[0.18em] text-white uppercase group-hover:text-[#D6FF00] transition-colors">
                  ENIGMA
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.18em] bg-white/10 text-[#D6FF00] border border-[#D6FF00]/40">
                  TIMING TOWER
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-[0.14em] uppercase text-[#888888] mt-1 hidden sm:block">
                SECTOR 01 // LEETCODE TELEMETRY FEED
              </p>
            </div>
          </button>

          {/* Live Telemetry Indicators with Occasional Subtle Flicker */}
          <div className="flex items-center gap-2.5">
            {/* Replay Intro Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('trigger-enigma-intro'));
                }
              }}
              title="Replay F1 Lights Out Sequence"
              aria-label="Replay F1 Lights Out Sequence"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#888888] hover:text-[#D6FF00] border border-white/10 hover:border-[#D6FF00]/40 text-[10px] font-mono uppercase tracking-[0.16em] transition-colors focus:outline-none cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#D6FF00]" />
              <span className="hidden sm:inline">REPLAY INTRO</span>
            </button>

            <div className="animate-telemetry-flicker hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/10 text-[10px] font-mono uppercase tracking-[0.16em] text-white">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D6FF00] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D6FF00]" />
              </span>
              <span>LIVE FEED // 30M SYNC</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#888888] bg-[#0D0D0D] border border-white/10">
              <Radio className="w-3 h-3 text-[#D6FF00]" />
              <span className="hidden sm:inline">GRAPHQL</span>
              <Activity className="w-3 h-3 text-white/60 sm:hidden" />
            </div>
          </div>
        </div>
      </header>

      {/* Easter Egg 2 Toast: F1 Pit Wall Team Radio (Bottom-Right) */}
      <AnimatePresence>
        {radioMessage && (
          <motion.div
            key={radioMessage}
            initial={{ opacity: 0, x: 40, y: 12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-[60] w-[320px] sm:w-[360px] max-w-[calc(100vw-2.5rem)]"
          >
            <div className="f1-card-cut bg-[#0A0A0A]/95 backdrop-blur-md border border-[#D6FF00]/50 border-l-4 border-l-[#D6FF00] shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(214,255,0,0.2)] overflow-hidden">
              {/* Radio Broadcast Header */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#D6FF00] text-black">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="font-display font-bold text-[10px] tracking-[0.2em] uppercase">
                    TEAM RADIO // PIT WALL
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRadioMessage(null)}
                  aria-label="Close Team Radio toast"
                  className="text-black/70 hover:text-black focus:outline-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Radio Message + Animated Audio Equalizer Bars */}
              <div className="p-4 flex items-center gap-3.5">
                <div
                  aria-hidden="true"
                  className="flex items-end gap-[3px] h-8 shrink-0 px-2 py-1 bg-white/[0.04] border border-white/10"
                >
                  {[0, 0.14, 0.28, 0.08, 0.22].map((delay, idx) => (
                    <span
                      key={idx}
                      style={{ animationDelay: `${delay}s` }}
                      className="animate-radio-bar w-[3px] h-full bg-[#D6FF00]"
                    />
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#888888] mb-1">
                    ENIGMA RACE ENGINEER
                  </p>
                  <p className="text-xs font-mono font-bold text-white leading-snug tracking-wide">
                    &ldquo;{radioMessage}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
