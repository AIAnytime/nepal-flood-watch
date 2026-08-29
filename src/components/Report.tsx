"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "./Providers";
import { Callout, Spinner } from "./ui";
import { timeAgo } from "@/lib/format";
import type { Report as ReportRow, ReportKind } from "@/lib/db";

const KINDS: ReportKind[] = ["need", "missing", "hazard", "offer", "info"];

const KIND_STYLE: Record<ReportKind, string> = {
  need: "risk-severe",
  missing: "risk-high",
  hazard: "risk-moderate",
  offer: "risk-normal",
  info: "risk-unknown",
};

function ReportCard({ r }: { r: ReportRow }) {
  const { t, locale } = useApp();
  return (
    <div className="card p-3.5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`chip ${KIND_STYLE[r.kind]}`}>{t(`report.type.${r.kind}`)}</span>
        {r.urgency >= 3 && <span className="chip risk-severe">{t("report.urgent")}</span>}
        <span className="text-[0.6875rem] text-[var(--text-faint)]">
          {timeAgo(r.created_at, locale)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-[var(--text-muted)]">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
        {r.location}
      </div>
      <p className="mt-1.5 whitespace-pre-line text-[0.8125rem] leading-relaxed">{r.message}</p>
      {r.contact && (
        <div className="mt-2 text-[0.75rem] text-[var(--accent-text)] break-all">{r.contact}</div>
      )}
    </div>
  );
}

export function Report() {
  const { t } = useApp();
  const [kind, setKind] = useState<ReportKind>("need");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "public" | "held" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (res.ok) setReports(data.reports ?? []);
    } catch {
      /* the form still works without the feed */
    }
  }, []);

  useEffect(() => {
    // Fire-and-forget: every state write in loadReports happens after an await, so
    // nothing is set synchronously during this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReports();
  }, [loadReports]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, location, message, contact }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? t("report.err"));
        setState("error");
        return;
      }
      setState(data.status === "public" ? "public" : "held");
      setMessage("");
      setContact("");
      setLocation("");
      void loadReports();
    } catch {
      setErrorMsg(t("report.err"));
      setState("error");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="card p-4 sm:p-5">
        <Callout tone="danger">{t("report.notEmergency")}</Callout>

        <form onSubmit={submit} className="mt-4 space-y-3.5">
          <div>
            <span className="label">{t("report.type")}</span>
            <div className="flex flex-wrap gap-1.5">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  aria-pressed={kind === k}
                  className={`rounded-[9px] border px-2.5 py-1.5 text-[0.75rem] font-semibold transition-colors ${
                    kind === k
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                      : "border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {t(`report.type.${k}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rep-loc" className="label">
              {t("report.location")}
            </label>
            <input
              id="rep-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("report.locationPh")}
              maxLength={120}
              required
              className="field"
            />
          </div>

          <div>
            <label htmlFor="rep-msg" className="label">
              {t("report.message")}
            </label>
            <textarea
              id="rep-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("report.messagePh")}
              maxLength={1200}
              rows={4}
              required
              className="field resize-y"
            />
            <div className="mt-1 text-right text-[0.6875rem] tabular-nums text-[var(--text-faint)]">
              {message.length}/1200
            </div>
          </div>

          <div>
            <label htmlFor="rep-contact" className="label">
              {t("report.contact")}
            </label>
            <input
              id="rep-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("report.contactPh")}
              maxLength={120}
              className="field"
            />
          </div>

          <Callout tone="warn">{t("report.warn")}</Callout>

          <button
            type="submit"
            disabled={state === "sending" || message.trim().length < 10 || !location.trim()}
            className="btn btn-primary w-full"
          >
            {state === "sending" ? <Spinner /> : null}
            {state === "sending" ? t("report.sending") : t("report.submit")}
          </button>

          {state === "public" && <Callout tone="info">{t("report.ok")}</Callout>}
          {state === "held" && <Callout tone="warn">{t("report.held")}</Callout>}
          {state === "error" && <Callout tone="danger">{errorMsg ?? t("report.err")}</Callout>}
        </form>
      </div>

      <div>
        <h3 className="mb-3 text-[0.9375rem] font-bold tracking-[-0.01em]">
          {t("report.feed")}
          {reports.length > 0 && (
            <span className="ml-2 text-[0.75rem] font-normal tabular-nums text-[var(--text-faint)]">
              {reports.length}
            </span>
          )}
        </h3>
        {reports.length === 0 ? (
          <div className="card p-8 text-center text-[0.8125rem] text-[var(--text-muted)]">
            {t("report.feedEmpty")}
          </div>
        ) : (
          <div className="space-y-3 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1">
            {reports.map((r) => (
              <ReportCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
