import { createClient, type Client } from "@libsql/client";

/**
 * Public reports storage.
 *
 * Turso when TURSO_DATABASE_URL is set (the deployed configuration). Falls back to a
 * local libSQL file for development, and finally to an in-memory array so the app is
 * never broken by a missing database — the UI just says reports are not persisted.
 */

export type ReportStatus = "public" | "held";
export type ReportKind = "need" | "missing" | "hazard" | "offer" | "info";

export type Report = {
  id: string;
  kind: ReportKind;
  location: string;
  message: string;
  contact: string | null;
  urgency: number;
  status: ReportStatus;
  ai_note: string | null;
  created_at: number;
};

let client: Client | null = null;
let initialised: Promise<void> | null = null;
const memory: Report[] = [];

export function storageMode(): "turso" | "file" | "memory" {
  if (process.env.TURSO_DATABASE_URL) return "turso";
  if (process.env.VERCEL) return "memory";
  return "file";
}

function getClient(): Client | null {
  const mode = storageMode();
  if (mode === "memory") return null;
  if (client) return client;
  client =
    mode === "turso"
      ? createClient({
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN,
        })
      : createClient({ url: "file:.data/reports.db" });
  return client;
}

async function init(): Promise<void> {
  const c = getClient();
  if (!c) return;
  await c.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      location TEXT NOT NULL,
      message TEXT NOT NULL,
      contact TEXT,
      urgency INTEGER NOT NULL DEFAULT 2,
      status TEXT NOT NULL DEFAULT 'held',
      ai_note TEXT,
      ip_hash TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await c.execute(
    `CREATE INDEX IF NOT EXISTS idx_reports_public ON reports (status, created_at DESC)`
  );
}

async function ready() {
  if (!initialised) initialised = init().catch((e) => {
    console.error("[db] init failed, falling back to memory:", e);
    client = null;
    initialised = null;
    throw e;
  });
  try {
    await initialised;
  } catch {
    /* memory fallback */
  }
}

export async function insertReport(
  r: Omit<Report, "created_at"> & { ipHash: string }
): Promise<void> {
  const created_at = Date.now();
  await ready();
  const c = getClient();
  if (!c) {
    memory.unshift({ ...r, created_at });
    if (memory.length > 500) memory.length = 500;
    return;
  }
  await c.execute({
    sql: `INSERT INTO reports (id, kind, location, message, contact, urgency, status, ai_note, ip_hash, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [r.id, r.kind, r.location, r.message, r.contact, r.urgency, r.status, r.ai_note, r.ipHash, created_at],
  });
}

export async function listPublicReports(limit = 60): Promise<Report[]> {
  await ready();
  const c = getClient();
  if (!c) return memory.filter((m) => m.status === "public").slice(0, limit);
  const rs = await c.execute({
    sql: `SELECT id, kind, location, message, contact, urgency, status, ai_note, created_at
          FROM reports WHERE status = 'public' ORDER BY created_at DESC LIMIT ?`,
    args: [limit],
  });
  return rs.rows as unknown as Report[];
}

/** Simple per-IP flood control: how many reports from this hash in the last window. */
export async function recentCountFor(ipHash: string, windowMs: number): Promise<number> {
  await ready();
  const since = Date.now() - windowMs;
  const c = getClient();
  if (!c) return memory.filter((m) => m.created_at >= since).length;
  const rs = await c.execute({
    sql: `SELECT COUNT(*) AS n FROM reports WHERE ip_hash = ? AND created_at >= ?`,
    args: [ipHash, since],
  });
  return Number((rs.rows[0] as unknown as { n: number }).n ?? 0);
}
