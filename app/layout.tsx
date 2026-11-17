import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Mona_Sans } from 'next/font/google';

import { ThemeProvider } from './components/ThemeProvider';

import './globals.css';

// `subsets` lists what is preloaded. The page opens in English, so only Latin is;
// the extended-Latin files (Czech) are still declared and load when first needed.
// Mona Sans ships a width axis; headings use the wide cut (see `.font-display`).
const monaSans = Mona_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mona',
  axes: ['wdth'],
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Flying Rat Studio | Game Development Studio',
  description:
    'Prague-based game development studio crafting gameplay that feels amazing. We collaborate with top studios on titles like Beat Saber, Darkest Dungeon 2, and more.',
  keywords: [
    'game development',
    'indie games',
    'Prague',
    'Beat Saber',
    'game studio',
    'Flying Rat',
  ],
  authors: [{ name: 'Flying Rat Studio' }],
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  openGraph: {
    title: 'Flying Rat Studio | Game Development Studio',
    description: 'Prague-based game development studio crafting gameplay that feels amazing.',
    url: 'https://flying-rat.studio',
    siteName: 'Flying Rat Studio',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flying Rat Studio | Game Development Studio',
    description: 'Prague-based game development studio crafting gameplay that feels amazing.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${monaSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-page text-ink antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
