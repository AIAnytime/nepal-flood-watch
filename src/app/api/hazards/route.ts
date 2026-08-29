import { NextResponse } from "next/server";
import { fetchHazards } from "@/lib/hazards";

export const revalidate = 1800;

export async function GET() {
  try {
    const data = await fetchHazards();
    return NextResponse.json(data, {
      headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("[api/hazards]", err);
    return NextResponse.json({ error: "Hazard feeds unavailable" }, { status: 502 });
  }
}
