"use client";

import type { ReactNode } from "react";
import { useApp } from "./Providers";
import type { RiskLevel } from "@/lib/hydro";

export const RISK_COLORS: Record<RiskLevel, string> = {
  severe: "var(--severe)",
  high: "var(--high)",
  moderate: "var(--moderate)",
  normal: "var(--normal)",
  unknown: "var(--unknown)",
};

export function RiskChip({ level }: { level: RiskLevel }) {
  const { t } = useApp();
  return <span className={`chip risk-${level}`}>{t(`risk.${level}`)}</span>;
}

export function Section({
  id,
  title,
  subtitle,
  action,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 py-8 sm:py-11">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h2 className="section-title">{title}</h2>
          {subtitle && (
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Callout({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "danger";
  children: ReactNode;
}) {
  const styles = {
    info: { bg: "var(--accent-soft)", fg: "var(--accent-text)" },
    warn: { bg: "var(--moderate-soft)", fg: "var(--moderate)" },
    danger: { bg: "var(--severe-soft)", fg: "var(--severe)" },
  }[tone];

  return (
    <div
      className="flex gap-2.5 rounded-[10px] px-3 py-2.5 text-[0.75rem] leading-relaxed"
      style={{ background: styles.bg, color: styles.fg }}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" className="mt-px shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 8h.01M11 12h1v4h1" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useApp();
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center">
      <p className="text-[0.8125rem] text-[var(--text-muted)]">{t("common.error")}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-ghost">
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
