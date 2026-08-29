"use client";

import { useApp } from "./Providers";
import { Callout, Skeleton } from "./ui";
import { timeAgo } from "@/lib/format";

export type SituationData = {
  stationsMonitored: number;
  stationsElevated: number;
  wettest: { name: string; district: string; rain3d: number } | null;
  feedsOk: number;
  feedsTotal: number;
  articleCount: number;
  fetchedAt: number;
  aiAvailable: boolean;
  aiError?: string | null;
  situation: {
    figures: { label: string; value: string; source: string; asOf: string }[];
    summary: string;
    confidence: string;
  } | null;
};

function Stat({
  value,
  label,
  source,
  tone = "default",
}: {
  value: string;
  label: string;
  source?: string;
  tone?: "default" | "alert";
}) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3.5">
      <div
        className="text-[1.625rem] font-bold leading-none tracking-[-0.03em] tabular-nums"
        style={{ color: tone === "alert" ? "var(--severe)" : "var(--text)" }}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[0.75rem] font-medium leading-snug text-[var(--text-muted)]">
        {label}
      </div>
      {source && (
        <div className="mt-1 text-[0.6875rem] leading-snug text-[var(--text-faint)] truncate" title={source}>
          {source}
        </div>
      )}
    </div>
  );
}

export function EmergencyBanner() {
  const { t } = useApp();
  return (
    <div
      className="rounded-[var(--radius)] border p-4 sm:p-5"
      style={{ background: "var(--severe-soft)", borderColor: "color-mix(in srgb, var(--severe) 28%, transparent)" }}
    >
      {/* Stacks on phones: side-by-side would crush the text into a few words per
          line at 390px, which is exactly where this banner matters most. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="pulse-dot mt-1.5 shrink-0" />
          <div className="min-w-0">
            <div
              className="text-[0.75rem] font-bold uppercase tracking-wider"
              style={{ color: "var(--severe)" }}
            >
              {t("banner.title")}
            </div>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--text)]">
              {t("banner.body")}
            </p>
          </div>
        </div>
        <a href="#help" className="btn btn-danger w-full shrink-0 sm:w-auto">
          {t("banner.cta")}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export function Overview({ data, loading }: { data: SituationData | null; loading: boolean }) {
  const { t, locale } = useApp();

  if (loading) {
    return (
      <div className="card p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px]" />
          ))}
        </div>
        <Skeleton className="mt-4 h-16 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-5">
        <Callout tone="warn">{t("kpi.unavailable")}</Callout>
      </div>
    );
  }

  const figures = data.situation?.figures ?? [];

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[0.9375rem] font-bold tracking-[-0.01em]">{t("kpi.title")}</h3>
        <span className="text-[0.6875rem] text-[var(--text-faint)]">
          {t("hero.updated")} {timeAgo(data.fetchedAt, locale)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {figures.slice(0, 2).map((f) => (
          <Stat key={f.label} value={f.value} label={f.label} source={`${f.source} · ${f.asOf}`} tone="alert" />
        ))}
        <Stat
          value={String(data.stationsElevated)}
          label={t("kpi.elevated")}
          source={`of ${data.stationsMonitored} · GloFAS`}
          tone={data.stationsElevated > 0 ? "alert" : "default"}
        />
        <Stat
          value={data.wettest ? `${data.wettest.rain3d} mm` : "—"}
          label={t("kpi.rain72")}
          source={data.wettest ? `${data.wettest.district} · Open-Meteo` : undefined}
        />
        {figures.slice(2, 4).map((f) => (
          <Stat key={f.label} value={f.value} label={f.label} source={`${f.source} · ${f.asOf}`} />
        ))}
      </div>

      {data.situation?.summary && (
        <p className="mt-4 text-[0.875rem] leading-relaxed text-[var(--text)]">
          {data.situation.summary}
        </p>
      )}

      <div className="mt-4 space-y-2.5">
        {data.aiError && <Callout tone="warn">{t("kpi.aiDown")}</Callout>}
        <Callout tone="warn">{t("kpi.note")}</Callout>
      </div>
    </div>
  );
}
