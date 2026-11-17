import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Enigma Global Aggregator | LeetCode Leaderboard',
  description: 'Real-time performance aggregator and competitive programming leaderboard for the Enigma Coding Club.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080808] text-[#ededed] antialiased selection:bg-neutral-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
