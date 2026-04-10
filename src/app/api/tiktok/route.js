import { NextResponse } from "next/server";
import { fetchTikTokOembed } from "@/lib/tiktok";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  const data = await fetchTikTokOembed(url);
  if (!data) {
    return NextResponse.json({ error: "Could not fetch video info" }, { status: 404 });
  }

  return NextResponse.json(data);
}
