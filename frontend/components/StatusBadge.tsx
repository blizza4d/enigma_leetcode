'use client';

import React from 'react';
import { FetchStatus } from '@/types/leaderboard';
import { AlertCircle, Clock, ShieldAlert, UserX, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: FetchStatus;
  errorMessage: string | null;
}

export function StatusBadge({ status, errorMessage }: StatusBadgeProps) {
  if (status === 'OK') {
    return null;
  }

  const tooltipText = errorMessage || `Status: ${status}`;

  const config = {
    STALE: {
      label: 'STALE',
      icon: Clock,
      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
    },
    NOT_FOUND: {
      label: 'NOT FOUND',
      icon: UserX,
      classes: 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20',
    },
    TIMEOUT: {
      label: 'TIMEOUT',
      icon: AlertTriangle,
      classes: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20',
    },
    RATE_LIMITED: {
      label: 'RATE LIMITED',
      icon: ShieldAlert,
      classes: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
    },
    ERROR: {
      label: 'ERROR',
      icon: AlertCircle,
      classes: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20',
    },
  }[status] || {
    label: status,
    icon: AlertCircle,
    classes: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  };

  const Icon = config.icon;

  return (
    <div className="relative group inline-flex items-center">
      <span
        tabIndex={0}
        aria-label={`${config.label}: ${tooltipText}`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border cursor-help transition-colors ${config.classes}`}
      >
        <Icon className="w-2.5 h-2.5" />
        {config.label}
      </span>

      {/* Accessible Tooltip */}
      <div
        role="tooltip"
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex group-focus-within:flex flex-col z-50 w-48 max-w-xs p-2 text-[11px] leading-tight text-neutral-200 bg-[#161616] border border-neutral-700 rounded shadow-xl pointer-events-none transition-opacity duration-150"
      >
        <span className="font-semibold text-neutral-300 mb-0.5">{config.label}</span>
        <span className="text-neutral-400 break-words">{tooltipText}</span>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#161616]" />
      </div>
    </div>
  );
}
