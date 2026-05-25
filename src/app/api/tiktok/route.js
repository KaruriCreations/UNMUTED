import { NextResponse } from "next/server";
import { fetchTikTokOembedWithCache } from "@/lib/api";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
    }

    // Validate TikTok URL format
    if (!/tiktok\.com/i.test(url)) {
      return NextResponse.json({ error: "Invalid TikTok URL" }, { status: 400 });
    }

    const data = await fetchTikTokOembedWithCache(url);
    if (!data) {
      return NextResponse.json({ error: "Could not fetch video info" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("TikTok API error:", error);
    return NextResponse.json({ error: "Failed to fetch TikTok data" }, { status: 500 });
  }
}
