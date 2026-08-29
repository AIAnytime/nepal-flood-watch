"use client";

import { useApp } from "./Providers";
import { FAQS } from "@/lib/seo";

/**
 * The FAQ is rendered as real, always-present text rather than lazily mounted
 * accordion content. `<details>` keeps the answers collapsed for readers while
 * leaving them in the DOM for crawlers and answer engines — content injected only
 * on click is content that never gets indexed.
 *
 * These same questions and answers are emitted as FAQPage structured data, and the
 * two must stay identical: Google treats a mismatch between visible copy and markup
 * as spam.
 */
export function Faq() {
  const { t, locale } = useApp();
  const items = FAQS[locale];

  return (
    <div className="card divide-y divide-[var(--border)] overflow-hidden">
      {items.map((item, i) => (
        <details key={i} className="group" name="nfw-faq" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 transition-colors hover:bg-[var(--bg-sunken)] sm:p-5">
            <h3 className="text-[0.875rem] font-semibold leading-snug">{item.q}</h3>
            <span className="mt-0.5 shrink-0 text-[var(--text-faint)] transition-transform group-open:rotate-180">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </summary>
          <p className="px-4 pb-4 text-[0.8125rem] leading-relaxed text-[var(--text-muted)] sm:px-5 sm:pb-5">
            {item.a}
          </p>
        </details>
      ))}
      <p className="p-4 text-[0.6875rem] leading-relaxed text-[var(--text-faint)] sm:p-5">
        {t("faq.footnote")}
      </p>
    </div>
  );
}
