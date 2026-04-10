import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { comment_id, vote_type } = body;

  if (!comment_id || !["up", "down"].includes(vote_type)) {
    return NextResponse.json({ error: "comment_id and vote_type (up/down) required" }, { status: 400 });
  }

  // Check if user already voted
  const { data: existing } = await supabase
    .from("votes")
    .select("*")
    .match({ comment_id, user_id: user.id })
    .single();

  if (existing) {
    if (existing.vote_type === vote_type) {
      // Toggle off
      await supabase.from("votes").delete().match({ comment_id, user_id: user.id });
      return NextResponse.json({ action: "removed" });
    } else {
      // Switch vote
      await supabase.from("votes").update({ vote_type }).match({ comment_id, user_id: user.id });
      return NextResponse.json({ action: "switched", vote_type });
    }
  }

  // Insert new vote
  const { error } = await supabase.from("votes").insert({
    comment_id,
    user_id: user.id,
    vote_type,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ action: "created", vote_type });
}
