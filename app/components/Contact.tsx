'use client';

import { ContactSection, FOUNDER } from './ContactSection';

export function Contact() {
  const email = 'martin.pernica@flying-rat.studio';

  return (
    <ContactSection
      id="contact"
      titleKey="contact.title"
      descriptionKey="contact.subtitle"
      person={FOUNDER}
      email={email}
      secondary={{ leadKey: 'contact.other', email: 'marty@flying-rat.studio' }}
      withFadeIn
      afterSocial={
        <a
          href="https://x.com/search?q=%23flyingWithRats"
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline -my-2 [background-position:0_calc(100%-0.5rem)] py-2 font-mono text-sm text-muted hover:text-accent-ink"
        >
          #flyingWithRats
        </a>
      }
    />
  );
}
