'use client';

import React, { useState, useMemo } from 'react';
import { LeaderboardEntry, SortBy, SortOrder } from '@/types/leaderboard';
import { StatusBadge } from './StatusBadge';
import {
  ExternalLink,
  Flame,
  Trophy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  UserCheck,
} from 'lucide-react';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  sortBy: SortBy;
  order: SortOrder;
  onSortChange: (sortBy: SortBy, order: SortOrder) => void;
  isLoading?: boolean;
}

export function LeaderboardTable({
  entries,
  sortBy,
  order,
  onSortChange,
  isLoading = false,
}: LeaderboardTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Client-side search filter by display name or LeetCode username
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
      // Toggle order
      onSortChange(column, order === 'desc' ? 'asc' : 'desc');
    } else {
      // Switch column, default to desc for metrics
      onSortChange(column, 'desc');
    }
  };

  const renderSortIndicator = (column: SortBy) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 transition-colors ml-1" />;
    }
    return order === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-white ml-1" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-white ml-1" />
    );
  };

  const getAriaSort = (column: SortBy): 'ascending' | 'descending' | 'none' => {
    if (sortBy !== column) return 'none';
    return order === 'asc' ? 'ascending' : 'descending';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30 font-bold font-mono text-xs shadow-sm shadow-amber-500/10">
          <Trophy className="w-3.5 h-3.5 text-amber-400 mr-0.5" />
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/10 text-slate-300 border border-slate-300/30 font-bold font-mono text-xs shadow-sm shadow-slate-300/10">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/10 text-amber-600 border border-amber-600/30 font-bold font-mono text-xs shadow-sm shadow-amber-600/10">
          3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 font-mono font-medium text-neutral-400 text-xs">
        #{rank}
      </span>
    );
  };

  const getRowHighlight = (rank: number) => {
    if (rank === 1) return 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06] border-l-2 border-l-amber-400/70';
    if (rank === 2) return 'bg-slate-400/[0.02] hover:bg-slate-400/[0.05] border-l-2 border-l-slate-400/70';
    if (rank === 3) return 'bg-amber-700/[0.02] hover:bg-amber-700/[0.05] border-l-2 border-l-amber-600/70';
    return 'hover:bg-neutral-900/60 border-l-2 border-l-transparent';
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Bar & Summary Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or @username..."
            aria-label="Filter leaderboard by member name or username"
            className="w-full pl-9 pr-9 py-1.5 text-xs bg-[#111111] border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search input"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-neutral-500" />
            Showing {filteredEntries.length} of {entries.length} members
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-[#0d0d0d] shadow-2xl">
        <table className="w-full text-left border-collapse" aria-label="Competitive Programming Club Leaderboard">
          <thead>
            <tr className="border-b border-neutral-800 bg-[#141414] text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              <th scope="col" className="py-3 px-4 w-16 text-center">
                Rank
              </th>
              <th scope="col" className="py-3 px-4">
                Member
              </th>
              <th scope="col" aria-sort={getAriaSort('solved')} className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleHeaderClick('solved')}
                  className="group inline-flex items-center font-mono uppercase text-[11px] hover:text-white transition-colors focus:outline-none focus:underline"
                >
                  Problems Solved
                  {renderSortIndicator('solved')}
                </button>
              </th>
              <th scope="col" aria-sort={getAriaSort('streak')} className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleHeaderClick('streak')}
                  className="group inline-flex items-center font-mono uppercase text-[11px] hover:text-white transition-colors focus:outline-none focus:underline"
                >
                  Streak
                  {renderSortIndicator('streak')}
                </button>
              </th>
              <th scope="col" aria-sort={getAriaSort('rating')} className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleHeaderClick('rating')}
                  className="group inline-flex items-center font-mono uppercase text-[11px] hover:text-white transition-colors focus:outline-none focus:underline"
                >
                  Contest Rating
                  {renderSortIndicator('rating')}
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800/60 text-xs">
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 10 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-4 px-4 text-center">
                    <div className="h-6 w-6 bg-neutral-800 rounded-full mx-auto" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-32 bg-neutral-800 rounded mb-1.5" />
                    <div className="h-3 w-20 bg-neutral-900 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-16 bg-neutral-800 rounded mb-1" />
                    <div className="h-2.5 w-28 bg-neutral-900 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-12 bg-neutral-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-20 bg-neutral-800 rounded" />
                  </td>
                </tr>
              ))
            ) : filteredEntries.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={5} className="py-12 text-center text-neutral-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-sm font-medium text-neutral-400">No members found</p>
                    <p className="text-xs text-neutral-600">
                      {searchQuery
                        ? `No club members match the filter "${searchQuery}".`
                        : 'No leaderboard statistics currently available.'}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-xs text-white underline underline-offset-4 hover:text-neutral-300"
                      >
                        Reset search filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Member Rows
              filteredEntries.map((member) => (
                <tr
                  key={member.username}
                  className={`transition-colors duration-100 ${getRowHighlight(member.rank)}`}
                >
                  {/* Rank */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {getRankBadge(member.rank)}
                  </td>

                  {/* Member Name + Profile Link */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-neutral-200">
                        {member.displayName}
                      </span>
                      <a
                        href={`https://leetcode.com/u/${member.username}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${member.displayName}'s LeetCode profile in new tab`}
                        className="inline-flex items-center gap-0.5 text-neutral-500 hover:text-neutral-300 transition-colors font-mono text-[11px]"
                      >
                        @{member.username}
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                      <StatusBadge status={member.status} errorMessage={member.errorMessage} />
                    </div>
                  </td>

                  {/* Solved + Breakdown */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className="text-sm font-bold font-mono text-white">
                        {member.totalSolved.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="text-emerald-400" title="Easy Solved">
                          E: {member.easySolved}
                        </span>
                        <span className="text-neutral-600">/</span>
                        <span className="text-amber-400" title="Medium Solved">
                          M: {member.mediumSolved}
                        </span>
                        <span className="text-neutral-600">/</span>
                        <span className="text-rose-400" title="Hard Solved">
                          H: {member.hardSolved}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Current Active Streak */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 font-mono">
                      <Flame
                        className={`w-3.5 h-3.5 ${
                          member.currentStreak > 0
                            ? 'text-orange-500 fill-orange-500/20'
                            : 'text-neutral-600'
                        }`}
                      />
                      <span
                        className={`font-semibold ${
                          member.currentStreak > 0 ? 'text-neutral-200' : 'text-neutral-500'
                        }`}
                      >
                        {member.currentStreak} {member.currentStreak === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </td>

                  {/* Contest Rating */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {member.contestRating !== null ? (
                      <div className="space-y-0.5 font-mono">
                        <span className="text-sm font-bold text-neutral-200">
                          {member.contestRating.toFixed(1)}
                        </span>
                        <p className="text-[10px] text-neutral-500">
                          {member.contestsAttended}{' '}
                          {member.contestsAttended === 1 ? 'contest' : 'contests'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0.5 font-mono">
                        <span className="text-xs italic text-neutral-500">Unrated</span>
                        <p className="text-[10px] text-neutral-600">0 contests</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
