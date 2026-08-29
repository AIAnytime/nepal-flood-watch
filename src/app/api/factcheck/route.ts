import { NextResponse } from "next/server";
import { GroqBusy, chat, llmConfigured } from "@/lib/llm";
import type { Locale } from "@/lib/i18n";

export const maxDuration = 60;

const LANG: Record<Locale, string> = { en: "English", ne: "Nepali (नेपाली)", hi: "Hindi (हिन्दी)" };

/**
 * Uses groq/compound, which runs its own live web search. That matters here: a claim
 * circulating on social media today cannot be checked against a static training set.
 */
export async function POST(req: Request) {
  if (!llmConfigured()) {
    return NextResponse.json({ error: "AI is not configured on this deployment" }, { status: 503 });
  }
  try {
    const { claim, locale = "en" } = (await req.json()) as { claim?: string; locale?: Locale };
    const text = (claim ?? "").trim();

    if (text.length < 8) {
      return NextResponse.json({ error: "Claim is too short to check" }, { status: 400 });
    }
    if (text.length > 600) {
      return NextResponse.json({ error: "Claim is too long — trim it to the core assertion" }, { status: 400 });
    }

    const { content: answer, model: usedModel } = await chat({
      grounded: true,
      temperature: 0.15,
      maxTokens: 1000,
      messages: [
        {
          role: "system",
          content:
            "You fact-check claims about the ongoing Nepal flood disaster (glacier collapse and flash " +
            "flood on the Bhotekoshi-Trishuli, 26 August 2026). Search the live web before answering.\n\n" +
            "Answer in exactly this shape, as plain text with no markdown:\n" +
            "VERDICT: one of Supported / Partly supported / Not supported / Cannot verify\n" +
            "WHY: two to four short sentences explaining what reporting you found.\n" +
            "SOURCES: the outlets you relied on, comma separated.\n\n" +
            "Sourcing rules: rely on established news organisations, scientific bodies and official " +
            "agencies. Social platforms — Reddit, Facebook, X, TikTok, YouTube comments, forums, blogs " +
            "— are never corroboration and must never be listed under SOURCES. If reputable sourcing " +
            "does not exist, the verdict is 'Cannot verify'.\n\n" +
            "Be honest about uncertainty. During a live disaster many figures are provisional and " +
            "disputed — say 'Cannot verify' rather than guessing. Never invent a source.",
        },
        { role: "user", content: `Answer in ${LANG[locale] ?? "English"}.\n\nClaim to check: "${text}"` },
      ],
    });

    /**
     * Search models answer in markdown with bracketed citation markers — Sonar
     * returns things like `**VERDICT: Not supported**` and `...event.[1][4][6]`.
     * The UI parses the verdict line and renders plain text, so both are stripped
     * here rather than leaking asterisks and stray numbers into the result card.
     */
    const result = answer
      .replace(/\*\*/g, "")
      .replace(/(?:\[\d+\])+/g, "")
      .replace(/[ \t]+([.,;:])/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return NextResponse.json({
      result,
      model: usedModel,
      grounded: true,
      checkedAt: Date.now(),
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
    console.error("[api/factcheck]", err);
    return NextResponse.json({ error: "Could not check that claim" }, { status: 502 });
  }
}
