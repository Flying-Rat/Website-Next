import type { Metadata } from 'next';

import { pageMetadata } from '../lib/seo';
import { CreditsClient } from './CreditsClient';

const title = 'Credits | Flying Rat Studio';
const description =
  'The open-source software, typefaces and services the Flying Rat Studio website is built on, with thanks to the people who make them.';

export const metadata: Metadata = pageMetadata({ title, description, path: '/credits' });

export default function CreditsPage() {
  return <CreditsClient />;
}
