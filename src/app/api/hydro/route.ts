import { NextResponse } from "next/server";
import { fetchHydrology } from "@/lib/hydro";

export const revalidate = 900;

export async function GET() {
  try {
    const data = await fetchHydrology();
    return NextResponse.json(data, {
      headers: { "cache-control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch (err) {
    console.error("[api/hydro]", err);
    return NextResponse.json({ error: "Upstream flood data unavailable" }, { status: 502 });
  }
}
