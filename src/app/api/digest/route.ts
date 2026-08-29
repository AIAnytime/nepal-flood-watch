import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/news";
import { GroqBusy, chat, llmConfigured } from "@/lib/llm";
import type { Locale } from "@/lib/i18n";

export const maxDuration = 60;

const LANG: Record<Locale, string> = { en: "English", ne: "Nepali (नेपाली)", hi: "Hindi (हिन्दी)" };

export async function POST(req: Request) {
  if (!llmConfigured()) {
    return NextResponse.json({ error: "AI is not configured on this deployment" }, { status: 503 });
  }
  try {
    const { locale = "en" } = (await req.json().catch(() => ({}))) as { locale?: Locale };
    const { articles } = await fetchNews();

    const recent = articles
      .filter((a) => a.publishedAt !== null && Date.now() - a.publishedAt < 3 * 864e5)
      .slice(0, 24)
      .map(
        (a) =>
          `- [${a.source}${a.corroboration > 1 ? `, +${a.corroboration - 1} other outlets` : ", single source"}] ${a.title}`
      )
      .join("\n");

    const { content: text, model: usedModel } = await chat({
      temperature: 0.3,
      maxTokens: 800,
      messages: [
        {
          role: "system",
          content:
            "Summarise the last 24-48 hours of the Nepal flood emergency for a general public audience.\n" +
            "Rules: use only what is in the headlines; attribute any number to its outlet; when a claim " +
            "comes from a single outlet, say 'reported by X' rather than stating it as fact; write 4-6 " +
            "short plain sentences; no bullet points, no headings, no markdown, no drama.",
        },
        { role: "user", content: `Write in ${LANG[locale] ?? "English"}.\n\nHeadlines:\n${recent}` },
      ],
    });

    return NextResponse.json({
      digest: text.trim(),
      model: usedModel,
      generatedAt: Date.now(),
    });
  } catch (err) {
    if (err instanceof GroqBusy) {
      return NextResponse.json(
        {
          error: "The AI service is busy right now. Please try again in a few seconds.",
          retryAfter: err.retryAfterSeconds,
        },
        { status: 429, headers: { "retry-after": String(Math.ceil(err.retryAfterSeconds)) } }
      );
    }
    console.error("[api/digest]", err);
    return NextResponse.json({ error: "Could not generate digest" }, { status: 502 });
  }
}
