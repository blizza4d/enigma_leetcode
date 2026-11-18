'use client';

import React from 'react';

const MARQUEE_TEXT = '// ENIGMA LEETCODE RELAY // LIVE RANKINGS // NO DAYS OFF ';

export function RacingMarquee() {
  const repeatedItems = Array.from({ length: 8 }, (_, idx) => idx);

  return (
    <div
      className="w-full overflow-hidden bg-[#D6FF00] text-black border-b border-black/20 select-none"
      aria-hidden="true"
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
  );
}
