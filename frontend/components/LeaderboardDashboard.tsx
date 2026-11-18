'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LeaderboardResponse, SortBy, SortOrder } from '@/types/leaderboard';
import { fetchLeaderboard, API_BASE_URL } from '@/lib/api';
import { LeaderboardTable } from './LeaderboardTable';
import { RefreshButton } from './RefreshButton';
import { AddMemberForm } from './AddMemberForm';
import { Trophy, Code2, Flame, Award, Clock, AlertTriangle } from 'lucide-react';

interface LeaderboardDashboardProps {
  initialData?: LeaderboardResponse | null;
  initialError?: string | null;
}

export function LeaderboardDashboard({ initialData, initialError }: LeaderboardDashboardProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(initialData || null);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData && !initialError);
  const [sortBy, setSortBy] = useState<SortBy>('solved');
  const [order, setOrder] = useState<SortOrder>('desc');

  const loadData = useCallback(async (newSortBy = sortBy, newOrder = order) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchLeaderboard(newSortBy, newOrder);
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to load leaderboard data from backend.');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, order]);

  // Load data on mount if not provided by server component
  useEffect(() => {
    if (!initialData && !initialError) {
      loadData(sortBy, order);
    }
  }, [initialData, initialError, loadData, sortBy, order]);

  const handleSortChange = (newSortBy: SortBy, newOrder: SortOrder) => {
    setSortBy(newSortBy);
    setOrder(newOrder);
    loadData(newSortBy, newOrder);
  };

  const handleRefreshComplete = () => {
    loadData(sortBy, order);
  };

  const handleMemberAdded = (updatedLeaderboard: LeaderboardResponse) => {
    setError(null);
    setData(updatedLeaderboard);
    loadData(sortBy, order);
  };

  // Format "Last updated"
  const formattedLastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Never refreshed';

  // Compute aggregate club statistics
  const entries = data?.entries || [];
  const totalSolvedAcrossAll = entries.reduce((acc, curr) => acc + curr.totalSolved, 0);

  const topSolver = entries.length > 0
    ? [...entries].sort((a, b) => b.totalSolved - a.totalSolved)[0]
    : null;

  const topRated = entries.length > 0
    ? [...entries].filter(e => e.contestRating !== null).sort((a, b) => (b.contestRating || 0) - (a.contestRating || 0))[0]
    : null;

  const longestStreak = entries.length > 0
    ? [...entries].sort((a, b) => b.currentStreak - a.currentStreak)[0]
    : null;

  return (
    <div className="space-y-8">
      {/* Hero / Header Section */}
      <div className="space-y-4 pb-6 border-b border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Club Performance Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Aggregated metrics for college competitive programmers, sourced via LeetCode&apos;s GraphQL API.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 bg-neutral-900/80 px-3 py-1.5 rounded-md border border-neutral-800">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Last Updated: <strong className="text-neutral-200">{formattedLastUpdated}</strong></span>
            </div>

            <RefreshButton
              onRefreshComplete={handleRefreshComplete}
              initialRefreshing={data?.refreshing || false}
            />
          </div>
        </div>

        {/* Add LeetCode User Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-neutral-400">
            <span className="font-medium text-neutral-300">Add Club Member</span>
            <span className="hidden sm:inline text-neutral-500"> &mdash; enter any public LeetCode username to fetch stats live.</span>
          </div>
          <AddMemberForm onMemberAdded={handleMemberAdded} />
        </div>
      </div>

      {/* Aggregate Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Solved */}
        <div className="p-4 rounded-lg bg-[#0e0e0e] border border-neutral-800/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Solved</span>
            <Code2 className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white">
            {isLoading && !data ? '—' : totalSolvedAcrossAll.toLocaleString()}
          </p>
          <p className="text-[10px] text-neutral-500 font-mono">Across {entries.length} members</p>
        </div>

        {/* Top Problem Solver */}
        <div className="p-4 rounded-lg bg-[#0e0e0e] border border-neutral-800/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-mono uppercase tracking-wider">Top Solver</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-base sm:text-lg font-bold text-white truncate">
            {topSolver ? topSolver.displayName : '—'}
          </p>
          <p className="text-[10px] text-amber-400 font-mono">
            {topSolver ? `${topSolver.totalSolved.toLocaleString()} solved` : 'No data'}
          </p>
        </div>

        {/* Top Contest Rating */}
        <div className="p-4 rounded-lg bg-[#0e0e0e] border border-neutral-800/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-mono uppercase tracking-wider">Top Rating</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-base sm:text-lg font-bold text-white truncate">
            {topRated ? topRated.displayName : '—'}
          </p>
          <p className="text-[10px] text-emerald-400 font-mono">
            {topRated?.contestRating ? `${topRated.contestRating.toFixed(1)} rating` : 'Unrated'}
          </p>
        </div>

        {/* Highest Streak */}
        <div className="p-4 rounded-lg bg-[#0e0e0e] border border-neutral-800/80 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-mono uppercase tracking-wider">Longest Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-base sm:text-lg font-bold text-white truncate">
            {longestStreak ? longestStreak.displayName : '—'}
          </p>
          <p className="text-[10px] text-orange-400 font-mono">
            {longestStreak ? `${longestStreak.currentStreak} active days` : '0 days'}
          </p>
        </div>
      </div>

      {/* Error Alert State */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-200">Failed to connect to backend server</p>
            <p className="text-rose-300/80">{error}</p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Ensure the Spring Boot backend is running on <code className="text-neutral-200 bg-neutral-900 px-1 py-0.5 rounded">{API_BASE_URL}</code>.
            </p>
          </div>
        </div>
      )}

      {/* Main Leaderboard Table */}
      <LeaderboardTable
        entries={entries}
        sortBy={sortBy}
        order={order}
        onSortChange={handleSortChange}
        isLoading={isLoading}
      />
    </div>
  );
}
