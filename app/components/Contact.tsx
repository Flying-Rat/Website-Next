"use client";

import { ContactSection } from "./ContactSection";

export function Contact() {
  const email = "marty@flying-rat.studio";

  return (
    <ContactSection
      id="contact"
      titleKey="contact.title"
      descriptionKey="contact.subtitle"
      martyAltKey="contact.martyAlt"
      email={email}
      withFadeIn
      afterSocial={
        <a
          href="https://x.com/search?q=%23flyingWithRats"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-6 text-accent hover:text-accent-dark transition-colors font-medium"
        >
          #flyingWithRats
        </a>
      }
    />
  );
}
