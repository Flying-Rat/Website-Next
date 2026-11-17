import type { Metadata } from 'next';

import { pageMetadata } from '../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Jobs | Flying Rat Studio',
  description:
    "Join Flying Rat Studio in Prague. We're hiring engineers, producers, marketers, and IT specialists to help ship great games.",
  socialDescription:
    "Join Flying Rat Studio in Prague. We're hiring engineers, producers, marketers, and IT specialists.",
  path: '/jobs',
  keywords: [
    'Flying Rat Studio',
    'jobs',
    'careers',
    'game development jobs',
    'Prague jobs',
    'Producer',
    'Marketing Manager',
  ],
});

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
