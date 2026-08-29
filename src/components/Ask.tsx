"use client";

import { useState } from "react";
import { useApp } from "./Providers";
import { Callout, Spinner } from "./ui";

type Turn = { question: string; answer: string | null; error?: string };

export function Ask() {
  const { t, locale } = useApp();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    t("ask.suggest1"),
    t("ask.suggest2"),
    t("ask.suggest3"),
    t("ask.suggest4"),
  ];

  async function ask(question: string) {
    const q = question.trim();
    if (q.length < 3 || loading) return;
    setInput("");
    setLoading(true);
    setTurns((prev) => [...prev, { question: q, answer: null }]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, locale }),
      });
      const data = await res.json();
      setTurns((prev) =>
        prev.map((turn, i) =>
          i === prev.length - 1
            ? res.ok
              ? { ...turn, answer: data.answer }
              : { ...turn, answer: null, error: data.error ?? "failed" }
            : turn
        )
      );
    } catch {
      setTurns((prev) =>
        prev.map((turn, i) =>
          i === prev.length - 1 ? { ...turn, answer: null, error: "Network error" } : turn
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4 sm:p-5">
      {turns.length === 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-1.5 text-[0.75rem] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {turns.length > 0 && (
        <div className="mb-4 space-y-4">
          {turns.map((turn, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-[12px] rounded-br-[4px] bg-[var(--accent-soft)] px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-[var(--accent-text)]">
                  {turn.question}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[92%] rounded-[12px] rounded-bl-[4px] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-[0.8125rem] leading-relaxed">
                  {turn.answer ? (
                    <span className="whitespace-pre-line">{turn.answer}</span>
                  ) : turn.error ? (
                    <span className="text-[var(--severe)]">{turn.error}</span>
                  ) : (
                    <span className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Spinner /> {t("ask.thinking")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("ask.ph")}
          maxLength={500}
          className="field flex-1"
          aria-label={t("ask.title")}
        />
        <button type="submit" disabled={loading || input.trim().length < 3} className="btn btn-primary shrink-0">
          {loading ? <Spinner /> : null}
          {t("ask.send")}
        </button>
      </form>

      <div className="mt-3">
        <Callout tone="warn">{t("ask.disclaimer")}</Callout>
      </div>
    </div>
  );
}
