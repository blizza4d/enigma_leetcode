import React from 'react';
import { Activity, Radio, Zap } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Block */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-9 h-9 bg-[#D6FF00] text-black font-display font-bold text-sm tracking-tighter shadow-[0_0_20px_rgba(214,255,0,0.3)]">
            <Zap className="w-4 h-4 fill-black text-black" />
          </div>
          <div className="leading-none">
            <div className="flex items-center gap-2.5">
              <span className="font-display font-bold text-xs sm:text-sm tracking-[0.18em] text-white uppercase">
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
        </div>

        {/* Live Telemetry Indicators */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/10 text-[10px] font-mono uppercase tracking-[0.16em] text-white">
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
  );
}
