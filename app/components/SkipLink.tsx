'use client';

import { useTranslation } from '../i18n';

/** Id of the element the skip link jumps to; put it on the page's `<main>`. */
export const CONTENT_ID = 'content';

export function SkipLink() {
  const { t } = useTranslation();

  return (
    <a href={`#${CONTENT_ID}`} className="skip-link">
      {t('nav.skipToContent')}
    </a>
  );
}
