"use client";

import {
  About,
  Contact,
  Footer,
  Header,
  Hero,
  Projects,
  ScrollProgress,
  TechStack,
  WhatWeDo,
} from "./components";
import { AnimationGateProvider } from "./hooks/useAnimationsEnabled";
import { useSectionObserver } from "./hooks/useSectionObserver";

export function HomeClient({ initialShouldAnimate }: { initialShouldAnimate: boolean }) {
  useSectionObserver();

  return (
    <AnimationGateProvider initialShouldAnimate={initialShouldAnimate}>
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <About />
        <WhatWeDo />
        <TechStack />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </AnimationGateProvider>
  );
}
