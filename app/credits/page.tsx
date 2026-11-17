import type { Metadata } from 'next';

import { CreditsClient } from './CreditsClient';

const title = 'Credits | Flying Rat Studio';
const description =
  'The open-source software, typefaces and services the Flying Rat Studio website is built on, with thanks to the people who make them.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://flying-rat.studio/credits',
    siteName: 'Flying Rat Studio',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://flying-rat.studio/credits',
  },
};

export default function CreditsPage() {
  return <CreditsClient />;
}
