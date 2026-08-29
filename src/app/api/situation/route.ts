import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/news";
import { fetchHydrology } from "@/lib/hydro";
import { GroqBusy, chat, llmConfigured, parseJson } from "@/lib/llm";

/**
 * Computed per request, cached at the edge by the headers below rather than by
 * Next's static prerender.
 *
 * Two reasons this must not be prerendered. It reports a live disaster, so baking
 * an answer at build time is wrong on its face. And the provider credentials are
 * stored as Vercel "Sensitive" variables, which are injected at runtime only — a
 * build-time render has no key, silently produces the degraded body, and then
 * serves that frozen result to everyone.
 */
export const dynamic = "force-dynamic";

/**
 * This route does two upstream fetches and a model call. On a cold start that can
 * outrun the default budget, and a timeout here is what pinned a degraded response
 * at the edge after the first deploy.
 */
export const maxDuration = 60;

/**
 * Every response carries CDN cache headers. This route calls an LLM, and provider
 * quotas are finite — without a shared cache in front of it a few dozen concurrent
 * readers would exhaust the budget and the page would degrade for everyone. The
 * data underneath only moves every half hour anyway.
 *
 * Success and degradation are cached very differently on purpose. A single failed
 * model call — a cold start, a rate-limited minute, a provider blip — must not be
 * pinned at the edge for half an hour and served to every visitor, which is exactly
 * what a uniform TTL did on the first request after a deploy. A degraded response
 * therefore expires in a minute so the next reader retries and the page self-heals.
 */
/**
 * Next strips s-maxage from cache-control on a dynamic route, which would leave
 * every visitor triggering a paid model call. Vercel honours CDN-Cache-Control
 * separately and Next leaves it alone, so the edge TTL is set there and the plain
 * cache-control header is left to govern the browser only.
 */
function cacheHeaders(seconds: number, swr: number) {
  return {
    "cache-control": "public, max-age=0, must-revalidate",
    "CDN-Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${swr}`,
    "Vercel-CDN-Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${swr}`,
  };
}

const CACHE_OK = cacheHeaders(1800, 3600);
const CACHE_DEGRADED = cacheHeaders(60, 120);

/**
 * Casualty figures are never hard-coded here. They are extracted from the live
 * headlines by the model, and each one must carry the outlet that reported it —
 * a figure without an attributable source is dropped rather than shown.
 */
type Figure = { label: string; value: string; source: string; asOf: string };
type Situation = { figures: Figure[]; summary: string; confidence: string };

export async function GET() {
  try {
    const [news, hydro] = await Promise.all([fetchNews(), fetchHydrology()]);

    const elevated = hydro.stations.filter(
      (s) => s.risk === "severe" || s.risk === "high" || s.risk === "moderate"
    );
    const wettest = [...hydro.stations].sort((a, b) => (b.rain3d ?? 0) - (a.rain3d ?? 0))[0];

    const base = {
      stationsMonitored: hydro.stations.length,
      stationsElevated: elevated.length,
      wettest: wettest
        ? { name: wettest.name, district: wettest.district, rain3d: wettest.rain3d }
        : null,
      feedsOk: news.feedsOk,
      feedsTotal: news.feedsTotal,
      articleCount: news.articles.length,
      fetchedAt: Date.now(),
    };

    if (!llmConfigured()) {
      return NextResponse.json(
        { ...base, situation: null, aiAvailable: false },
        { headers: CACHE_DEGRADED }
      );
    }

    const headlines = news.articles
      .slice(0, 22)
      .map(
        (a) =>
          `- [${a.source}, ${
            a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 16) : "date unknown"
          }] ${a.title}`
      )
      .join("\n");

    // The AI layer is enrichment, not the substance. Station counts, rainfall and
    // feed health are computed above without a model, so a Groq outage or a
    // rate-limited minute must degrade this endpoint, never fail it — otherwise
    // the whole overview spins on a loading skeleton for every visitor.
    let situation: Situation | null = null;
    let aiError: string | null = null;

    try {
      const { content: raw } = await chat({
        json: true,
        temperature: 0.1,
        maxTokens: 900,
        messages: [
          {
            role: "system",
            content:
              "You extract verified facts from news headlines about the ongoing Nepal flood disaster. " +
              "Rules you must not break:\n" +
              "1. Only report a number if it appears in the headlines given to you. Never estimate, " +
              "interpolate, or recall a figure from memory.\n" +
              "2. Every figure must name the outlet that reported it.\n" +
              "3. If outlets disagree, report the most recent and say so in the summary.\n" +
              "4. If a category has no figure in the headlines, omit it entirely.\n" +
              "5. The label must carry any scope the headline attaches to the number. If a " +
              "headline says '898 missing from hydropower projects', the label is 'Missing at " +
              "hydropower sites', never 'People missing' — presenting a subset as a total is the " +
              "single worst error you can make here.\n" +
              "6. Prefer the broadest, most recent official totals for the headline figures " +
              "(overall dead, overall missing, injured) and put narrower figures after them.\n" +
              'Return JSON: {"figures":[{"label":"Confirmed dead","value":"626","source":"NBC News","asOf":"2026-08-29"}],' +
              '"summary":"2-3 sentences, plain language, no drama","confidence":"high|medium|low"}',
          },
          {
            role: "user",
            content: `Today is ${new Date().toISOString().slice(0, 10)}.\n\nHeadlines:\n${headlines}`,
          },
        ],
      });

      situation = parseJson<Situation>(raw);

      // Defensive: strip any figure the model produced without attribution.
      if (situation?.figures) {
        situation.figures = situation.figures.filter(
          (f) => f && f.value && f.source && String(f.source).trim().length > 1
        );
      }
    } catch (err) {
      console.error("[api/situation] AI enrichment failed, serving base data:", err);
      aiError =
        err instanceof GroqBusy
          ? "AI summary is rate-limited right now."
          : "AI summary is unavailable right now.";
    }

    return NextResponse.json(
      { ...base, situation, aiAvailable: situation !== null, aiError },
      { headers: situation ? CACHE_OK : CACHE_DEGRADED }
    );
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
    console.error("[api/situation]", err);
    return NextResponse.json({ error: "Could not assemble situation" }, { status: 502 });
  }
}
