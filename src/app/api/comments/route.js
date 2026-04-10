import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("video_id");
  const sort = searchParams.get("sort") || "latest";

  if (!videoId) {
    return NextResponse.json({ error: "video_id required" }, { status: 400 });
  }

  let query = supabase
    .from("comments")
    .select("*, profiles(username, avatar_url, display_name)")
    .eq("video_id", videoId);

  if (sort === "top") {
    query = query.order("upvotes", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get current user's votes for these comments
  const { data: { user } } = await supabase.auth.getUser();
  let userVotes = {};
  if (user && data?.length > 0) {
    const commentIds = data.map((c) => c.id);
    const { data: votes } = await supabase
      .from("votes")
      .select("comment_id, vote_type")
      .eq("user_id", user.id)
      .in("comment_id", commentIds);
    if (votes) {
      votes.forEach((v) => { userVotes[v.comment_id] = v.vote_type; });
    }
  }

  // Build threaded structure
  const threaded = buildThread(data || [], userVotes);
  return NextResponse.json(threaded);
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { video_id, content, parent_id } = body;

  if (!video_id || !content?.trim()) {
    return NextResponse.json({ error: "video_id and content required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      video_id,
      user_id: user.id,
      parent_id: parent_id || null,
      content: content.trim(),
    })
    .select("*, profiles(username, avatar_url, display_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("id");

  if (!commentId) {
    return NextResponse.json({ error: "comment id required" }, { status: 400 });
  }

  // Delete the comment. RLS ensures users can only delete their own comments.
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

function buildThread(comments, userVotes) {
  const map = {};
  const roots = [];

  comments.forEach((c) => {
    c.user_vote = userVotes[c.id] || null;
    c.replies = [];
    map[c.id] = c;
  });

  comments.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(c);
    } else {
      roots.push(c);
    }
  });

  return roots;
}
