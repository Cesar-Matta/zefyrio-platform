"use client";
// SKILL: zustand-store-ts | react-best-practices
// Theme toggle store — persisted in localStorage.
//
// Hydration safety: the initial useState value MUST match what the server
// rendered, otherwise React 18+/Next 16 throws a hydration mismatch and
// (on mobile especially) shows a blank white screen until JS recovers.
// We always start with the SSR default ("dark", matching the data-theme
// attribute hardcoded on <html>) and then hydrate the real theme inside
// useEffect, where window/localStorage are safe to touch.

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  isDark: true,
});

const STORAGE_KEY = "zefyrio-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR-stable initial value — matches data-theme="dark" on <html>.
  const [theme, setTheme] = useState<Theme>("dark");

  // Hydrate persisted/system preference after mount (client-only).
  // The synchronous setState here is intentional: it's a one-time post-mount
  // hydration to avoid an SSR/CSR mismatch. The alternative (initializing
  // useState from localStorage) breaks hydration on mobile.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "dark" || stored === "light") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(stored);
        return;
      }
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    } catch {
      // localStorage can throw in private mode on iOS Safari — keep default.
    }
  }, []);

  // Sync DOM attribute when theme changes (external system synchronisation).
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore quota/private-mode failures
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
