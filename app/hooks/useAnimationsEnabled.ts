import type { ReactNode } from "react";
import {
  createContext,
  createElement,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import { isPrivacyBrowser } from "../lib/motionDetect";

function getShouldAnimate() {
  if (typeof window === "undefined") {
    return true;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ua = navigator.userAgent;
  return !(prefersReducedMotion || isPrivacyBrowser(ua));
}

function subscribeToReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

const AnimationGateContext = createContext<{ initialShouldAnimate: boolean } | null>(null);

export function AnimationGateProvider({
  initialShouldAnimate,
  children,
}: {
  initialShouldAnimate: boolean;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ initialShouldAnimate }), [initialShouldAnimate]);
  return createElement(AnimationGateContext.Provider, { value }, children);
}

export function useAnimationsEnabled() {
  const context = useContext(AnimationGateContext);
  const initialShouldAnimate = context?.initialShouldAnimate ?? true;

  const shouldAnimate = useSyncExternalStore(
    subscribeToReducedMotion,
    () => getShouldAnimate(),
    () => initialShouldAnimate,
  );

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (shouldAnimate) {
      root.classList.remove("no-motion");
    } else {
      root.classList.add("no-motion");
    }
  }, [shouldAnimate]);

  return shouldAnimate;
}
