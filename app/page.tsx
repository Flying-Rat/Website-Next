import type { Metadata } from 'next';

import { HomeClient } from './HomeClient';

// Title, description and cards come from the root layout; the home page only
// adds its canonical link.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  return <HomeClient />;
}
