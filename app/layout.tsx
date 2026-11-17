import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Mona_Sans } from 'next/font/google';

import { ThemeProvider } from './components/ThemeProvider';
import { pageMetadata } from './lib/seo';
import {
  CONTACT_EMAILS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  SOCIAL_IMAGE,
  SOCIAL_PROFILES,
} from './lib/site';

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
};

// Defaults every page inherits. Pages add their own canonical link through
// `pageMetadata`; none is set here, or pages without one (the 404) would claim to
// be the home page.
const { alternates: _homeCanonical, ...homeDefaults } = pageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: '/',
  socialDescription: 'Prague-based game development studio crafting gameplay that feels amazing.',
  keywords: [
    'game development',
    'indie games',
    'Prague',
    'Beat Saber',
    'game studio',
    'Flying Rat',
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...homeDefaults,
  authors: [{ name: SITE_NAME }],
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      legalName: 'GADEN ALPHA s.r.o.',
      url: SITE_URL,
      logo: `${SITE_URL}/press-kit/company/RGB_PNG_fr_horizontal_black.png`,
      image: `${SITE_URL}${SOCIAL_IMAGE.url}`,
      description: SITE_DESCRIPTION,
      foundingDate: '2022',
      vatID: 'CZ09949194',
      email: CONTACT_EMAILS.general,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Bubenská 1477/1',
        postalCode: '170 00',
        addressLocality: 'Prague',
        addressCountry: 'CZ',
      },
      sameAs: Object.values(SOCIAL_PROFILES),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: ['en', 'cs'],
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
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
        <script
          type="application/ld+json"
          // oxlint-disable-next-line react/no-danger -- JSON-LD has to be raw script text; `<` is escaped so the payload cannot close the tag
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
          }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
