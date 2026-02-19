import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Flying Rat Studio | Game Development Studio",
  description:
    "Prague-based game development studio crafting gameplay that feels amazing. We collaborate with top studios on titles like Beat Saber, Darkest Dungeon 2, and more.",
  keywords: [
    "game development",
    "indie games",
    "Prague",
    "Beat Saber",
    "game studio",
    "Flying Rat",
  ],
  authors: [{ name: "Flying Rat Studio" }],
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  openGraph: {
    title: "Flying Rat Studio | Game Development Studio",
    description: "Prague-based game development studio crafting gameplay that feels amazing.",
    url: "https://flying-rat.studio",
    siteName: "Flying Rat Studio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flying Rat Studio | Game Development Studio",
    description: "Prague-based game development studio crafting gameplay that feels amazing.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const themeScript = `(function(){var t=localStorage.getItem('theme');document.documentElement.classList.add(t&&t!=='system'?t:matchMedia('(prefers-color-scheme:light)').matches?'light':'dark')})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Required for FOUC prevention. */}
        {/* oxlint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-[var(--color-bg)] text-[var(--color-text)] antialiased transition-colors">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
