'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

let consoleBannerLogged = false;

const ASCII_BANNER = `
 ███████╗███╗   ██╗██╗ ██████╗ ███╗   ███╗ █████╗
 ██╔════╝████╗  ██║██║██╔════╝ ████╗ ████║██╔══██╗
 █████╗  ██╔██╗ ██║██║██║  ███╗██╔████╔██║███████║
 ██╔══╝  ██║╚██╗██║██║██║   ██║██║╚██╔╝██║██╔══██║
 ███████╗██║ ╚████║██║╚██████╔╝██║ ╚═╝ ██║██║  ██║
 ╚══════╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝
   // ENIGMA // LEETCODE TELEMETRY // NO DAYS OFF
`;

export function TelemetryEasterEggs() {
  const [drsActive, setDrsActive] = useState(false);
  const keyBufferRef = useRef('');
  const drsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Easter Egg 3: DevTools Console Banner on page load
  useEffect(() => {
    if (consoleBannerLogged) return;
    consoleBannerLogged = true;

    console.log(
      `%c${ASCII_BANNER}`,
      'color: #D6FF00; background: #050505; font-family: monospace; font-weight: bold; font-size: 11px; padding: 8px 12px; border-left: 4px solid #D6FF00;'
    );
    console.log(
      '%c⚡ PIT WALL TIP:%c Type "drs" or "enigma" on the page for overdrive telemetry, or tap the ENIGMA bolt 5x for Team Radio.',
      'color: #050505; background: #D6FF00; font-family: monospace; font-weight: bold; padding: 2px 6px;',
      'color: #888888; font-family: monospace; padding-left: 6px;'
    );
  }, []);

  // Easter Egg 1: Secret "DRS" Overdrive Mode ("drs" or "enigma" typed anywhere outside inputs)
  useEffect(() => {
    const triggerDrs = () => {
      setDrsActive(true);
      document.documentElement.setAttribute('data-drs', 'true');

      if (drsTimerRef.current) {
        clearTimeout(drsTimerRef.current);
      }

      drsTimerRef.current = setTimeout(() => {
        setDrsActive(false);
        document.documentElement.removeAttribute('data-drs');
      }, 3000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        keyBufferRef.current = (keyBufferRef.current + e.key.toLowerCase()).slice(-10);

        if (
          keyBufferRef.current.endsWith('drs') ||
          keyBufferRef.current.endsWith('enigma')
        ) {
          keyBufferRef.current = '';
          triggerDrs();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (drsTimerRef.current) {
        clearTimeout(drsTimerRef.current);
      }
      document.documentElement.removeAttribute('data-drs');
    };
  }, []);

  return (
    <>
      {/* Subtle CRT Scanline Telemetry Texture Overlay */}
      <div
        aria-hidden="true"
        className="crt-scanlines pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
      />

      {/* Easter Egg 1 Toast: DRS Overdrive Mode */}
      <AnimatePresence>
        {drsActive && (
          <motion.div
            key="drs-toast"
            initial={{ opacity: 0, y: -32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 460, damping: 28 }}
            role="status"
            aria-live="polite"
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
          >
            <div className="f1-card-cut flex items-center gap-2.5 px-5 py-2.5 bg-[#D6FF00] text-black border-2 border-black shadow-[0_0_36px_rgba(214,255,0,0.65)]">
              <Zap className="w-4 h-4 fill-black text-black animate-pulse" />
              <span className="font-display font-bold text-xs sm:text-sm tracking-[0.18em] uppercase whitespace-nowrap">
                ⚡ DRS ENABLED // OVERDRIVE MODE
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
