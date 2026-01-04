"use client";

import {
  About,
  Contact,
  Footer,
  Header,
  Hero,
  Projects,
  ScrollProgress,
  WhatWeDo,
} from "./components";
import { useSectionObserver } from "./hooks/useSectionObserver";

export default function Home() {
  useSectionObserver();

  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <About />
        <WhatWeDo />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
