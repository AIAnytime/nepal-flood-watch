import { GroqBusy } from "./groq";

/**
 * LLM access for the whole app.
 *
 * Two OpenAI-compatible providers, tried in order:
 *
 *  1. PRIMARY  — LLM_API_KEY against LLM_BASE_URL. Paid, so it carries the load.
 *  2. FALLBACK — Groq. Free tier, 8k tokens/minute, used when the primary is
 *                missing, erroring, or rate-limited.
 *
 * Both speak the same wire format, so the fallback is a base-URL and model swap
 * rather than a second client. A public disaster page cannot afford to go dark
 * because one vendor is having a bad afternoon.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type Provider = {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: { reasoning: string; fast: string; grounded?: string };
};

export class NoProviderConfigured extends Error {
  constructor() {
    super("No LLM provider is configured");
    this.name = "NoProviderConfigured";
  }
}

export { GroqBusy };

function primary(): Provider | null {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return null;
  return {
    name: "primary",
    baseUrl: (process.env.LLM_BASE_URL ?? "https://api.aicredits.in/v1").replace(/\/+$/, ""),
    apiKey,
    /**
     * Gemini 2.5 Flash Lite by default, chosen by measurement rather than sticker
     * price. The obvious cheap pick, gpt-5-nano, is a reasoning model: on a
     * representative extraction prompt it spent 6,655 output tokens where this
     * model spent 199, which makes it ~30x dearer in practice — and it invented a
     * figure on a prompt that forbids inventing figures. Flash Lite also handles
     * Devanagari better, which matters for the Nepali and Hindi pages.
     */
    models: {
      reasoning: process.env.LLM_MODEL ?? "google/gemini-2.5-flash-lite",
      fast:
        process.env.LLM_MODEL_FAST ??
        process.env.LLM_MODEL ??
        "google/gemini-2.5-flash-lite",
      // Fact-checking needs live web search, which an ordinary chat model cannot
      // do: a claim circulating today cannot be checked against training data.
      grounded: process.env.LLM_MODEL_GROUNDED ?? "perplexity/sonar",
    },
  };
}

function fallback(): Provider | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return {
    name: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey,
    models: {
      reasoning: "openai/gpt-oss-120b",
      fast: "openai/gpt-oss-20b",
      // Groq's agentic model runs its own web search; nothing on the primary
      // side is equivalent, so fact-checking always prefers this one.
      grounded: "groq/compound",
    },
  };
}

export function providers(): Provider[] {
  return [primary(), fallback()].filter((p): p is Provider => p !== null);
}

export function llmConfigured(): boolean {
  return providers().length > 0;
}

/** Which provider actually serves web-grounded requests, if any. */
export function groundedProvider(): Provider | null {
  return providers().find((p) => p.models.grounded) ?? null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Groq reports the wait in the body: "Please try again in 5.4825s". */
function parseRetryAfter(res: Response, body: string): number {
  const header = Number(res.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return header;
  const m = body.match(/try again in ([\d.]+)\s*s/i);
  return m ? Number(m[1]) : 3;
}

type CallOutcome =
  | { ok: true; content: string }
  | { ok: false; retryable: boolean; status: number; detail: string };

async function callOnce(
  provider: Provider,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<CallOutcome> {
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (res.ok) {
    const data = await res.json();
    return { ok: true, content: data?.choices?.[0]?.message?.content ?? "" };
  }

  const detail = await res.text().catch(() => "");
  // 429 and 5xx are worth trying elsewhere; 400/401/404 mean this provider will
  // never serve this request and moving on is the only useful response.
  const retryable = res.status === 429 || res.status >= 500;
  return { ok: false, retryable, status: res.status, detail };
}

export async function chat(opts: {
  tier?: "reasoning" | "fast";
  grounded?: boolean;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  signal?: AbortSignal;
}): Promise<{ content: string; model: string; provider: string }> {
  // A grounded request needs live web search, so it is restricted to providers
  // that actually have it — falling back to a model without search would produce
  // a confident fact-check based on stale training data, which is worse than no
  // fact-check at all.
  const chain = opts.grounded
    ? providers().filter((p) => p.models.grounded)
    : providers();

  if (!chain.length) throw new NoProviderConfigured();

  let lastBusy: GroqBusy | null = null;
  let lastError: Error | null = null;

  for (const provider of chain) {
    const model = opts.grounded
      ? (provider.models.grounded ?? provider.models.reasoning)
      : provider.models[opts.tier ?? "reasoning"];

    const body: Record<string, unknown> = {
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.2,
      max_completion_tokens: opts.maxTokens ?? 1400,
    };
    if (opts.json) body.response_format = { type: "json_object" };

    // Up to two attempts per provider: one for a short rate-limit wait, one for
    // strict JSON mode failing to validate.
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await callOnce(provider, body, opts.signal);

      if (result.ok) {
        return { content: result.content, model, provider: provider.name };
      }

      // Some models reject max_completion_tokens; retry with the legacy field
      // before writing the provider off entirely.
      if (
        result.detail.includes("max_completion_tokens") &&
        "max_completion_tokens" in body
      ) {
        body.max_tokens = body.max_completion_tokens;
        delete body.max_completion_tokens;
        continue;
      }

      // Strict JSON mode intermittently fails to validate. The reply is usually
      // well-formed anyway, so drop the constraint and let parseJson do the
      // tolerant read.
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

      if (result.status === 429) {
        const wait = parseRetryAfter(new Response(null, { status: 429 }), result.detail);
        lastBusy = new GroqBusy(wait);
        // Only wait it out if there is nowhere else to go.
        if (chain.length === 1 && attempt === 0 && wait <= 8) {
          await sleep(wait * 1000 + 250);
          continue;
        }
      }

      lastError = new Error(
        `${provider.name} ${result.status}: ${result.detail.slice(0, 300)}`
      );
      console.error(`[llm] ${provider.name} failed (${result.status}), trying next`);
      if (!result.retryable) break;
      break;
    }
  }

  // Every provider is rate-limited: surface that specifically so routes can
  // answer 429 with a retry hint instead of a generic failure.
  if (lastBusy) throw lastBusy;
  throw lastError ?? new Error("All LLM providers failed");
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
