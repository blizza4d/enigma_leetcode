'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { addRosterMember } from '@/lib/api';
import { LeaderboardResponse } from '@/types/leaderboard';

interface AddMemberFormProps {
  onMemberAdded: (updatedLeaderboard: LeaderboardResponse) => void;
}

export function AddMemberForm({ onMemberAdded }: AddMemberFormProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    if (!trimmedUser || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    try {
      const result = await addRosterMember(trimmedUser, displayName.trim() || undefined);
      setUsername('');
      setDisplayName('');

      const solvedText =
        result.member.status === 'OK'
          ? `${result.member.totalSolved} solved`
          : `status: ${result.member.status}`;

      setSuccessMessage(`Added @${result.member.username} (${solvedText}) to the leaderboard.`);
      onMemberAdded(result.leaderboard);

      dismissTimerRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add LeetCode user.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        aria-label="Add a new LeetCode user to the club roster"
      >
        <div className="relative flex-1 sm:w-48 sm:flex-none">
          <UserPlus className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            disabled={isSubmitting}
            placeholder="LeetCode username"
            aria-label="LeetCode username"
            required
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#111111] border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50 transition-colors"
          />
        </div>

        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isSubmitting}
          placeholder="Display name (optional)"
          aria-label="Display name (optional)"
          className="sm:w-44 px-3 py-1.5 text-xs bg-[#111111] border border-neutral-800 rounded-md text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50 transition-colors"
        />

        <button
          type="submit"
          disabled={isSubmitting || !username.trim()}
          aria-label="Add LeetCode user to leaderboard"
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-[#080808] ${
            isSubmitting || !username.trim()
              ? 'bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed'
              : 'bg-neutral-100 text-black border-neutral-100 hover:bg-white active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </>
          )}
        </button>
      </form>

      {errorMessage && (
        <div
          role="alert"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-md"
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error message"
            className="text-rose-400/70 hover:text-rose-200 ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-md"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss success message"
            className="text-emerald-400/70 hover:text-emerald-200 ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
