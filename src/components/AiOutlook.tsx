"use client";

import { useState } from "react";
import { useApp } from "./Providers";
import { Callout, Spinner } from "./ui";
import { timeAgo } from "@/lib/format";

type Outlook = {
  headline: string;
  bands: { level: string; places: string[]; why: string }[];
  advice: string[];
  caveat: string;
};

const LEVEL_CLASS: Record<string, string> = {
  severe: "risk-severe",
  high: "risk-high",
  watch: "risk-moderate",
  moderate: "risk-moderate",
  normal: "risk-normal",
};

export function AiOutlook() {
  const { t, locale } = useApp();
  const [outlook, setOutlook] = useState<Outlook | null>(null);
  const [meta, setMeta] = useState<{ model: string; basedOn: number; generatedAt: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setOutlook(data.outlook);
      setMeta({ model: data.model, basedOn: data.basedOn, generatedAt: data.generatedAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4 sm:p-5">
      {!outlook && !loading && (
        <div className="flex flex-col items-start gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8125rem] leading-relaxed text-[var(--text-muted)] max-w-lg">
            {t("ai.sub")}
          </p>
          <button onClick={generate} className="btn btn-primary shrink-0">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
            {t("ai.generate")}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2.5 py-6 text-[0.875rem] text-[var(--text-muted)]">
          <Spinner size={16} />
          {t("ai.thinking")}
        </div>
      )}

      {error && !loading && (
        <div className="py-4">
          <Callout tone="danger">{error}</Callout>
          <button onClick={generate} className="btn btn-ghost mt-3">
            {t("common.retry")}
          </button>
        </div>
      )}

      {outlook && !loading && (
        <div className="space-y-4">
          <p className="text-[1rem] font-semibold leading-snug tracking-[-0.01em]">
            {outlook.headline}
          </p>

          <div className="space-y-2">
            {outlook.bands?.map((b, i) => (
              <div
                key={i}
                className="flex flex-wrap items-start gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3"
              >
                <span className={`chip ${LEVEL_CLASS[b.level?.toLowerCase()] ?? "risk-unknown"} shrink-0`}>
                  {b.level}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[0.8125rem] font-medium">{b.places?.join(", ")}</div>
                  <div className="mt-0.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
                    {b.why}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {outlook.advice?.length > 0 && (
            <ul className="space-y-1.5">
              {outlook.advice.map((a, i) => (
                <li key={i} className="flex gap-2.5 text-[0.8125rem] leading-relaxed">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          )}

          {outlook.caveat && <Callout tone="warn">{outlook.caveat}</Callout>}

          <div className="hairline flex flex-wrap items-center justify-between gap-2 pt-3 text-[0.6875rem] text-[var(--text-faint)]">
            <span>
              {t("ai.model")}: {meta?.model} · {t("ai.basis")} {meta?.basedOn} points ·{" "}
              {meta && timeAgo(meta.generatedAt, locale)}
            </span>
            <button onClick={generate} className="text-[var(--accent-text)] font-medium hover:underline">
              {t("hero.refresh")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
