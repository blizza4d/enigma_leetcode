import type { Metadata } from 'next';
import { Space_Grotesk, Syncopate, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const syncopate = Syncopate({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-syncopate',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ENIGMA // LEETCODE TIMING TOWER',
  description:
    'High-octane F1-inspired live LeetCode telemetry leaderboard for the Enigma Competitive Programming Club.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${spaceGrotesk.variable} ${syncopate.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen font-sans carbon-bg text-white antialiased selection:bg-[#D6FF00] selection:text-black">
        {children}
      </body>
    </html>
  );
}
