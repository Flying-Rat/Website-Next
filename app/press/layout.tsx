import type { Metadata } from 'next';

import { pageMetadata } from '../lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Press Kit | Flying Rat Studio',
  description:
    'Download official Flying Rat Studio logos and brand assets. Access our press kit with logo files in SVG and PNG formats, plus brand usage guidelines.',
  socialDescription:
    'Download official Flying Rat Studio logos and brand assets for press and media use.',
  path: '/press',
  keywords: [
    'Flying Rat Studio',
    'press kit',
    'brand assets',
    'logo download',
    'media kit',
    'game studio press',
  ],
});

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return children;
}
