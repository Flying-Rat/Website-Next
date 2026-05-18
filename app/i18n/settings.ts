export const fallbackLng = 'en';
const languages = ['en', 'cs'] as const;
export type Language = (typeof languages)[number];

const defaultNS = 'common';

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
