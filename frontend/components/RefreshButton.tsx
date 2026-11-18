'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { triggerRefresh, fetchRefreshStatus } from '@/lib/api';
import { RefreshStatus } from '@/types/leaderboard';

interface RefreshButtonProps {
  onRefreshComplete: () => void;
  initialRefreshing?: boolean;
}

export function RefreshButton({ onRefreshComplete, initialRefreshing = false }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(initialRefreshing);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (initialRefreshing) {
      startPolling();
    }
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [initialRefreshing]);

  const pollStatus = async () => {
    try {
      const status: RefreshStatus = await fetchRefreshStatus();
      if (!isMountedRef.current) return;

      if (status.total > 0) {
        setProgress({ completed: status.completed, total: status.total });
      }

      if (status.state === 'DONE') {
        stopPolling();
        setIsRefreshing(false);
        setProgress(null);
        setSuccessNotice('TELEMETRY SYNCED');
        setTimeout(() => {
          if (isMountedRef.current) setSuccessNotice(null);
        }, 4000);
        onRefreshComplete();
      } else if (status.state === 'FAILED') {
        stopPolling();
        setIsRefreshing(false);
        setProgress(null);
        setErrorMessage('Sync fault — showing cached snapshot.');
        onRefreshComplete();
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      console.warn('Status poll warning:', err);
    }
  };

  const startPolling = () => {
    stopPolling();
    setIsRefreshing(true);
    pollStatus();
    pollIntervalRef.current = setInterval(pollStatus, 2000);
  };

  const handleClick = async () => {
    if (isRefreshing) return;
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      setIsRefreshing(true);
      await triggerRefresh();
      startPolling();
    } catch (err: any) {
      if (err?.status === 409) {
        if (err.refreshStatus) {
          setProgress({ completed: err.refreshStatus.completed, total: err.refreshStatus.total });
        }
        startPolling();
      } else {
        setIsRefreshing(false);
        setErrorMessage(err?.message || 'Failed to request refresh');
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <motion.button
        whileTap={!isRefreshing ? { scale: 0.96 } : undefined}
        onClick={handleClick}
        disabled={isRefreshing}
        aria-label="Refresh leaderboard data from LeetCode"
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-mono font-bold uppercase tracking-[0.16em] rounded-none border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#D6FF00] focus:ring-offset-2 focus:ring-offset-[#050505] ${
          isRefreshing
            ? 'bg-[#111111] border-[#D6FF00]/40 text-[#D6FF00] cursor-not-allowed shadow-[0_0_16px_rgba(214,255,0,0.12)]'
            : 'bg-white text-black border-white hover:bg-black hover:text-[#D6FF00] hover:border-[#D6FF00] hover:shadow-[0_0_18px_rgba(214,255,0,0.25)]'
        }`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D6FF00]' : ''}`} />
        <span>
          {isRefreshing
            ? progress && progress.total > 0
              ? `SYNCING [${progress.completed}/${progress.total}]`
              : 'SYNCING...'
            : 'REFRESH TELEMETRY'}
        </span>
      </motion.button>

      {errorMessage && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-rose-300 bg-rose-500/10 border border-rose-500/30">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successNotice && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold tracking-wider text-[#D6FF00] bg-[#D6FF00]/10 border border-[#D6FF00]/40">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}
    </div>
  );
}
