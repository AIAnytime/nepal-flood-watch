"use client";

import { useApp, pick } from "./Providers";
import { RISK_COLORS } from "./ui";
import { WORST_HIT_KM } from "@/data/floodpath";
import type { StationReading } from "@/lib/hydro";
import { Skeleton } from "./ui";

/**
 * A schematic of the river, top to bottom, mountain to plain.
 *
 * The map answers "where"; this answers "what happened, in what order, and how
 * fast". It deliberately uses no map conventions — no projection, no zoom, no
 * colour-coded multipliers — because the people who most need this page are not
 * the people who read maps comfortably.
 */

type Step = {
  km: number | null;
  title: string;
  body: string;
  kind: "origin" | "lakes" | "place";
  station?: StationReading;
};

export function FloodStory({
  stations,
  loading,
}: {
  stations: StationReading[];
  loading: boolean;
}) {
  const { t, locale } = useApp();

  if (loading) {
    return (
      <div className="card p-5">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const corridor = stations
    .filter((s) => s.downstreamKm !== null)
    .sort((a, b) => (a.downstreamKm ?? 0) - (b.downstreamKm ?? 0));

  if (!corridor.length) return null;

  const steps: Step[] = [
    { km: 0, kind: "origin", title: t("story.originTitle"), body: t("story.originBody") },
    { km: 8, kind: "lakes", title: t("story.lakesTitle"), body: t("story.lakesBody") },
    ...corridor.map(
      (s): Step => ({
        km: s.downstreamKm,
        kind: "place",
        title: pick(s, "name", locale),
        body: `${s.river} · ${s.district}`,
        station: s,
      })
    ),
  ];

  return (
    <div className="card overflow-hidden">
      <ol className="p-4 sm:p-5">
        {steps.map((step, i) => {
          const color =
            step.kind === "place" && step.station
              ? RISK_COLORS[step.station.risk]
              : "var(--severe)";
          const withinWorst = (step.km ?? 0) <= WORST_HIT_KM;
          const isLast = i === steps.length - 1;

          return (
            <li key={`${step.kind}-${i}`} className="flex gap-3">
              {/* Distance gutter, right-aligned so the numbers line up as a scale */}
              <div className="w-11 shrink-0 pt-[3px] text-right sm:w-14">
                {step.km !== null && (
                  <span className="whitespace-nowrap text-[0.6875rem] font-bold tabular-nums text-[var(--text-faint)]">
                    {step.km} km
                  </span>
                )}
              </div>

              {/* The river itself: one segment per reach, coloured by that reach's
                  status, drawn behind the node so the line runs through it. */}
              <div className="relative flex w-[22px] shrink-0 justify-center">
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute top-[7px] bottom-0 w-[3px] rounded"
                    style={{ background: color }}
                  />
                )}
                <span
                  className="relative z-10 mt-[1px] flex h-[18px] w-[18px] items-center justify-center rounded-full border-[3px] border-[var(--bg-elev)]"
                  style={{ background: color }}
                >
                  {step.kind === "origin" && (
                    <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 7v6M12 16.5v.01" />
                    </svg>
                  )}
                  {step.kind === "lakes" && (
                    <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M4 9h16M4 15h16" />
                    </svg>
                  )}
                </span>
              </div>

              {/* Content */}
              <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[0.875rem] font-semibold leading-snug">{step.title}</span>
                  {step.station && (
                    <span
                      className={`chip risk-${step.station.risk}`}
                      title={
                        step.station.anomaly
                          ? `${step.station.anomaly.toFixed(2)}\u00d7 its own recent normal`
                          : undefined
                      }
                    >
                      {t(`plain.${step.station.risk}`)}
                    </span>
                  )}
                  {step.kind === "place" && withinWorst && (
                    <span className="chip risk-severe">{t("story.worstHit")}</span>
                  )}
                </div>
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
                  {step.body}
                </p>
                {step.station && (
                  <p className="mt-1 text-[0.75rem] leading-relaxed text-[var(--text-faint)]">
                    {t("plain.rainNext")}: {step.station.rain3d} mm
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="hairline px-4 py-2.5 text-[0.6875rem] leading-relaxed text-[var(--text-faint)] sm:px-5">
        {t("story.footnote")}
      </div>
    </div>
  );
}
