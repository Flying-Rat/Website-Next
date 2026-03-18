"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

function emptySubscribe() {
  return () => {};
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const cycleTheme = useCallback(() => {
    const current = theme ?? "system";
    const order: Theme[] = ["light", "dark", "system"];
    const idx = order.indexOf(current as Theme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
  }, [theme, setTheme]);

  return {
    theme: theme as Theme | undefined,
    setTheme,
    resolvedTheme: resolvedTheme as "light" | "dark" | undefined,
    cycleTheme,
    mounted,
  };
}
