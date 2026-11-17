'use client';

import {
  About,
  AiPolicy,
  Community,
  Contact,
  Footer,
  Header,
  Hero,
  HowWeWork,
  Projects,
  CONTENT_ID,
  ScrollProgress,
  SkipLink,
  TechStack,
  WhatWeDo,
} from './components';
import { useSectionObserver } from './hooks/useSectionObserver';

export function HomeClient() {
  useSectionObserver();

  return (
    <>
      <SkipLink />
      <ScrollProgress />
      <Header />
      <main id={CONTENT_ID} tabIndex={-1}>
        <Hero />
        <About />
        <WhatWeDo />
        <TechStack />
        <Projects />
        <HowWeWork />
        <AiPolicy />
        <Community />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
