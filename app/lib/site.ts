/** Facts about the studio and the site that metadata, structured data and llms.txt share. */

/** The address the live site resolves to; canonical links and the sitemap all use it. */
export const SITE_URL = 'https://www.flying-rat.studio';
export const SITE_NAME = 'Flying Rat Studio';
export const SITE_TITLE = 'Flying Rat Studio | Game Development Studio';
export const SITE_DESCRIPTION =
  'Prague-based game development studio crafting gameplay that feels amazing. We collaborate with top studios on titles like Beat Saber, Darkest Dungeon 2, and more.';

/** The picture shown when a page is shared: 1200x630, the size every network expects. */
export const SOCIAL_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'The Flying Rat Studio team on a Prague rooftop, under the headline "Unlocking Adventures"',
};

export const SOCIAL_PROFILES = {
  github: 'https://github.com/Flying-Rat',
  blog: 'https://tech.flying-rat.studio/',
  discord: 'https://discord.gg/M66zD5FsMn',
  facebook: 'https://www.facebook.com/FlyingRatStudio',
  x: 'https://x.com/flyingratstudio',
  youtube: 'https://www.youtube.com/@flyingratstudio/featured',
  twitch: 'https://www.twitch.tv/flyingratstudio',
  instagram: 'https://instagram.com/flyingrat.studio',
};

export const CONTACT_EMAILS = {
  projects: 'martin.pernica@flying-rat.studio',
  general: 'marty@flying-rat.studio',
  jobs: 'marty+jobs@flying-rat.studio',
  press: 'marty+press@flying-rat.studio',
};

/** Every page a search engine should know about, in the order the sitemap lists them. */
export const SITE_PAGES = [
  { path: '/', priority: 1 },
  { path: '/jobs', priority: 0.8 },
  { path: '/press', priority: 0.5 },
  { path: '/games/privacy-policy', priority: 0.3 },
  { path: '/credits', priority: 0.2 },
];

/** An absolute URL for a path on this site; the home page has no trailing slash. */
export function absoluteUrl(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}
