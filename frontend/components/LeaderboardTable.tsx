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
      staggerChildren: 0.055,
      delayChildren: 0.05,
    },
  },
};

const towerRowVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 420,
      damping: 32,
      mass: 0.8,
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
        <ArrowUpDown className="w-3.5 h-3.5 text-[#666666] group-hover:text-white transition-colors ml-1.5" />
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

  const formatPos = (rank: number) => String(rank).padStart(2, '0');

  // Key forces clean staggered replay when sort order or list membership changes
  const listAnimationKey = `${sortBy}-${order}-${filteredEntries.map((e) => e.username).join(',')}`;

  return (
    <div className="w-full space-y-4">
      {/* Telemetry Filter & Grid Count Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D6FF00] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER DRIVERS // NAME OR @HANDLE"
            aria-label="Filter leaderboard by member name or username"
            className="w-full pl-6 pr-8 py-2 text-xs font-mono uppercase tracking-[0.12em] bg-transparent border-0 border-b border-white/20 text-white placeholder-[#666666] rounded-none focus:outline-none focus:border-[#D6FF00] focus:shadow-[0_4px_14px_-2px_rgba(214,255,0,0.35)] transition-all"
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

        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.16em] text-[#888888]">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/10">
            <Users className="w-3.5 h-3.5 text-[#D6FF00]" />
            <span>
              GRID: <strong className="text-white">{filteredEntries.length}</strong> / {entries.length}
            </span>
          </span>
        </div>
      </div>

      {/* F1 Live Timing Tower */}
      <div className="overflow-x-auto pb-2">
        <div
          role="table"
          aria-label="Enigma Club F1 Timing Tower Leaderboard"
          className="min-w-[700px] w-full"
        >
          {/* Timing Tower Column Header Strip */}
          <div
            role="rowgroup"
            className="mb-2 bg-[#0D0D0D] border border-white/10 border-b-2 border-b-[#D6FF00]/60"
          >
            <div
              role="row"
              className="flex items-center px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#888888]"
            >
              <div role="columnheader" className="w-20 shrink-0 text-left">
                POS
              </div>
              <div role="columnheader" className="flex-1 min-w-[200px] pr-4">
                DRIVER // HANDLE
              </div>
              <div
                role="columnheader"
                aria-sort={getAriaSort('solved')}
                className="w-48 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => handleHeaderClick('solved')}
                  className={cn(
                    'group inline-flex items-center font-mono uppercase tracking-[0.2em] transition-colors focus:outline-none focus:text-[#D6FF00]',
                    sortBy === 'solved' ? 'text-white' : 'text-[#888888] hover:text-white'
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
                    'group inline-flex items-center font-mono uppercase tracking-[0.2em] transition-colors focus:outline-none focus:text-[#D6FF00]',
                    sortBy === 'streak' ? 'text-white' : 'text-[#888888] hover:text-white'
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
                    'group inline-flex items-center justify-end font-mono uppercase tracking-[0.2em] transition-colors focus:outline-none focus:text-[#D6FF00]',
                    sortBy === 'rating' ? 'text-white' : 'text-[#888888] hover:text-white'
                  )}
                >
                  RATING
                  {renderSortIndicator('rating')}
                </button>
              </div>
            </div>
          </div>

          {/* Timing Tower Rows */}
          {isLoading ? (
            <div role="rowgroup" className="space-y-2">
              {Array.from({ length: 7 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="flex items-center px-4 py-4 bg-white/[0.04] backdrop-blur-md border border-white/[0.06] border-l-4 border-l-white/10 animate-pulse"
                >
                  <div className="w-20 shrink-0">
                    <div className="h-6 w-10 bg-white/10" />
                  </div>
                  <div className="flex-1 pr-4 space-y-2">
                    <div className="h-4 w-36 bg-white/10" />
                    <div className="h-3 w-24 bg-white/5" />
                  </div>
                  <div className="w-48 shrink-0 space-y-2">
                    <div className="h-5 w-14 bg-white/10" />
                    <div className="h-1.5 w-32 bg-white/5" />
                  </div>
                  <div className="w-32 shrink-0">
                    <div className="h-4 w-16 bg-white/10" />
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
              className="py-16 px-4 text-center bg-white/[0.03] backdrop-blur-md border border-white/10"
            >
              <Crosshair className="w-7 h-7 text-[#D6FF00]/60 mx-auto mb-3" />
              <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
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
                  className="mt-4 px-4 py-1.5 text-[11px] font-mono font-bold uppercase tracking-widest bg-[#D6FF00] text-black hover:bg-black hover:text-[#D6FF00] border border-[#D6FF00] transition-colors"
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
              className="space-y-2"
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
                      'group relative flex items-center px-4 py-3.5 backdrop-blur-md border border-white/[0.08] border-l-4 transition-all duration-150 ease-out',
                      'bg-white/5 hover:bg-white/[0.11] hover:translate-x-[4px] hover:border-l-[#D6FF00] hover:border-white/20',
                      isFirst &&
                        'bg-[#D6FF00]/[0.07] border-[#D6FF00]/30 border-l-[#D6FF00] shadow-[0_0_28px_rgba(214,255,0,0.14)] hover:bg-[#D6FF00]/[0.12]',
                      isSecond &&
                        'bg-white/[0.07] border-white/20 border-l-white shadow-[0_0_20px_rgba(255,255,255,0.06)]',
                      isThird &&
                        'bg-white/[0.06] border-amber-400/25 border-l-amber-400/90',
                      !isPodium && 'border-l-white/15'
                    )}
                  >
                    {/* POS Column */}
                    <div role="cell" className="w-20 shrink-0 flex items-center gap-2">
                      <span
                        className={cn(
                          'font-display font-bold tracking-wider tabular-nums',
                          isFirst &&
                            'text-xl text-[#D6FF00] drop-shadow-[0_0_10px_rgba(214,255,0,0.55)]',
                          isSecond && 'text-lg text-white',
                          isThird && 'text-lg text-amber-300',
                          !isPodium && 'text-sm font-mono text-[#888888] group-hover:text-white'
                        )}
                      >
                        {formatPos(member.rank)}
                      </span>
                      {isFirst && (
                        <span className="hidden sm:inline-block px-1 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest bg-[#D6FF00] text-black">
                          P1
                        </span>
                      )}
                    </div>

                    {/* DRIVER // HANDLE Column */}
                    <div role="cell" className="flex-1 min-w-[200px] pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'font-bold tracking-tight text-sm sm:text-base transition-colors',
                            isFirst ? 'text-white' : 'text-white/95 group-hover:text-white'
                          )}
                        >
                          {member.displayName}
                        </span>
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
                        className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-mono text-[#888888] hover:text-[#D6FF00] transition-colors focus:outline-none focus:text-[#D6FF00]"
                      >
                        <span>@{member.username}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </div>

                    {/* SOLVED + Difficulty Telemetry Bar */}
                    <div role="cell" className="w-48 shrink-0 pr-4">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            'text-lg font-mono font-bold tabular-nums',
                            isFirst ? 'text-[#D6FF00]' : 'text-white'
                          )}
                        >
                          {member.totalSolved.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono text-[#888888] uppercase">
                          AC
                        </span>
                      </div>

                      {/* Mini Telemetry Bar */}
                      <div className="w-36 h-1 bg-white/10 flex overflow-hidden mt-1.5 mb-1">
                        <div
                          style={{ width: `${easyPct}%` }}
                          className="h-full bg-emerald-400"
                        />
                        <div
                          style={{ width: `${medPct}%` }}
                          className="h-full bg-[#D6FF00]"
                        />
                        <div
                          style={{ width: `${hardPct}%` }}
                          className="h-full bg-rose-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono tabular-nums">
                        <span className="text-emerald-400" title="Easy Solved">
                          E:{member.easySolved}
                        </span>
                        <span className="text-[#D6FF00]" title="Medium Solved">
                          M:{member.mediumSolved}
                        </span>
                        <span className="text-rose-400" title="Hard Solved">
                          H:{member.hardSolved}
                        </span>
                      </div>
                    </div>

                    {/* STREAK Column */}
                    <div role="cell" className="w-32 shrink-0">
                      <div className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                        <Flame
                          className={cn(
                            'w-3.5 h-3.5',
                            member.currentStreak > 0
                              ? 'text-[#D6FF00] fill-[#D6FF00]/25'
                              : 'text-[#555555]'
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm font-bold',
                            member.currentStreak > 0 ? 'text-white' : 'text-[#666666]'
                          )}
                        >
                          {member.currentStreak}
                        </span>
                        <span className="text-[10px] uppercase text-[#888888]">
                          {member.currentStreak === 1 ? 'DAY' : 'DAYS'}
                        </span>
                      </div>
                    </div>

                    {/* RATING Column */}
                    <div role="cell" className="w-36 shrink-0 text-right font-mono tabular-nums">
                      {member.contestRating !== null ? (
                        <div>
                          <span className="text-sm font-bold text-white">
                            {member.contestRating.toFixed(1)}
                          </span>
                          <p className="text-[10px] uppercase tracking-wider text-[#888888]">
                            {member.contestsAttended}{' '}
                            {member.contestsAttended === 1 ? 'RACE' : 'RACES'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#888888] bg-white/[0.04] border border-white/10">
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
