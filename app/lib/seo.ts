import type { Metadata } from 'next';

import { SITE_NAME, SOCIAL_IMAGE } from './site';

export function pageMetadata({
  title,
  description,
  path,
  socialDescription = description,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  /** A shorter line for link previews, where the full description would be cut off. */
  socialDescription?: string;
  keywords?: string[];
}): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: socialDescription,
      url: path,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'website',
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: socialDescription,
      images: [SOCIAL_IMAGE],
    },
  };
}
