import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { insertReport, listPublicReports, recentCountFor, storageMode } from "@/lib/db";
import { GroqBusy, chat, llmConfigured, parseJson } from "@/lib/llm";
import type { ReportKind } from "@/lib/db";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const KINDS: ReportKind[] = ["need", "missing", "hazard", "offer", "info"];
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;

/** IPs are hashed, never stored raw — this board takes no account and should keep no
 *  identifying trail of the people using it. */
function hashIp(req: Request): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const salt = process.env.IP_HASH_SALT ?? "nepal-flood-watch";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

type Screening = {
  allow: boolean;
  urgency: number;
  reason: string;
  redacted_message: string;
};

/** Screens for abuse, spam and third-party personal data before anything goes public. */
async function screen(kind: string, location: string, message: string): Promise<Screening> {
  if (!llmConfigured()) {
    return {
      allow: false,
      urgency: 2,
      reason: "AI screening unavailable — held for manual review",
      redacted_message: message,
    };
  }

  // Screening is a classification task, not an analysis one, so it runs on the
  // cheaper tier — it fires on every single submission.
  const { content: raw } = await chat({
    tier: "fast",
    json: true,
    temperature: 0,
    maxTokens: 600,
    messages: [
      {
        role: "system",
        content:
          "You screen public submissions to a disaster help board for Nepal's 2026 floods. " +
          "The board is open to anyone with no login, so it must stay safe and useful.\n\n" +
          "Reject (allow=false) if the text is: abuse, hate speech or harassment; spam, advertising " +
          "or a scam; sexual content; deliberate misinformation; a political attack; or clearly a test " +
          "with no real content.\n\n" +
          "Accept (allow=true) genuine requests for help, missing-person notices, hazard sightings, " +
          "offers of help, and useful local information — even if written badly, in mixed script, or " +
          "in an emotional tone. People in a disaster do not write neatly. Be generous with real need.\n\n" +
          "For a missing-person report, naming the missing person is expected and allowed. But redact " +
          "any OTHER third party's phone number, exact home address, ID or passport number by replacing " +
          "it with [removed]. Never redact place names.\n\n" +
          "urgency: 3 = life at immediate risk (trapped, injured, no water), 2 = urgent need or a " +
          "missing person, 1 = information or an offer of help.\n\n" +
          'Return JSON: {"allow":true,"urgency":2,"reason":"short reason","redacted_message":"..."}\n\n' +
          "redacted_message must contain ONLY the body of the report itself, copied verbatim except " +
          "for any redactions. Never include the Type or Location lines, never add labels, headings " +
          "or commentary, and never rewrite or summarise the author's words.",
      },
      {
        role: "user",
        content:
          `Type: ${kind}\nLocation: ${location}\n` +
          `Message (this, and only this, is what redacted_message should contain):\n${message}`,
      },
    ],
  });

  const parsed = parseJson<Screening>(raw);
  if (!parsed || typeof parsed.allow !== "boolean") {
    return {
      allow: false,
      urgency: 2,
      reason: "Screening was inconclusive — held for review",
      redacted_message: message,
    };
  }
  // Guard against the model echoing our own prompt scaffolding back, or padding the
  // text out. If the returned body looks nothing like what was submitted, keep the
  // author's original words rather than publishing something they did not write.
  let body = String(parsed.redacted_message || "").trim();
  const echoedPrompt = /^\s*(type|location|message)\s*:/i.test(body);
  if (!body || echoedPrompt || body.length > message.length * 1.35 + 40) {
    body = message;
  }

  return {
    allow: parsed.allow,
    urgency: Math.min(3, Math.max(1, Number(parsed.urgency) || 2)),
    reason: String(parsed.reason ?? "").slice(0, 200),
    redacted_message: body.slice(0, 1200),
  };
}

export async function GET() {
  try {
    const reports = await listPublicReports(60);
    return NextResponse.json({ reports, storage: storageMode(), fetchedAt: Date.now() });
  } catch (err) {
    console.error("[api/reports GET]", err);
    return NextResponse.json({ error: "Could not load reports" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      kind?: string;
      location?: string;
      message?: string;
      contact?: string;
    };

    const kind = (KINDS as string[]).includes(body.kind ?? "") ? (body.kind as ReportKind) : "info";
    const location = (body.location ?? "").trim().slice(0, 120);
    const message = (body.message ?? "").trim().slice(0, 1200);
    const contact = (body.contact ?? "").trim().slice(0, 120) || null;

    if (message.length < 10) {
      return NextResponse.json({ error: "Please add a few more details." }, { status: 400 });
    }
    if (!location) {
      return NextResponse.json({ error: "Please add a location." }, { status: 400 });
    }

    const ipHash = hashIp(req);
    const recent = await recentCountFor(ipHash, RATE_WINDOW_MS);
    if (recent >= RATE_MAX) {
      return NextResponse.json(
        { error: "Too many reports from this device. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const verdict = await screen(kind, location, message);

    await insertReport({
      id: randomUUID(),
      kind,
      location,
      message: verdict.redacted_message,
      contact,
      urgency: verdict.urgency,
      status: verdict.allow ? "public" : "held",
      ai_note: verdict.reason || null,
      ipHash,
    });

    return NextResponse.json({ ok: true, status: verdict.allow ? "public" : "held" });
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
    console.error("[api/reports POST]", err);
    return NextResponse.json({ error: "Could not post that report" }, { status: 502 });
  }
}
