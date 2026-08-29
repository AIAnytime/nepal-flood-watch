"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "./Providers";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import { LOCALE_TAGS, localePath } from "@/lib/seo";

const SECTIONS = [
  { id: "overview", key: "nav.overview" },
  { id: "map", key: "nav.map" },
  { id: "story", key: "nav.story" },
  { id: "rivers", key: "nav.rivers" },
  { id: "news", key: "nav.news" },
  { id: "help", key: "nav.help" },
  { id: "report", key: "nav.report" },
  { id: "faq", key: "nav.faq" },
  { id: "ask", key: "nav.ask" },
];

function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M12 2.5c3.6 4.2 6.5 7.9 6.5 11.2a6.5 6.5 0 1 1-13 0C5.5 10.4 8.4 6.7 12 2.5Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M12 2.5c3.6 4.2 6.5 7.9 6.5 11.2a6.5 6.5 0 1 1-13 0C5.5 10.4 8.4 6.7 12 2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 15.6c1.3.9 2.1-.6 3.4 0s2.1-.6 3.4 0 2.1-.6 3.4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Header() {
  const { t, locale, theme, toggleTheme } = useApp();
  const [active, setActive] = useState("overview");

  // Highlight the section currently filling the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.05, 0.3, 0.6] }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[color-mix(in_srgb,var(--bg-elev)_88%,transparent)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link href={localePath(locale)} className="flex items-center gap-2.5 min-w-0 group">
            <span className="text-[var(--accent)] shrink-0 transition-transform group-hover:scale-105">
              <DropIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-bold leading-tight tracking-[-0.02em] truncate">
                {t("app.name")}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="flex items-center rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] p-0.5"
              role="group"
              aria-label={t("common.language")}
            >
              {/* Real links, not state toggles: a crawler has to be able to walk
                  from here to the Nepali and Hindi pages for them to be indexed. */}
              {LOCALES.map((l: Locale) => (
                <Link
                  key={l}
                  href={localePath(l)}
                  hrefLang={LOCALE_TAGS[l]}
                  aria-current={locale === l ? "true" : undefined}
                  className={`px-2 py-1 text-[0.6875rem] font-semibold rounded-[7px] transition-colors ${
                    locale === l
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  style={
                    locale === l && theme === "dark" ? { color: "#06222b" } : undefined
                  }
                >
                  {LOCALE_LABELS[l]}
                </Link>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className="btn btn-ghost !px-2 !py-1.5"
              aria-label={t("common.theme")}
              title={t("common.theme")}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <nav className="scroll-x -mb-px" aria-label="Sections">
          <ul className="flex gap-0.5 min-w-max">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={active === s.id ? "true" : undefined}
                  className={`inline-block px-3 py-2.5 text-[0.8125rem] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active === s.id
                      ? "border-[var(--accent)] text-[var(--accent-text)]"
                      : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {t(s.key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
