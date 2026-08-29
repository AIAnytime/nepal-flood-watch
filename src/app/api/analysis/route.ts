import { NextResponse } from "next/server";
import { fetchHydrology } from "@/lib/hydro";
import { GroqBusy, chat, llmConfigured, parseJson } from "@/lib/llm";
import type { Locale } from "@/lib/i18n";

export const maxDuration = 60;

type Outlook = {
  headline: string;
  bands: { level: string; places: string[]; why: string }[];
  advice: string[];
  caveat: string;
};

const LANG: Record<Locale, string> = {
  en: "English",
  ne: "Nepali (नेपाली)",
  hi: "Hindi (हिन्दी)",
};

export async function POST(req: Request) {
  if (!llmConfigured()) {
    return NextResponse.json({ error: "AI is not configured on this deployment" }, { status: 503 });
  }

  try {
    const { locale = "en" } = (await req.json().catch(() => ({}))) as { locale?: Locale };
    const { stations } = await fetchHydrology();

    const table = stations
      .map((s) => {
        const now = s.current?.toFixed(0) ?? "n/a";
        const peak = s.peak7d?.toFixed(0) ?? "n/a";
        const base = s.baseline?.toFixed(0) ?? "n/a";
        const anom = s.anomaly ? `${s.anomaly.toFixed(2)}x` : "n/a";
        return `${s.name} (${s.river}, ${s.district}): now ${now} m3/s, 7-day peak ${peak}, recent normal ${base}, anomaly ${anom}, rain next 3d ${s.rain3d}mm, rain past 3d ${s.rain72hPast}mm`;
      })
      .join("\n");

    const { content: raw, model: usedModel } = await chat({
      json: true,
      temperature: 0.25,
      maxTokens: 1600,
      messages: [
        {
          role: "system",
          content:
            "You are a hydrology analyst writing a short public risk outlook for Nepal. You are given " +
            "modelled river discharge (Copernicus GloFAS) and rainfall forecasts.\n\n" +
            "Hard rules:\n" +
            "- Reason ONLY from the numbers provided. Do not invent gauge readings or casualty figures.\n" +
            "- 'anomaly' is the forecast 7-day peak divided by that point's own recent median flow. " +
            "It is a relative signal, not an official danger level. Say so.\n" +
            "- The Bhotekoshi/Trishuli corridor (Rasuwa, Nuwakot) was hit by a debris avalanche and " +
            "flash flood on 26 Aug 2026; two landslide-dammed lakes there remain an unmodelled hazard " +
            "that river-discharge models cannot see. Flag that limitation explicitly.\n" +
            "- Write for ordinary people, not engineers. Short sentences. No alarmism, no reassurance " +
            "that the data does not support.\n" +
            'Return JSON: {"headline":"one sentence","bands":[{"level":"Severe|High|Watch|Normal",' +
            '"places":["name"],"why":"one short sentence citing the numbers"}],' +
            '"advice":["3-5 concrete actions"],"caveat":"one sentence on what this cannot tell you"}',
        },
        {
          role: "user",
          content:
            `Today is ${new Date().toISOString().slice(0, 10)}. Write the outlook in ${LANG[locale] ?? "English"}. ` +
            `All JSON string values must be in that language.\n\nMonitoring points:\n${table}`,
        },
      ],
    });

    const outlook = parseJson<Outlook>(raw);
    if (!outlook) {
      return NextResponse.json({ error: "Model returned an unreadable outlook" }, { status: 502 });
    }

    return NextResponse.json({
      outlook,
      model: usedModel,
      basedOn: stations.length,
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
    console.error("[api/analysis]", err);
    return NextResponse.json({ error: "Could not generate outlook" }, { status: 502 });
  }
}
