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

  const config =
    {
      STALE: {
        label: 'STALE',
        icon: Clock,
        classes: 'bg-amber-400/15 text-amber-300 border-amber-400/40 hover:bg-amber-400/25',
      },
      NOT_FOUND: {
        label: 'DNF // 404',
        icon: UserX,
        classes: 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25',
      },
      TIMEOUT: {
        label: 'TIMEOUT',
        icon: AlertTriangle,
        classes: 'bg-orange-500/15 text-orange-300 border-orange-500/40 hover:bg-orange-500/25',
      },
      RATE_LIMITED: {
        label: 'THROTTLED',
        icon: ShieldAlert,
        classes: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40 hover:bg-fuchsia-500/25',
      },
      ERROR: {
        label: 'FAULT',
        icon: AlertCircle,
        classes: 'bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25',
      },
    }[status] || {
      label: status,
      icon: AlertCircle,
      classes: 'bg-white/10 text-neutral-300 border-white/20',
    };

  const Icon = config.icon;

  return (
    <div className="relative group/badge inline-flex items-center">
      <span
        tabIndex={0}
        aria-label={`${config.label}: ${tooltipText}`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-[0.12em] uppercase border cursor-help transition-colors ${config.classes}`}
      >
        <Icon className="w-2.5 h-2.5" />
        {config.label}
      </span>

      {/* Telemetry Tooltip */}
      <div
        role="tooltip"
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/badge:flex group-focus-within/badge:flex flex-col z-50 w-52 max-w-xs p-2.5 text-[11px] leading-snug text-white bg-[#0A0A0A] border border-[#D6FF00]/50 shadow-[0_0_20px_rgba(0,0,0,0.9)] pointer-events-none"
      >
        <span className="font-mono font-bold text-[10px] tracking-widest uppercase text-[#D6FF00] mb-1">
          {config.label}
        </span>
        <span className="text-neutral-300 break-words font-sans text-[11px]">{tooltipText}</span>
      </div>
    </div>
  );
}
