"use client";

import { useState } from "react";
import { useApp } from "./Providers";
import { Callout, Skeleton, Spinner } from "./ui";
import { dayOnly, timeAgo } from "@/lib/format";
import type { Article } from "@/lib/news";

function CorroborationBadge({ article }: { article: Article }) {
  const { t } = useApp();
  const corroborated = article.corroboration > 1;
  return (
    <span
      className={`chip ${corroborated ? "risk-normal" : "risk-moderate"}`}
      title={corroborated ? `Also in: ${article.alsoIn.join(", ")}` : undefined}
    >
      {corroborated ? (
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12.5 9 17.5 20 6.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M12 8v5M12 16.5v.01M12 3 2 20h20L12 3Z" strokeLinejoin="round" />
        </svg>
      )}
      {corroborated
        ? `${t("news.corroborated")} · ${article.corroboration} ${t("news.sources")}`
        : t("news.single")}
    </span>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const { locale } = useApp();
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="card group block p-3.5 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-sunken)]"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[0.6875rem] text-[var(--text-faint)]">
        <span className="font-semibold text-[var(--text-muted)]">{article.source}</span>
        {article.publishedAt !== null && (
          <>
            <span>·</span>
            <span title={article.exactTime ? undefined : "This outlet publishes no time, only a date"}>
              {article.exactTime
                ? timeAgo(article.publishedAt, locale)
                : dayOnly(article.publishedAt, locale)}
            </span>
          </>
        )}
      </div>
      <h4 className="text-[0.875rem] font-semibold leading-snug tracking-[-0.005em] group-hover:text-[var(--accent-text)]">
        {article.title}
      </h4>
      {article.summary && (
        <p className="mt-1.5 line-clamp-2 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
          {article.summary}
        </p>
      )}
      <div className="mt-2.5">
        <CorroborationBadge article={article} />
      </div>
    </a>
  );
}

function FactCheck() {
  const { t, locale } = useApp();
  const [claim, setClaim] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (claim.trim().length < 8) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/factcheck", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ claim, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  const verdict = result?.match(/VERDICT:\s*(.+)/i)?.[1]?.trim();
  const tone = verdict
    ? /not supported/i.test(verdict)
      ? "risk-severe"
      : /partly/i.test(verdict)
        ? "risk-moderate"
        : /cannot/i.test(verdict)
          ? "risk-unknown"
          : "risk-normal"
    : "risk-unknown";

  return (
    <div className="card p-4 sm:p-5">
      <h3 className="text-[0.9375rem] font-bold tracking-[-0.01em]">{t("news.factcheck")}</h3>
      <p className="mt-1 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
        {t("news.factcheckNote")}
      </p>
      <form onSubmit={check} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder={t("news.factcheckPlaceholder")}
          maxLength={600}
          className="field flex-1"
          aria-label={t("news.factcheck")}
        />
        <button type="submit" disabled={loading || claim.trim().length < 8} className="btn btn-primary shrink-0">
          {loading ? <Spinner /> : null}
          {t("news.factcheckBtn")}
        </button>
      </form>

      {error && (
        <div className="mt-3">
          <Callout tone="danger">{error}</Callout>
        </div>
      )}

      {result && (
        <div className="mt-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3.5">
          {verdict && <span className={`chip ${tone} mb-2`}>{verdict}</span>}
          <p className="whitespace-pre-line text-[0.8125rem] leading-relaxed">
            {result.replace(/VERDICT:\s*.+\n?/i, "").trim()}
          </p>
        </div>
      )}
    </div>
  );
}

export function News({ articles, loading }: { articles: Article[]; loading: boolean }) {
  const { t, locale } = useApp();
  const [digest, setDigest] = useState<string | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  async function loadDigest() {
    setDigestLoading(true);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (res.ok) setDigest(data.digest);
    } catch {
      /* leave the digest empty; the headlines below still stand on their own */
    } finally {
      setDigestLoading(false);
    }
  }

  const shown = showAll ? articles : articles.slice(0, 9);

  return (
    <div className="space-y-4">
      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[0.9375rem] font-bold tracking-[-0.01em]">{t("news.digest")}</h3>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
              {t("news.digestSub")}
            </p>
          </div>
          {!digest && (
            <button
              onClick={loadDigest}
              disabled={digestLoading || loading}
              className="btn btn-primary shrink-0"
            >
              {digestLoading ? <Spinner /> : null}
              {t("news.digest")}
            </button>
          )}
        </div>
        {digest && (
          <p className="mt-3 text-[0.875rem] leading-relaxed">{digest}</p>
        )}
      </div>

      <FactCheck />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[150px]" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="card p-8 text-center text-[0.8125rem] text-[var(--text-muted)]">
          {t("news.empty")}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
          {articles.length > 9 && (
            <div className="text-center">
              <button onClick={() => setShowAll((v) => !v)} className="btn btn-ghost">
                {showAll ? "Show less" : `Show all ${articles.length}`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
