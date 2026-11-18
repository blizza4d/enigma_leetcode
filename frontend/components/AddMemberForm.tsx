'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, UserPlus, Loader2, CheckCircle2, AlertCircle, X, ChevronRight } from 'lucide-react';
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
          ? `${result.member.totalSolved} SOLVED`
          : `STATUS: ${result.member.status}`;

      setSuccessMessage(`DRIVER REGISTERED // @${result.member.username} (${solvedText})`);
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
    <div className="relative w-full pitwall-stripes border border-white/10 border-l-4 border-l-[#D6FF00] p-5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
      {/* Pit Wall Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#888888]">
          <Terminal className="w-3.5 h-3.5 text-[#D6FF00]" />
          <span className="text-white font-bold">PIT_WALL // REGISTER_DRIVER</span>
          <span className="hidden sm:inline text-[#666666]">// DIRECT GRAPHQL UPLINK</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-[#D6FF00]">
          <span className="w-1.5 h-1.5 bg-[#D6FF00] animate-pulse" />
          CONSOLE READY
        </span>
      </div>

      {/* Stark Brutalist Input Console */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row items-stretch md:items-end gap-4"
        aria-label="Add a new LeetCode user to the club roster"
      >
        {/* LeetCode Handle Input */}
        <div className="flex-1">
          <label
            htmlFor="leetcode-username-input"
            className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#888888] mb-1.5"
          >
            &gt; LEETCODE_HANDLE *
          </label>
          <div className="relative flex items-center">
            <ChevronRight className="w-4 h-4 text-[#D6FF00] absolute left-2.5 pointer-events-none" />
            <input
              id="leetcode-username-input"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={isSubmitting}
              placeholder="ENTER USERNAME (E.G. BLIZZA4D)"
              aria-label="LeetCode username"
              required
              className="w-full pl-8 pr-3 py-2.5 text-xs sm:text-sm font-mono bg-black text-white placeholder-[#555555] rounded-none border-0 border-b-2 border-b-white focus:outline-none focus:border-b-[#D6FF00] focus:shadow-[0_6px_20px_-4px_rgba(214,255,0,0.45)] disabled:opacity-50 transition-all duration-150"
            />
          </div>
        </div>

        {/* Optional Callsign / Display Name Input */}
        <div className="md:w-64">
          <label
            htmlFor="display-name-input"
            className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#888888] mb-1.5"
          >
            &gt; CALLSIGN (OPTIONAL)
          </label>
          <input
            id="display-name-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSubmitting}
            placeholder="DISPLAY NAME"
            aria-label="Display name (optional)"
            className="w-full px-3 py-2.5 text-xs sm:text-sm font-mono bg-black text-white placeholder-[#555555] rounded-none border-0 border-b-2 border-b-white/70 focus:outline-none focus:border-b-[#D6FF00] focus:shadow-[0_6px_20px_-4px_rgba(214,255,0,0.45)] disabled:opacity-50 transition-all duration-150"
          />
        </div>

        {/* Aggressive Solid Neon Yellow ADD USER Button with Glitch / Skew Hover */}
        <motion.button
          whileTap={!isSubmitting && username.trim() ? { scale: 0.95 } : undefined}
          type="submit"
          disabled={isSubmitting || !username.trim()}
          aria-label="Add LeetCode user to leaderboard"
          className={`btn-aggressive inline-flex items-center justify-center gap-2 px-7 py-3 text-xs font-display font-bold uppercase tracking-[0.18em] rounded-none border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#D6FF00] focus:ring-offset-2 focus:ring-offset-black ${
            isSubmitting || !username.trim()
              ? 'bg-[#D6FF00]/25 border-[#D6FF00]/25 text-black/60 cursor-not-allowed'
              : 'bg-[#D6FF00] text-black border-[#D6FF00] hover:bg-[#E5FE44] hover:border-[#E5FE44] hover:shadow-[0_0_28px_rgba(214,255,0,0.5)]'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>FETCHING...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>ADD USER</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Inline Status / Error Feedback */}
      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            role="alert"
            className="mt-4 flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-mono text-rose-300 bg-black/80 border border-rose-500/40 border-l-4 border-l-rose-500"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span>ERR // {errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error message"
              className="text-rose-400/70 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            role="status"
            className="mt-4 flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-mono font-bold text-[#D6FF00] bg-black/80 border border-[#D6FF00]/40 border-l-4 border-l-[#D6FF00]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D6FF00] flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss success message"
              className="text-[#D6FF00]/70 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
