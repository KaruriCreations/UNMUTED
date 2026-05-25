import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "hot";
  const limit = parseInt(searchParams.get("limit") || "30", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  let query = supabase.from("videos").select("*").range(offset, offset + limit - 1);

  if (sort === "new") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "controversial") {
    query = query.order("comment_count", { ascending: false });
  } else {
    // "hot" — combination of recency and comments
    query = query.order("comment_count", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json();
  const { tiktok_url, tiktok_id, title, author_name, author_url, thumbnail_url } = body;

  if (!tiktok_url) {
    return NextResponse.json({ error: "TikTok URL required" }, { status: 400 });
  }

  // Check if video already exists
  const { data: existing, error: existingError } = await supabase
    .from("videos")
    .select("id")
    .eq("tiktok_url", tiktok_url)
    .maybeSingle();

  if (existingError && !existingError.message.includes("No rows found")) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ id: existing.id, existing: true });
  }

  const { data, error } = await supabase
    .from("videos")
    .insert({
      tiktok_url,
      tiktok_id: tiktok_id || null,
      title: title || "TikTok Video",
      author_name: author_name || "Unknown",
      author_url: author_url || tiktok_url,
      thumbnail_url: thumbnail_url || null,
      submitted_by: user?.id || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id, existing: false });
}
