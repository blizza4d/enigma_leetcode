'use client';

import React, { useState, useEffect, useRef } from 'react';
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
        setSuccessNotice('Leaderboard updated!');
        setTimeout(() => {
          if (isMountedRef.current) setSuccessNotice(null);
        }, 4000);
        onRefreshComplete();
      } else if (status.state === 'FAILED') {
        stopPolling();
        setIsRefreshing(false);
        setProgress(null);
        setErrorMessage('Refresh encountered an issue. Displaying cached data.');
        onRefreshComplete();
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      // Do not stop immediately on transient polling glitch
      console.warn('Status poll warning:', err);
    }
  };

  const startPolling = () => {
    stopPolling();
    setIsRefreshing(true);
    // Immediate initial poll
    pollStatus();
    // Then every 2 seconds with cleanup
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
        // Refresh is already in progress by background scheduler or another user
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
      <button
        onClick={handleClick}
        disabled={isRefreshing}
        aria-label="Refresh leaderboard data from LeetCode"
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-[#080808] ${
          isRefreshing
            ? 'bg-neutral-900 border-neutral-700 text-neutral-400 cursor-not-allowed'
            : 'bg-white text-black border-white hover:bg-neutral-200 active:scale-95'
        }`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-neutral-400' : 'text-black'}`} />
        <span>
          {isRefreshing
            ? progress && progress.total > 0
              ? `Syncing (${progress.completed}/${progress.total})...`
              : 'Refreshing...'
            : 'Refresh Data'}
        </span>
      </button>

      {/* Messages */}
      {errorMessage && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successNotice && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}
    </div>
  );
}
