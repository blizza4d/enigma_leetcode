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
    <div className="w-full bg-[#0A0A0A]/90 backdrop-blur-md border border-white/10 border-l-2 border-l-[#D6FF00] p-4 sm:p-5">
      {/* Console Header Line */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#888888]">
          <Terminal className="w-3.5 h-3.5 text-[#D6FF00]" />
          <span className="text-white font-bold">PIT_WALL // REGISTER_DRIVER</span>
          <span className="hidden sm:inline text-[#888888]">// LIVE GRAPHQL INGEST</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#D6FF00]/80 hidden sm:inline">
          READY_
        </span>
      </div>

      {/* Brutalist Sharp Terminal Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row items-stretch md:items-end gap-4"
        aria-label="Add a new LeetCode user to the club roster"
      >
        {/* LeetCode Username Input - Bottom Border Only + Neon Focus Glow */}
        <div className="flex-1">
          <label
            htmlFor="leetcode-username-input"
            className="block text-[10px] font-mono uppercase tracking-[0.18em] text-[#888888] mb-1"
          >
            &gt; LEETCODE_HANDLE *
          </label>
          <div className="relative flex items-center">
            <ChevronRight className="w-4 h-4 text-[#D6FF00] absolute left-0 pointer-events-none" />
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
              className="w-full pl-5 pr-2 py-2 text-xs sm:text-sm font-mono bg-transparent text-white placeholder-[#555555] rounded-none border-0 border-b border-white/25 focus:outline-none focus:border-[#D6FF00] focus:shadow-[0_4px_14px_-2px_rgba(214,255,0,0.4)] disabled:opacity-50 transition-all duration-150"
            />
          </div>
        </div>

        {/* Optional Display Name Input */}
        <div className="md:w-64">
          <label
            htmlFor="display-name-input"
            className="block text-[10px] font-mono uppercase tracking-[0.18em] text-[#888888] mb-1"
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
            className="w-full px-1 py-2 text-xs sm:text-sm font-mono bg-transparent text-white placeholder-[#555555] rounded-none border-0 border-b border-white/20 focus:outline-none focus:border-[#D6FF00] focus:shadow-[0_4px_14px_-2px_rgba(214,255,0,0.4)] disabled:opacity-50 transition-all duration-150"
          />
        </div>

        {/* High-Visibility Neon Yellow Button -> Inverts to Black + Neon Border on Hover */}
        <motion.button
          whileTap={!isSubmitting && username.trim() ? { scale: 0.97 } : undefined}
          type="submit"
          disabled={isSubmitting || !username.trim()}
          aria-label="Add LeetCode user to leaderboard"
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-display font-bold uppercase tracking-[0.16em] rounded-none border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#D6FF00] focus:ring-offset-2 focus:ring-offset-[#050505] ${
            isSubmitting || !username.trim()
              ? 'bg-[#D6FF00]/30 border-[#D6FF00]/30 text-black/60 cursor-not-allowed'
              : 'bg-[#D6FF00] text-black border-[#D6FF00] hover:bg-black hover:text-[#D6FF00] hover:border-[#D6FF00] hover:shadow-[0_0_22px_rgba(214,255,0,0.35)]'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>FETCHING...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
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
            className="mt-3 flex items-center justify-between gap-2 px-3 py-2 text-xs font-mono text-rose-300 bg-rose-500/10 border border-rose-500/30 border-l-2 border-l-rose-400"
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
            className="mt-3 flex items-center justify-between gap-2 px-3 py-2 text-xs font-mono font-bold text-[#D6FF00] bg-[#D6FF00]/10 border border-[#D6FF00]/40 border-l-2 border-l-[#D6FF00]"
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
