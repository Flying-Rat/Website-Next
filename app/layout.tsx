import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

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

const themeScript = `
(function() {
  var theme = localStorage.getItem('theme');
  var resolved = theme;
  if (!theme || theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.classList.add(resolved);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Theme script injection needed for FOUC prevention */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-[var(--color-bg)] text-[var(--color-text)] antialiased transition-colors">
        <div className="crt-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
