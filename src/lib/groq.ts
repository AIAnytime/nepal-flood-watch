/**
 * Thin Groq (OpenAI-compatible) client. Two models are used:
 *  - REASONING for analysis over data we supply in the prompt.
 *  - GROUNDED  for fact-checking, where the model needs live web search of its own.
 *
 * This is a public page with no login, so upstream limits are a normal operating
 * condition rather than an exception: the free tier caps tokens-per-minute, and
 * strict JSON mode occasionally fails to validate. Both are handled here so callers
 * never have to, and so a rate-limited visitor gets a useful message instead of a
 * stack trace.
 */
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const MODELS = {
  reasoning: "openai/gpt-oss-120b",
  fast: "openai/gpt-oss-20b",
  grounded: "groq/compound",
} as const;

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class GroqNotConfigured extends Error {
  constructor() {
    super("GROQ_API_KEY is not set");
    this.name = "GroqNotConfigured";
  }
}

/** Upstream is over its per-minute budget. Callers turn this into a 429, not a 502. */
export class GroqBusy extends Error {
  constructor(public retryAfterSeconds: number) {
    super("Groq rate limit reached");
    this.name = "GroqBusy";
  }
}

export function groqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Groq reports the wait in the message body: "Please try again in 5.4825s". */
function parseRetryAfter(res: Response, body: string): number {
  const header = Number(res.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return header;
  const m = body.match(/try again in ([\d.]+)s/i);
  return m ? Number(m[1]) : 3;
}

async function call(
  body: Record<string, unknown>,
  key: string,
  signal?: AbortSignal
): Promise<{ ok: true; content: string } | { ok: false; status: number; detail: string }> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) throw new GroqBusy(parseRetryAfter(res, detail));
    return { ok: false, status: res.status, detail };
  }

  const data = await res.json();
  return { ok: true, content: data?.choices?.[0]?.message?.content ?? "" };
}

export async function chat(opts: {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  signal?: AbortSignal;
}): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new GroqNotConfigured();

  const body: Record<string, unknown> = {
    model: opts.model ?? MODELS.reasoning,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
    max_completion_tokens: opts.maxTokens ?? 1400,
  };
  if (opts.json) body.response_format = { type: "json_object" };

  // One retry on a rate limit — the wait is usually a few seconds and a visitor
  // would otherwise see a failure for something that resolves on its own.
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await call(body, key, opts.signal);
      if (result.ok) return result.content;

      // Strict JSON mode intermittently fails to validate on the larger model.
      // The response is usually well-formed anyway, so drop the constraint and
      // let parseJson do the tolerant read.
      if (result.detail.includes("json_validate_failed") && body.response_format) {
        delete body.response_format;
        const messages = body.messages as ChatMessage[];
        body.messages = [
          ...messages.slice(0, -1),
          {
            ...messages[messages.length - 1],
            content: `${messages[messages.length - 1].content}\n\nReply with a single JSON object and nothing else.`,
          },
        ];
        continue;
      }

      throw new Error(`Groq ${result.status}: ${result.detail.slice(0, 400)}`);
    } catch (err) {
      if (err instanceof GroqBusy && attempt === 0) {
        await sleep(Math.min(err.retryAfterSeconds * 1000 + 250, 8000));
        continue;
      }
      throw err;
    }
  }
}

/** Parse a JSON object out of a model reply, tolerating stray prose or code fences. */
export function parseJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}
