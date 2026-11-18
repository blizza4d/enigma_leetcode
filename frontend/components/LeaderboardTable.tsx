'use client';

import React, { useState, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { LeaderboardEntry, SortBy, SortOrder } from '@/types/leaderboard';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/cn';
import {
  ExternalLink,
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Users,
  Crosshair,
} from 'lucide-react';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  sortBy: SortBy;
  order: SortOrder;
  onSortChange: (sortBy: SortBy, order: SortOrder) => void;
  isLoading?: boolean;
}

const towerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const towerRowVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 380,
      damping: 30,
      mass: 0.85,
    },
  },
};

export function LeaderboardTable({
  entries,
  sortBy,
  order,
  onSortChange,
  isLoading = false,
}: LeaderboardTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter(
      (entry) =>
        entry.displayName.toLowerCase().includes(q) ||
        entry.username.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  const handleHeaderClick = (column: SortBy) => {
    if (sortBy === column) {
      onSortChange(column, order === 'desc' ? 'asc' : 'desc');
    } else {
      onSortChange(column, 'desc');
    }
  };

  const renderSortIndicator = (column: SortBy) => {
    if (sortBy !== column) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 text-[#555555] group-hover:text-white transition-colors ml-1.5" />
      );
    }
    return order === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-[#D6FF00] ml-1.5" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-[#D6FF00] ml-1.5" />
    );
  };

  const getAriaSort = (column: SortBy): 'ascending' | 'descending' | 'none' => {
    if (sortBy !== column) return 'none';
    return order === 'asc' ? 'ascending' : 'descending';
  };

  const listAnimationKey = `${sortBy}-${order}-${filteredEntries.map((e) => e.username).join(',')}`;

  return (
    <div className="relative w-full space-y-5">
      {/* Subtle Large Radial Ambient Depth Glow behind the Timing Tower */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-10 -top-12 -bottom-12 -z-10 bg-[radial-gradient(ellipse_at_50%_25%,rgba(214,255,0,0.065)_0%,rgba(255,255,255,0.02)_38%,transparent_72%)]"
      />

      {/* Telemetry Filter & Grid Count Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D6FF00] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER DRIVERS // NAME OR @HANDLE"
            aria-label="Filter leaderboard by member name or username"
            className="w-full pl-6 pr-8 py-2 text-xs font-mono uppercase tracking-[0.14em] bg-transparent border-0 border-b border-white/20 text-white placeholder-[#555555] rounded-none focus:outline-none focus:border-[#D6FF00] focus:shadow-[0_4px_14px_-2px_rgba(214,255,0,0.35)] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search input"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#D6FF00]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[#888888]">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/10">
            <Users className="w-3.5 h-3.5 text-[#D6FF00]" />
            <span>
              GRID: <strong className="text-white tabular-nums">{filteredEntries.length}</strong> /{' '}
              <span className="tabular-nums">{entries.length}</span>
            </span>
          </span>
        </div>
      </div>

      {/* Floating F1 Live Timing Tower (No Encasing Outer Box) */}
      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div
          role="table"
          aria-label="Enigma Club F1 Timing Tower Leaderboard"
          className="min-w-[740px] w-full"
        >
          {/* Floating Minimal Telemetry Column Header Labels */}
          <div role="rowgroup" className="mb-3 px-5 pb-2 border-b border-white/[0.07]">
            <div
              role="row"
              className="flex items-center text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#777777]"
            >
              <div role="columnheader" className="w-28 shrink-0 text-left">
                POS
              </div>
              <div role="columnheader" className="flex-1 min-w-[200px] pr-4">
                DRIVER // HANDLE
              </div>
              <div
                role="columnheader"
                aria-sort={getAriaSort('solved')}
                className="w-56 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => handleHeaderClick('solved')}
                  className={cn(
                    'group inline-flex items-center font-mono uppercase tracking-[0.22em] transition-colors focus:outline-none focus:text-[#D6FF00]',
                    sortBy === 'solved' ? 'text-white' : 'text-[#777777] hover:text-white'
                  )}
                >
                  SOLVED
                  {renderSortIndicator('solved')}
                </button>
              </div>
              <div
                role="columnheader"
                aria-sort={getAriaSort('streak')}
                className="w-32 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => handleHeaderClick('streak')}
                  className={cn(
                    'group inline-flex items-center font-mono uppercase tracking-[0.22em] transition-colors focus:outline-none focus:text-[#D6FF00]',
                    sortBy === 'streak' ? 'text-white' : 'text-[#777777] hover:text-white'
                  )}
                >
                  STREAK
                  {renderSortIndicator('streak')}
                </button>
              </div>
              <div
                role="columnheader"
                aria-sort={getAriaSort('rating')}
                className="w-36 shrink-0 text-right"
              >
                <button
                  type="button"
                  onClick={() => handleHeaderClick('rating')}
                  className={cn(
                    'group inline-flex items-center justify-end font-mono uppercase tracking-[0.22em] transition-colors focus:outline-none focus:text-[#D6FF00]',
                    sortBy === 'rating' ? 'text-white' : 'text-[#777777] hover:text-white'
                  )}
                >
                  RATING
                  {renderSortIndicator('rating')}
                </button>
              </div>
            </div>
          </div>

          {/* Floating Independent Timing Cards */}
          {isLoading ? (
            <div role="rowgroup" className="space-y-3.5">
              {Array.from({ length: 7 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="f1-card-cut flex items-center px-5 py-5 bg-white/5 backdrop-blur-md border border-white/10 border-l-4 border-l-white/10 animate-pulse"
                >
                  <div className="w-28 shrink-0">
                    <div className="h-10 w-16 bg-white/10" />
                  </div>
                  <div className="flex-1 pr-4 space-y-2">
                    <div className="h-4 w-40 bg-white/10" />
                    <div className="h-3 w-24 bg-white/5" />
                  </div>
                  <div className="w-56 shrink-0 space-y-2">
                    <div className="h-6 w-16 bg-white/10" />
                    <div className="h-4 w-40 bg-white/5" />
                  </div>
                  <div className="w-32 shrink-0">
                    <div className="h-5 w-16 bg-white/10" />
                  </div>
                  <div className="w-36 shrink-0 flex justify-end">
                    <div className="h-5 w-20 bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div
              role="rowgroup"
              className="f1-card-cut py-16 px-6 text-center bg-white/5 backdrop-blur-md border border-white/10"
            >
              <Crosshair className="w-7 h-7 text-[#D6FF00]/70 mx-auto mb-3" />
              <p className="font-display text-sm font-bold uppercase tracking-[0.22em] text-white">
                NO DRIVERS ON GRID
              </p>
              <p className="text-xs font-mono text-[#888888] mt-1.5">
                {searchQuery
                  ? `NO TELEMETRY MATCH FOR "${searchQuery.toUpperCase()}".`
                  : 'AWAITING TELEMETRY SYNC FROM LEETCODE.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-5 py-2 text-[11px] font-mono font-bold uppercase tracking-widest bg-[#D6FF00] text-black hover:bg-black hover:text-[#D6FF00] border border-[#D6FF00] transition-colors"
                >
                  RESET FILTER
                </button>
              )}
            </div>
          ) : (
            <motion.div
              key={listAnimationKey}
              role="rowgroup"
              variants={towerContainerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3.5"
            >
              {filteredEntries.map((member) => {
                const isFirst = member.rank === 1;
                const isSecond = member.rank === 2;
                const isThird = member.rank === 3;
                const isPodium = isFirst || isSecond || isThird;

                const total = Math.max(member.totalSolved, 1);
                const easyPct = (member.easySolved / total) * 100;
                const medPct = (member.mediumSolved / total) * 100;
                const hardPct = (member.hardSolved / total) * 100;

                return (
                  <motion.div
                    key={member.username}
                    role="row"
                    variants={towerRowVariants}
                    className={cn(
                      'group relative f1-card-cut flex items-center px-5 py-4 backdrop-blur-md border border-white/10 border-l-4 transition-all duration-150 ease-out overflow-hidden',
                      'bg-white/5 hover:bg-white/10 hover:translate-x-2 hover:border-l-4 hover:border-l-[#D6FF00] hover:border-white/20',
                      isFirst &&
                        'bg-[#D6FF00]/[0.07] border-[#D6FF00]/30 border-l-[#D6FF00] shadow-[0_0_36px_rgba(214,255,0,0.16)] hover:bg-[#D6FF00]/[0.12] hover:shadow-[0_0_44px_rgba(214,255,0,0.24)]',
                      isSecond &&
                        'bg-white/[0.065] border-white/15 border-l-white/85 shadow-[0_6px_28px_rgba(255,255,255,0.04)]',
                      isThird &&
                        'bg-white/[0.055] border-white/15 border-l-white/45',
                      !isPodium && 'border-l-white/10'
                    )}
                  >
                    {/* Massive Watermarked F1 Rank Typography */}
                    <div
                      role="cell"
                      className="w-28 shrink-0 flex items-center relative pr-2"
                    >
                      <span
                        className={cn(
                          'font-display font-black italic tracking-tighter leading-none select-none tabular-nums transition-all duration-150',
                          isFirst &&
                            'text-5xl sm:text-6xl text-[#D6FF00] drop-shadow-[0_0_16px_rgba(214,255,0,0.5)]',
                          isSecond &&
                            'text-5xl sm:text-6xl text-white/55 group-hover:text-white/80',
                          isThird &&
                            'text-5xl sm:text-6xl text-white/35 group-hover:text-white/65',
                          !isPodium &&
                            'text-5xl sm:text-6xl text-white/10 group-hover:text-[#D6FF00]/45'
                        )}
                      >
                        #{member.rank}
                      </span>
                    </div>

                    {/* DRIVER // HANDLE Column */}
                    <div role="cell" className="flex-1 min-w-[200px] pr-4 z-10">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={cn(
                            'font-bold tracking-tight text-base sm:text-lg transition-colors',
                            isFirst ? 'text-white' : 'text-white/95 group-hover:text-white'
                          )}
                        >
                          {member.displayName}
                        </span>
                        {isFirst && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.18em] bg-[#D6FF00] text-black">
                            POLE
                          </span>
                        )}
                        <StatusBadge
                          status={member.status}
                          errorMessage={member.errorMessage}
                        />
                      </div>
                      <a
                        href={`https://leetcode.com/u/${member.username}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${member.displayName}'s LeetCode profile in new tab`}
                        className="inline-flex items-center gap-1 mt-1 text-xs font-mono text-[#888888] hover:text-[#D6FF00] transition-colors focus:outline-none focus:text-[#D6FF00]"
                      >
                        <span>@{member.username}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </div>

                    {/* SOLVED + Muted Color Difficulty Breakdown Group */}
                    <div role="cell" className="w-56 shrink-0 pr-4 z-10">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            'text-xl font-mono font-bold tabular-nums leading-none',
                            isFirst ? 'text-[#D6FF00]' : 'text-white'
                          )}
                        >
                          {member.totalSolved.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#777777]">
                          SOLVED
                        </span>
                      </div>

                      {/* Segmented Telemetry Ratio Bar */}
                      <div className="w-44 h-1 bg-white/10 flex overflow-hidden mt-2 mb-2">
                        <div
                          style={{ width: `${easyPct}%` }}
                          className="h-full bg-emerald-400/80"
                        />
                        <div
                          style={{ width: `${medPct}%` }}
                          className="h-full bg-amber-300/85"
                        />
                        <div
                          style={{ width: `${hardPct}%` }}
                          className="h-full bg-rose-400/85"
                        />
                      </div>

                      {/* Muted Accent Pills for Easy / Medium / Hard */}
                      <div className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums">
                        <span
                          title="Easy Solved"
                          className="px-1.5 py-0.5 bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400/85"
                        >
                          E {member.easySolved}
                        </span>
                        <span
                          title="Medium Solved"
                          className="px-1.5 py-0.5 bg-amber-400/[0.08] border border-amber-400/20 text-amber-300/85"
                        >
                          M {member.mediumSolved}
                        </span>
                        <span
                          title="Hard Solved"
                          className="px-1.5 py-0.5 bg-rose-500/[0.08] border border-rose-500/20 text-rose-400/85"
                        >
                          H {member.hardSolved}
                        </span>
                      </div>
                    </div>

                    {/* STREAK Column (Monospace Telemetry) */}
                    <div role="cell" className="w-32 shrink-0 z-10">
                      <div className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                        <Flame
                          className={cn(
                            'w-4 h-4',
                            member.currentStreak > 0
                              ? 'text-[#D6FF00] fill-[#D6FF00]/25'
                              : 'text-[#444444]'
                          )}
                        />
                        <span
                          className={cn(
                            'text-base font-bold',
                            member.currentStreak > 0 ? 'text-white' : 'text-[#666666]'
                          )}
                        >
                          {member.currentStreak}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-[#777777]">
                          {member.currentStreak === 1 ? 'DAY' : 'DAYS'}
                        </span>
                      </div>
                    </div>

                    {/* RATING Column (Monospace Telemetry) */}
                    <div role="cell" className="w-36 shrink-0 text-right font-mono tabular-nums z-10">
                      {member.contestRating !== null ? (
                        <div>
                          <span className="text-base font-bold text-white">
                            {member.contestRating.toFixed(1)}
                          </span>
                          <p className="text-[10px] uppercase tracking-wider text-[#777777] mt-0.5">
                            {member.contestsAttended}{' '}
                            {member.contestsAttended === 1 ? 'RACE' : 'RACES'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777777] bg-white/[0.04] border border-white/10">
                            UNRATED
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
