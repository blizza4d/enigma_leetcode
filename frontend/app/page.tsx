import { RacingMarquee } from '@/components/RacingMarquee';
import { Navbar } from '@/components/Navbar';
import { LeaderboardDashboard } from '@/components/LeaderboardDashboard';
import { fetchLeaderboard } from '@/lib/api';
import { LeaderboardResponse } from '@/types/leaderboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let initialData: LeaderboardResponse | null = null;
  let initialError: string | null = null;

  try {
    initialData = await fetchLeaderboard('solved', 'desc');
  } catch (err: any) {
    initialError = err?.message || 'Backend service unreachable';
  }

  return (
    <div className="min-h-screen flex flex-col text-white">
      <RacingMarquee />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <LeaderboardDashboard
          initialData={initialData}
          initialError={initialError}
        />
      </main>

      <footer className="border-t border-white/10 bg-[#050505]/90 py-6 text-xs text-[#888888] font-mono uppercase tracking-[0.16em]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ENIGMA // <span className="text-[#D6FF00]">LEETCODE EDITION</span>
          </span>
          <span>NO DAYS OFF // COMPETITIVE PROGRAMMING CLUB</span>
        </div>
      </footer>
    </div>
  );
}
