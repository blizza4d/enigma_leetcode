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
    // Graceful fallback during SSR when backend may not yet be running
    initialError = err?.message || 'Backend service unreachable';
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080808] text-[#ededed]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LeaderboardDashboard
          initialData={initialData}
          initialError={initialError}
        />
      </main>

      <footer className="border-t border-neutral-800/80 bg-[#080808] py-6 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>The Enigma Global Aggregator &bull; LeetCode Edition</span>
          <span>College Competitive Programming Club</span>
        </div>
      </footer>
    </div>
  );
}
