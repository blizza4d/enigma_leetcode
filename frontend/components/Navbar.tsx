import React from 'react';
import { Terminal, Shield } from 'lucide-react';

export function Navbar() {
  return (
    <header className="border-b border-neutral-800 bg-[#080808]/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center font-bold font-mono text-sm shadow-sm">
            <Terminal className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                THE ENIGMA AGGREGATOR
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                LEETCODE EDITION
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 hidden sm:block">
              Official Competitive Programming Club Leaderboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Auto-Sync 30m
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 font-mono bg-neutral-900 border border-neutral-800 rounded">
            <Shield className="w-3 h-3 text-neutral-400" />
            LeetCode GraphQL
          </span>
        </div>
      </div>
    </header>
  );
}
