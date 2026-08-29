"use client";

import { useState } from "react";
import { useApp, pick } from "./Providers";
import { RiskChip, RISK_COLORS, Skeleton } from "./ui";
import { Sparkline } from "./Sparkline";
import { flow } from "@/lib/format";
import type { StationReading } from "@/lib/hydro";

function StationRow({ s }: { s: StationReading }) {
  const { locale, t } = useApp();
  const anomaly = s.anomaly;
  const rising = anomaly !== null && anomaly > 1.05;

  return (
    <tr className="border-t border-[var(--border)] transition-colors hover:bg-[var(--bg-sunken)]">
      <td className="py-3 pr-3 align-middle">
        <div className="font-semibold text-[0.8125rem] leading-tight">{pick(s, "name", locale)}</div>
        <div className="text-[0.6875rem] text-[var(--text-faint)] leading-tight mt-0.5">
          {s.river} · {s.district}
        </div>
      </td>
      <td className="py-3 px-3 text-right tabular-nums text-[0.8125rem] font-medium whitespace-nowrap">
        <span className={s.coarseCell ? "text-[var(--text-faint)]" : undefined}>{flow(s.current)}</span>
        {s.coarseCell && (
          <sup
            className="ml-0.5 cursor-help text-[var(--text-faint)]"
            title={t("rivers.coarseTip")}
          >
            †
          </sup>
        )}
      </td>
      <td className="py-3 px-3 text-right tabular-nums text-[0.8125rem] font-medium whitespace-nowrap">
        <span className={s.coarseCell ? "text-[var(--text-faint)]" : undefined}>{flow(s.peak7d)}</span>
      </td>
      <td className="py-3 px-3 text-right whitespace-nowrap">
        <span
          className="tabular-nums text-[0.8125rem] font-semibold"
          style={{ color: rising ? RISK_COLORS[s.risk] : "var(--text-muted)" }}
        >
          {anomaly ? `${anomaly.toFixed(2)}×` : "—"}
        </span>
      </td>
      <td className="py-3 px-3 text-right tabular-nums text-[0.8125rem] whitespace-nowrap text-[var(--text-muted)]">
        {s.rain3d} mm
      </td>
      <td className="py-3 px-3 hidden md:table-cell">
        <Sparkline series={s.series} color={RISK_COLORS[s.risk]} />
      </td>
      <td className="py-3 pl-3 text-right whitespace-nowrap">
        <RiskChip level={s.risk} />
      </td>
    </tr>
  );
}

function Table({ stations }: { stations: StationReading[] }) {
  const { t } = useApp();
  return (
    <div className="scroll-x">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="text-[0.6875rem] uppercase tracking-wider text-[var(--text-faint)]">
            <th className="pb-2 pr-3 font-semibold">{t("rivers.station")}</th>
            <th className="pb-2 px-3 font-semibold text-right whitespace-nowrap">{t("rivers.now")}</th>
            <th className="pb-2 px-3 font-semibold text-right whitespace-nowrap">{t("rivers.peak")}</th>
            <th className="pb-2 px-3 font-semibold text-right whitespace-nowrap">{t("rivers.vs")}</th>
            <th className="pb-2 px-3 font-semibold text-right whitespace-nowrap">{t("rivers.rain")}</th>
            <th className="pb-2 px-3 font-semibold hidden md:table-cell whitespace-nowrap">
              {t("rivers.trend")}
            </th>
            <th className="pb-2 pl-3 font-semibold text-right">{t("rivers.status")}</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((s) => (
            <StationRow key={s.id} s={s} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Rivers({
  stations,
  loading,
}: {
  stations: StationReading[];
  loading: boolean;
}) {
  const { t } = useApp();
  const [tab, setTab] = useState<"focus" | "other">("focus");

  if (loading) {
    return (
      <div className="card p-5">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const focus = stations.filter((s) => s.focus);
  const other = stations.filter((s) => !s.focus);
  const shown = tab === "focus" ? focus : other;

  return (
    <div className="card overflow-hidden">
      <div className="flex gap-1 border-b border-[var(--border)] px-3 pt-3">
        {(
          [
            ["focus", t("rivers.focus"), focus.length],
            ["other", t("rivers.other"), other.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`rounded-t-[8px] px-3 py-2 text-[0.8125rem] font-semibold border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-[var(--accent)] text-[var(--accent-text)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {label}
            <span className="ml-1.5 text-[var(--text-faint)] font-normal tabular-nums">{count}</span>
          </button>
        ))}
      </div>
      <div className="p-3 sm:p-4">
        <Table stations={shown} />
      </div>
      <div className="hairline px-4 py-2.5 text-[0.6875rem] text-[var(--text-faint)] leading-relaxed">
        Flow in m³/s from the Copernicus GloFAS model via Open-Meteo. &ldquo;{t("rivers.vs")}&rdquo; is
        the forecast 7-day peak divided by that point&rsquo;s own median flow over the past 45 days.
        It is a relative signal, not an official danger level — those are published by Nepal&rsquo;s DHM.
        {stations.some((s) => s.coarseCell) && (
          <>
            {" "}
            <strong className="font-semibold">†</strong> {t("rivers.coarseTip")}
          </>
        )}
      </div>
    </div>
  );
}
