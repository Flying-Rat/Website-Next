"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getResolvedTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme: Theme) {
  const resolved = getResolvedTheme(theme);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolved);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "system";
    }
    return (localStorage.getItem("theme") as Theme) || "system";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const custom = event as CustomEvent<{ theme?: Theme }>;
      const nextTheme = custom.detail?.theme;
      if (!nextTheme) {
        return;
      }
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "theme") {
        return;
      }
      const nextTheme = (event.newValue as Theme) || "system";
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    window.addEventListener("themechange", handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("themechange", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: newTheme } }));
  }, []);

  const toggleTheme = useCallback(() => {
    const current = getResolvedTheme(theme);
    setTheme(current === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const resolvedTheme = getResolvedTheme(theme);

  return { theme, resolvedTheme, setTheme, toggleTheme, mounted };
}
