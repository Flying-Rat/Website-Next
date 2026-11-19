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
  Motto,
  OpeningCurtain,
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
      <OpeningCurtain />
      <SkipLink />
      <ScrollProgress />
      <Header className="opening-header" />
      <main id={CONTENT_ID} tabIndex={-1}>
        <Hero />
        <About />
        <WhatWeDo />
        <TechStack />
        <Projects />
        <Motto />
        <HowWeWork />
        <AiPolicy />
        <Community />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
