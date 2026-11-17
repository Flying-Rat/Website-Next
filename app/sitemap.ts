import type { MetadataRoute } from 'next';

import { absoluteUrl, SITE_PAGES } from './lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_PAGES.map(({ path, priority }) => ({ url: absoluteUrl(path), priority }));
}
