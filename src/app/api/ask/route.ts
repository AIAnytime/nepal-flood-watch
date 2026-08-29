import { NextResponse } from "next/server";
import { fetchHydrology } from "@/lib/hydro";
import { fetchNews } from "@/lib/news";
import { GroqBusy, chat, llmConfigured } from "@/lib/llm";
import { HELPLINES } from "@/lib/helplines";
import type { Locale } from "@/lib/i18n";

export const maxDuration = 60;

const LANG: Record<Locale, string> = { en: "English", ne: "Nepali (नेपाली)", hi: "Hindi (हिन्दी)" };

/**
 * Public Q&A. The model is given the same live data the page displays and is told
 * to answer from it alone — during a disaster a confident wrong answer is worse
 * than "I don't know".
 */
export async function POST(req: Request) {
  if (!llmConfigured()) {
    return NextResponse.json({ error: "AI is not configured on this deployment" }, { status: 503 });
  }
  try {
    const { question, locale = "en" } = (await req.json()) as {
      question?: string;
      locale?: Locale;
    };
    const q = (question ?? "").trim();
    if (q.length < 3) return NextResponse.json({ error: "Question is too short" }, { status: 400 });
    if (q.length > 500) return NextResponse.json({ error: "Question is too long" }, { status: 400 });

    const [hydro, news] = await Promise.all([fetchHydrology(), fetchNews()]);

    // Only the corridor plus anything currently abnormal — sending all twelve points
    // on every question burns the per-minute token budget for little benefit.
    const relevant = hydro.stations.filter((s) => s.focus || s.risk !== "normal");
    const rivers = relevant
      .map(
        (s) =>
          `${s.name} (${s.river}, ${s.district}): signal ${s.risk}, ` +
          `forecast peak is ${s.anomaly ? `${s.anomaly.toFixed(2)}x` : "n/a"} its own recent normal, ` +
          `rain next 3 days ${s.rain3d}mm` +
          (s.coarseCell
            ? " [COARSE CELL: the model grid puts this point on a small tributary, so its absolute flow figures are not the river's flow — do not quote them]"
            : `, flow now ${s.current?.toFixed(0) ?? "n/a"} m3/s, 7-day peak ${s.peak7d?.toFixed(0) ?? "n/a"} m3/s`)
      )
      .join("\n");

    const headlines = news.articles
      .slice(0, 14)
      .map((a) => `- [${a.source}] ${a.title}`)
      .join("\n");

    const numbers = HELPLINES.map((h) => `${h.number} = ${h.label} (${h.note})`).join("; ");

    const { content: answer, model: usedModel } = await chat({
      temperature: 0.25,
      maxTokens: 900,
      messages: [
        {
          role: "system",
          content:
            "You answer public questions about Nepal's flood situation, using ONLY the live data below.\n\n" +
            "Rules:\n" +
            "- If the data does not answer the question, say plainly that you do not have that " +
            "information and point to an official source. Never fill the gap with a guess.\n" +
            "- Attribute any casualty or damage figure to the outlet that reported it, and call it " +
            "provisional.\n" +
            "- River 'signal' is a relative flow anomaly computed from model data, not an official " +
            "government danger level. Do not present it as one.\n" +
            "- Never quote an absolute discharge for a point marked COARSE CELL, and never describe a " +
            "point as 'running high' on the strength of a tiny absolute number. Speak in terms of how " +
            "far above or below its own normal a river is.\n" +
            "- Landslide-dammed lakes on the Bhotekoshi are an active hazard that river models cannot " +
            "see. If a question touches on travel or safety in Rasuwa/Nuwakot, say this.\n" +
            "- For anything life-threatening, tell the person to call 1149 or 100 first.\n" +
            "- Answer in 2-5 short sentences. Plain text, no markdown.",
        },
        {
          role: "user",
          content:
            `Answer in ${LANG[locale] ?? "English"}. Today is ${new Date().toISOString().slice(0, 10)}.\n\n` +
            `RIVER AND RAIN DATA:\n${rivers}\n\nRECENT HEADLINES:\n${headlines}\n\n` +
            `EMERGENCY NUMBERS: ${numbers}\n\nQUESTION: ${q}`,
        },
      ],
    });

    return NextResponse.json({
      answer: answer.trim(),
      model: usedModel,
      answeredAt: Date.now(),
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
    console.error("[api/ask]", err);
    return NextResponse.json({ error: "Could not answer that" }, { status: 502 });
  }
}
