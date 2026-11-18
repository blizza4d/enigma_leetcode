'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import { LeaderboardResponse, SortBy, SortOrder } from '@/types/leaderboard';
import { fetchLeaderboard, API_BASE_URL } from '@/lib/api';
import { LeaderboardTable } from './LeaderboardTable';
import { RefreshButton } from './RefreshButton';
import { AddMemberForm } from './AddMemberForm';
import { Trophy, Code2, Flame, Award, Clock, AlertTriangle, Gauge } from 'lucide-react';

interface LeaderboardDashboardProps {
  initialData?: LeaderboardResponse | null;
  initialError?: string | null;
}

const kpiContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const kpiCardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function LeaderboardDashboard({ initialData, initialError }: LeaderboardDashboardProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(initialData || null);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData && !initialError);
  const [sortBy, setSortBy] = useState<SortBy>('solved');
  const [order, setOrder] = useState<SortOrder>('desc');

  const loadData = useCallback(
    async (newSortBy = sortBy, newOrder = order) => {
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
    },
    [sortBy, order]
  );

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

  const formattedLastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'AWAITING SYNC';

  const entries = data?.entries || [];
  const totalSolvedAcrossAll = entries.reduce((acc, curr) => acc + curr.totalSolved, 0);

  const topSolver =
    entries.length > 0
      ? [...entries].sort((a, b) => b.totalSolved - a.totalSolved)[0]
      : null;

  const topRated =
    entries.length > 0
      ? [...entries]
          .filter((e) => e.contestRating !== null)
          .sort((a, b) => (b.contestRating || 0) - (a.contestRating || 0))[0]
      : null;

  const longestStreak =
    entries.length > 0
      ? [...entries].sort((a, b) => b.currentStreak - a.currentStreak)[0]
      : null;

  return (
    <div className="space-y-8">
      {/* Hero Telemetry Header with Glitch / Kinetic Reveal Title */}
      <section className="relative pb-6 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-[#D6FF00]"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>ENIGMA RACING // COMPETITIVE PROGRAMMING TELEMETRY</span>
            </motion.div>

            {/* Glitch + Kinetic Clip Reveal Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 18, skewX: -6 }}
              animate={{ opacity: 1, y: 0, skewX: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1
                data-text="CLUB PERFORMANCE LEADERBOARD"
                className="glitch-title font-display text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-[0.06em] text-white leading-tight"
              >
                CLUB PERFORMANCE{' '}
                <span className="text-[#D6FF00]">LEADERBOARD</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-xs sm:text-sm font-mono text-[#888888] max-w-2xl"
            >
              REAL-TIME LEETCODE GRID RANKINGS // RANKED BY PROBLEMS SOLVED, CONTEST RATING &amp; STREAK.
            </motion.p>
          </div>

          {/* Right Pit-Wall Controls */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0"
          >
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.12em] text-[#888888] bg-[#0D0D0D] px-3 py-2 border border-white/10">
              <Clock className="w-3.5 h-3.5 text-[#D6FF00]" />
              <span>
                SYNC: <strong className="text-white">{formattedLastUpdated}</strong>
              </span>
            </div>

            <RefreshButton
              onRefreshComplete={handleRefreshComplete}
              initialRefreshing={data?.refreshing || false}
            />
          </motion.div>
        </div>
      </section>

      {/* Pit-Wall Command Console: Add New LeetCode User */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.35 }}
      >
        <AddMemberForm onMemberAdded={handleMemberAdded} />
      </motion.section>

      {/* Telemetry KPI Strip */}
      <motion.section
        variants={kpiContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* Total Club Solved */}
        <motion.div
          variants={kpiCardVariants}
          className="group relative f1-card-cut p-4 bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-[#D6FF00]/60 hover:bg-white/[0.07] transition-all duration-150"
        >
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
              TOTAL AC
            </span>
            <Code2 className="w-4 h-4 text-[#D6FF00]" />
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
            {isLoading && !data ? '---' : totalSolvedAcrossAll.toLocaleString()}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#888888] mt-1 tabular-nums">
            {entries.length} ACTIVE DRIVERS
          </p>
        </motion.div>

        {/* P1 Pole Leader */}
        <motion.div
          variants={kpiCardVariants}
          className="group relative f1-card-cut p-4 bg-[#D6FF00]/[0.06] backdrop-blur-md border border-[#D6FF00]/35 border-l-4 border-l-[#D6FF00] shadow-[0_0_24px_rgba(214,255,0,0.1)] hover:border-[#D6FF00] transition-all duration-150"
        >
          <div className="flex items-center justify-between text-[#D6FF00] mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
              POLE POSITION
            </span>
            <Trophy className="w-4 h-4 text-[#D6FF00]" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white truncate">
            {topSolver ? topSolver.displayName : '---'}
          </p>
          <p className="text-[11px] font-mono font-bold text-[#D6FF00] mt-1 uppercase tabular-nums">
            {topSolver ? `${topSolver.totalSolved.toLocaleString()} SOLVED` : 'NO DATA'}
          </p>
        </motion.div>

        {/* Top Contest Rating */}
        <motion.div
          variants={kpiCardVariants}
          className="group relative f1-card-cut p-4 bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-[#D6FF00]/60 hover:bg-white/[0.07] transition-all duration-150"
        >
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
              PEAK RATING
            </span>
            <Award className="w-4 h-4 text-emerald-400/85" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white truncate">
            {topRated ? topRated.displayName : '---'}
          </p>
          <p className="text-[11px] font-mono text-emerald-400/85 mt-1 uppercase tabular-nums">
            {topRated?.contestRating
              ? `${topRated.contestRating.toFixed(1)} ELO`
              : 'UNRATED'}
          </p>
        </motion.div>

        {/* Longest Active Streak */}
        <motion.div
          variants={kpiCardVariants}
          className="group relative f1-card-cut p-4 bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-[#D6FF00]/60 hover:bg-white/[0.07] transition-all duration-150"
        >
          <div className="flex items-center justify-between text-[#888888] mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
              HOT STREAK
            </span>
            <Flame className="w-4 h-4 text-[#D6FF00]" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white truncate">
            {longestStreak ? longestStreak.displayName : '---'}
          </p>
          <p className="text-[11px] font-mono text-[#D6FF00] mt-1 uppercase tabular-nums">
            {longestStreak ? `${longestStreak.currentStreak} CONSECUTIVE DAYS` : '0 DAYS'}
          </p>
        </motion.div>
      </motion.section>

      {/* Telemetry Fault Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-rose-500/10 border border-rose-500/35 border-l-4 border-l-rose-500 text-rose-200 text-xs font-mono flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-rose-300">
              TELEMETRY UPLINK FAILED
            </p>
            <p className="text-rose-200/90">{error}</p>
            <p className="text-[11px] text-[#888888] pt-1">
              ENDPOINT:{' '}
              <code className="text-white bg-black/60 px-1.5 py-0.5 border border-white/10">
                {API_BASE_URL}
              </code>
            </p>
          </div>
        </div>
      )}

      {/* F1 Timing Tower */}
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
