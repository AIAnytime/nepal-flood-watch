import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/news";

export const revalidate = 900;

export async function GET() {
  try {
    const data = await fetchNews();
    return NextResponse.json(data, {
      headers: { "cache-control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch (err) {
    console.error("[api/news]", err);
    return NextResponse.json({ error: "News feeds unavailable" }, { status: 502 });
  }
}
