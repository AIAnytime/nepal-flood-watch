"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { translate, type Locale } from "@/lib/i18n";

type Theme = "light" | "dark";

type Ctx = {
  locale: Locale;
  t: (key: string) => string;
  theme: Theme;
  toggleTheme: () => void;
};

const AppContext = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <Providers>");
  return ctx;
}

/** Localised field picker for data objects that carry name/nameNe/nameHi triples. */
export function pick<T extends Record<string, unknown>>(
  obj: T,
  base: string,
  locale: Locale
): string {
  const suffix = locale === "ne" ? "Ne" : locale === "hi" ? "Hi" : "";
  return String(obj[`${base}${suffix}`] ?? obj[base] ?? "");
}

/**
 * Locale now comes from the URL, not from storage.
 *
 * That is a deliberate SEO decision: a language chosen in localStorage is invisible
 * to a crawler, so the Nepali and Hindi copy would never have been indexed. Serving
 * each language at its own URL is what makes this page findable in Nepali at all.
 * Theme stays local, since nobody searches for a colour scheme.
 */
export function Providers({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [theme, setTheme] = useState<Theme>("light");
  /**
   * The persist effect below runs in the same commit as the restore effect, before
   * the restored state has landed. Writing on that first pass would save the
   * default and destroy the preference we are in the middle of reading back, so it
   * skips its own first run.
   */
  const themeWritten = useRef(false);

  // Restore the theme. Storage can throw in restricted contexts, so access is
  // guarded and the app renders fine with no stored value. This must be an effect:
  // localStorage is unavailable during the server render, and reading it at render
  // time on the client would desync hydration. The setState calls below are the
  // whole point of the effect, so the rule is disabled for its body.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const savedTheme = localStorage.getItem("nfw.theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    } catch {
      /* preferences unavailable — defaults are fine */
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (!themeWritten.current) {
      themeWritten.current = true;
      return;
    }
    try {
      localStorage.setItem("nfw.theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    []
  );
  const t = useCallback((key: string) => translate(initialLocale, key), [initialLocale]);

  const value = useMemo(
    () => ({ locale: initialLocale, t, theme, toggleTheme }),
    [initialLocale, t, theme, toggleTheme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
