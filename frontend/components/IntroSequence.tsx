'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type IntroStage = 'gantry' | 'lights_out' | 'shutter' | 'done';

const TELEMETRY_STAGES = [
  { at: 0, text: 'INITIALIZING ENIGMA_CORE...' },
  { at: 440, text: 'CONNECTING LEETCODE GRAPHQL...' },
  { at: 880, text: 'CALIBRATING TIMING TOWER...' },
  { at: 1250, text: 'GRID LOCKED' },
];

export function IntroSequence() {
  const [isActive, setIsActive] = useState(false);
  const [stage, setStage] = useState<IntroStage>('done');
  const [activeLights, setActiveLights] = useState(0);
  const [telemetryText, setTelemetryText] = useState('INITIALIZING ENIGMA_CORE...');
  const [showYellowFlash, setShowYellowFlash] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const handleSkip = useCallback(() => {
    clearAllTimers();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('enigma_intro_seen', 'true');
      } catch {
        // Ignore private browsing quota errors
      }
    }
    setStage('done');
    setIsActive(false);
    document.body.style.overflow = '';
  }, [clearAllTimers]);

  const startSequence = useCallback(() => {
    clearAllTimers();
    setIsActive(true);
    setStage('gantry');
    setActiveLights(0);
    setTelemetryText('INITIALIZING ENIGMA_CORE...');
    setShowYellowFlash(false);
    document.body.style.overflow = 'hidden';

    // Phase 1 — Starting Gantry: 5 lights sequentially illuminated every 220ms
    timersRef.current.push(
      setTimeout(() => {
        setActiveLights(1);
      }, 220)
    );

    timersRef.current.push(
      setTimeout(() => {
        setActiveLights(2);
        setTelemetryText('CONNECTING LEETCODE GRAPHQL...');
      }, 440)
    );

    timersRef.current.push(
      setTimeout(() => {
        setActiveLights(3);
      }, 660)
    );

    timersRef.current.push(
      setTimeout(() => {
        setActiveLights(4);
        setTelemetryText('CALIBRATING TIMING TOWER...');
      }, 880)
    );

    timersRef.current.push(
      setTimeout(() => {
        setActiveLights(5);
      }, 1100)
    );

    timersRef.current.push(
      setTimeout(() => {
        setTelemetryText('GRID LOCKED');
      }, 1250)
    );

    // Phase 2 — Lights Out Flash & Kinetic Title at 1.6s (1600ms)
    timersRef.current.push(
      setTimeout(() => {
        setActiveLights(0); // All 5 red lights snap OFF simultaneously
        setShowYellowFlash(true);
        setStage('lights_out');
      }, 1600)
    );

    // Fade the initial flash
    timersRef.current.push(
      setTimeout(() => {
        setShowYellowFlash(false);
      }, 1800)
    );

    // Phase 3 — Split-Shutter Reveal at 2.2s (2200ms)
    timersRef.current.push(
      setTimeout(() => {
        setStage('shutter');
      }, 2200)
    );

    // Completion at 2.8s (2800ms)
    timersRef.current.push(
      setTimeout(() => {
        setStage('done');
        setIsActive(false);
        document.body.style.overflow = '';
      }, 2800)
    );
  }, [clearAllTimers]);

  // Read sessionStorage on mount (prevent SSR hydration mismatch)
  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('enigma_intro_seen');
      if (!seen) {
        sessionStorage.setItem('enigma_intro_seen', 'true');
        startSequence();
      }
    } catch {
      // Fallback if sessionStorage is disabled
      startSequence();
    }

    const handleReplayEvent = () => {
      startSequence();
    };

    window.addEventListener('trigger-enigma-intro', handleReplayEvent);

    return () => {
      clearAllTimers();
      window.removeEventListener('trigger-enigma-intro', handleReplayEvent);
      document.body.style.overflow = '';
    };
  }, [clearAllTimers, startSequence]);

  if (!isActive) {
    return null;
  }

  const isGridLocked = telemetryText === 'GRID LOCKED';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enigma Lights Out Opening Sequence"
      className="fixed inset-0 z-50 overflow-hidden select-none"
    >
      {/* Top Half Split-Shutter Curtain */}
      <motion.div
        initial={false}
        animate={{ y: stage === 'shutter' ? '-100%' : '0%' }}
        transition={{
          duration: 0.6,
          ease: [0.85, 0, 0.15, 1] as const,
        }}
        className="fixed top-0 left-0 right-0 h-1/2 carbon-bg border-b border-white/10 z-[51] overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="crt-scanlines pointer-events-none absolute inset-0 opacity-[0.04]"
        />
      </motion.div>

      {/* Bottom Half Split-Shutter Curtain */}
      <motion.div
        initial={false}
        animate={{ y: stage === 'shutter' ? '100%' : '0%' }}
        transition={{
          duration: 0.6,
          ease: [0.85, 0, 0.15, 1] as const,
        }}
        className="fixed bottom-0 left-0 right-0 h-1/2 carbon-bg border-t border-white/10 z-[51] overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="crt-scanlines pointer-events-none absolute inset-0 opacity-[0.04]"
        />
      </motion.div>

      {/* Phase 3: Razor-Thin Neon Yellow Laser Line Slicing Center */}
      {stage === 'shutter' && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: [1, 1, 0] }}
          transition={{
            duration: 0.55,
            ease: [0.85, 0, 0.15, 1] as const,
          }}
          className="fixed top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-[#D6FF00] shadow-[0_0_24px_#D6FF00,0_0_48px_#D6FF00] z-[55] pointer-events-none origin-center"
        />
      )}

      {/* Phase 2: Neon Yellow Flash Overlay */}
      {showYellowFlash && (
        <motion.div
          initial={{ opacity: 0.95 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-[#D6FF00] mix-blend-screen pointer-events-none z-[54]"
        />
      )}

      {/* Center Animation Stage (F1 Gantry / Kinetic Slam Title) */}
      <motion.div
        animate={{
          opacity: stage === 'shutter' ? 0 : 1,
          scale: stage === 'shutter' ? 0.95 : 1,
        }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[52] flex flex-col items-center justify-center p-4 pointer-events-none"
      >
        {stage === 'gantry' && (
          <div className="flex flex-col items-center max-w-2xl w-full">
            {/* F1 Starting Gantry Housing */}
            <div className="f1-card-cut relative bg-[#0B0B0B]/95 border-2 border-white/15 p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_1px_2px_rgba(255,255,255,0.15)] flex flex-col items-center w-full">
              {/* Telemetry Bracket Header */}
              <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-[9px] sm:text-[10px] font-mono tracking-[0.2em] text-[#888888] uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF1E1E] animate-ping" />
                  FIA // START PROCEDURE
                </span>
                <span className="text-[#D6FF00]">SYSTEM_ONLINE</span>
              </div>

              {/* 5 Circular Starting Lights */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-5 md:gap-7 my-2 sm:my-3">
                {[1, 2, 3, 4, 5].map((index) => {
                  const isLit = activeLights >= index;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center p-1.5 sm:p-2.5 bg-[#050505] rounded-full border border-white/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                    >
                      <div
                        className={`relative w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full transition-all duration-100 flex items-center justify-center ${
                          isLit
                            ? 'bg-[#FF1E1E] border-2 border-[#FFA3A3] shadow-[0_0_24px_#FF1E1E,0_0_48px_#FF1E1E,inset_0_0_16px_rgba(255,255,255,0.8)]'
                            : 'bg-[#141414] border-2 border-[#222222] shadow-inner'
                        }`}
                      >
                        {/* Inner filament ring */}
                        <div
                          className={`w-1/2 h-1/2 rounded-full border border-black/30 transition-all ${
                            isLit
                              ? 'bg-white/40 shadow-[0_0_10px_#FFF]'
                              : 'bg-black/40'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sub-gantry Status Bar */}
              <div className="w-full pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[9px] font-mono tracking-[0.2em] text-[#666666] uppercase">
                <span>SECTOR 01</span>
                <span>5-RED GANTRY</span>
                <span>STATUS: {activeLights}/5</span>
              </div>
            </div>

            {/* Cycling Telemetry Readout Underneath */}
            <div className="mt-6 flex items-center gap-2.5 font-mono text-xs sm:text-sm tracking-[0.22em] uppercase transition-colors">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isGridLocked
                    ? 'bg-[#FF1E1E] shadow-[0_0_10px_#FF1E1E] animate-pulse'
                    : 'bg-[#D6FF00] shadow-[0_0_8px_#D6FF00]'
                }`}
              />
              <span
                className={
                  isGridLocked
                    ? 'text-[#FF1E1E] font-bold drop-shadow-[0_0_12px_rgba(255,30,30,0.6)]'
                    : 'text-[#AAAAAA]'
                }
              >
                {telemetryText}
              </span>
            </div>
          </div>
        )}

        {/* Phase 2: Kinetic Title Slam */}
        {stage === 'lights_out' && (
          <motion.div
            initial={{ scale: 1.55, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-col items-center justify-center text-center px-4"
          >
            {/* Chromatic Aberration Title */}
            <h1 className="animate-chromatic-slam font-display font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-white uppercase italic drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
              ENIGMA <span className="text-[#D6FF00]">// LIVE</span>
            </h1>

            {/* Subtitle */}
            <div className="mt-4 flex items-center gap-2.5 text-xs sm:text-base font-mono tracking-[0.3em] uppercase text-[#D6FF00] font-bold">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D6FF00] animate-ping" />
              LIGHTS OUT // ALL SYSTEMS GREEN
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Skip Button (Bottom-Right Monospace) */}
      <button
        type="button"
        onClick={handleSkip}
        aria-label="Skip Intro Sequence"
        className="fixed bottom-6 right-6 z-[70] px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-[#888888] hover:text-[#D6FF00] bg-[#0A0A0A]/90 hover:bg-[#111111] border border-white/15 hover:border-[#D6FF00]/50 backdrop-blur-md transition-colors cursor-pointer select-none"
      >
        [ SKIP &gt;&gt; ]
      </button>
    </div>
  );
}
