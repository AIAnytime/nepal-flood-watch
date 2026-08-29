import { XMLParser } from "fast-xml-parser";

/**
 * Aggregates free RSS feeds — Nepali outlets first, then international and
 * humanitarian sources — and marks each story by how many *independent* outlets
 * carry the same substance. Corroboration is what separates a reported figure
 * from a rumour, so it is surfaced on every card rather than buried.
 */

export type Article = {
  id: string;
  title: string;
  link: string;
  source: string;
  sourceType: "nepali" | "international" | "humanitarian";
  /** Null when the feed publishes no date and none can be read from the URL. */
  publishedAt: number | null;
  /** False when the time came from the URL path, so it is day-accurate only. */
  exactTime: boolean;
  summary: string;
  /** How many distinct outlets carry a story with strongly overlapping wording. */
  corroboration: number;
  alsoIn: string[];
};

type Feed = {
  name: string;
  url: string;
  type: Article["sourceType"];
  /** Feed is site-wide, so filter to flood-related items. */
  filter?: boolean;
};

const FEEDS: Feed[] = [
  { name: "Kathmandu Post", url: "https://kathmandupost.com/rss", type: "nepali", filter: true },
  { name: "OnlineKhabar English", url: "https://english.onlinekhabar.com/feed", type: "nepali", filter: true },
  { name: "Nepal News", url: "https://nepalnews.com/feed/", type: "nepali", filter: true },
  { name: "Khabarhub", url: "https://english.khabarhub.com/feed/", type: "nepali", filter: true },
  { name: "Setopati", url: "https://www.setopati.com/feed", type: "nepali", filter: true },
  { name: "Rising Nepal", url: "https://risingnepaldaily.com/rss", type: "nepali", filter: true },
  { name: "ReliefWeb", url: "https://reliefweb.int/updates/rss.xml?advanced-search=%28C170%29", type: "humanitarian" },
  { name: "Google News", url: "https://news.google.com/rss/search?q=Nepal+flood+OR+Bhotekoshi+OR+Rasuwa&hl=en-US&gl=US&ceid=US:en", type: "international" },
  { name: "Google News (Nepali)", url: "https://news.google.com/rss/search?q=%E0%A4%A8%E0%A5%87%E0%A4%AA%E0%A4%BE%E0%A4%B2+%E0%A4%AC%E0%A4%BE%E0%A4%A2%E0%A5%80&hl=ne&gl=NP&ceid=NP:ne", type: "nepali" },
];

const KEYWORDS = [
  "flood", "बाढी", "बाढ़", "landslide", "पहिरो", "bhotekoshi", "भोटेकोशी",
  "rasuwa", "रसुवा", "nuwakot", "नुवाकोट", "trishuli", "त्रिशूली", "inundat",
  "rescue", "उद्धार", "missing", "बेपत्ता", "disaster", "विपद", "glacier", "deluge",
];

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

/**
 * Some outlets (notably the Kathmandu Post) ship an RSS feed with no <pubDate> at
 * all. Their article URLs carry /YYYY/MM/DD/, which is day-accurate and far better
 * than stamping everything with the fetch time — which would make every story look
 * like breaking news.
 */
function dateFromUrl(url: string): number | null {
  const m = url.match(/\/(20\d{2})\/(\d{2})\/(\d{2})\//);
  if (!m) return null;
  const ts = Date.parse(`${m[1]}-${m[2]}-${m[3]}T12:00:00+05:45`);
  return Number.isFinite(ts) ? ts : null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "\u2019", lsquo: "\u2018", ldquo: "\u201c", rdquo: "\u201d",
  mdash: "\u2014", ndash: "\u2013", hellip: "\u2026", eacute: "\u00e9",
};

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return KEYWORDS.some((k) => lower.includes(k));
}

/** Content words used for the overlap test, minus words common to every flood story. */
const STOP = new Set([
  "the", "and", "for", "with", "from", "that", "this", "have", "has", "are", "was", "were",
  "after", "over", "into", "than", "more", "amid", "says", "said", "nepal", "flood", "floods",
  "flooding", "news", "report", "reports",
]);

function tokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w))
  );
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size);
}

async function fetchFeed(feed: Feed, signal?: AbortSignal): Promise<Article[]> {
  try {
    const res = await fetch(feed.url, {
      signal,
      headers: { "user-agent": "Mozilla/5.0 (compatible; NepalFloodWatch/1.0)" },
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const doc = parser.parse(xml);
    const raw = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
    const items = Array.isArray(raw) ? raw : [raw];

    return items
      .map((item: Record<string, unknown>): Article | null => {
        const title = stripHtml(String(item.title ?? ""));
        if (!title) return null;

        const linkRaw = item.link;
        const link =
          typeof linkRaw === "string"
            ? linkRaw
            : String((linkRaw as Record<string, string> | undefined)?.["@_href"] ?? "");
        if (!link) return null;

        const summary = stripHtml(
          String(item.description ?? item.summary ?? item["content:encoded"] ?? "")
        ).slice(0, 320);

        const dateStr = String(item.pubDate ?? item.published ?? item.updated ?? "").trim();
        const parsed = dateStr ? new Date(dateStr).getTime() : NaN;
        const exactTime = Number.isFinite(parsed);
        const publishedAt = exactTime ? parsed : dateFromUrl(link);

        if (feed.filter && !isRelevant(`${title} ${summary}`)) return null;

        return {
          id: link,
          title,
          link,
          source: feed.name,
          sourceType: feed.type,
          publishedAt,
          exactTime,
          summary,
          corroboration: 1,
          alsoIn: [],
        };
      })
      .filter((a): a is Article => a !== null);
  } catch (err) {
    console.error(`[news] ${feed.name} failed:`, err);
    return [];
  }
}

export async function fetchNews(signal?: AbortSignal): Promise<{
  articles: Article[];
  feedsOk: number;
  feedsTotal: number;
  fetchedAt: number;
}> {
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f, signal)));
  const feedsOk = results.filter((r) => r.length > 0).length;

  const all = results.flat().sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));

  // Drop exact duplicates by URL, then score cross-outlet corroboration.
  const seen = new Set<string>();
  const unique = all.filter((a) => {
    const key = a.link.split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const tokenised = unique.map((a) => ({ article: a, t: tokens(a.title) }));
  for (const entry of tokenised) {
    const outlets = new Set<string>([entry.article.source]);
    for (const other of tokenised) {
      if (other.article.id === entry.article.id) continue;
      if (other.article.source === entry.article.source) continue;
      if (similarity(entry.t, other.t) >= 0.5) outlets.add(other.article.source);
    }
    entry.article.corroboration = outlets.size;
    entry.article.alsoIn = [...outlets].filter((s) => s !== entry.article.source);
  }

  // Round-robin across outlets so the visible list shows the full picture instead
  // of whichever newsroom happens to timestamp most aggressively.
  const bySource = new Map<string, Article[]>();
  for (const a of unique) {
    const bucket = bySource.get(a.source);
    if (bucket) bucket.push(a);
    else bySource.set(a.source, [a]);
  }
  const diversified: Article[] = [];
  for (let round = 0; diversified.length < unique.length; round++) {
    let added = false;
    for (const bucket of bySource.values()) {
      if (bucket[round]) {
        diversified.push(bucket[round]);
        added = true;
      }
    }
    if (!added) break;
  }

  return {
    articles: diversified.slice(0, 60),
    feedsOk,
    feedsTotal: FEEDS.length,
    fetchedAt: Date.now(),
  };
}
