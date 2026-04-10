"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function CommentCompose({ videoId, parentId = null, currentUser, onPosted, replyingTo = null, onCancelReply }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    setLoading(true);
    const { error } = await supabase.from("comments").insert({
      video_id: videoId,
      user_id: currentUser.id,
      parent_id: parentId,
      content: content.trim(),
    });

    if (!error) {
      setContent("");
      onPosted?.();
      onCancelReply?.();
    }
    setLoading(false);
  };

  if (!currentUser) {
    return (
      <div className="glass-panel border-b-0 border-r-0 border-l-0 p-4 text-center">
        <a
          href="/login"
          className="text-primary hover:underline font-display font-semibold"
        >
          Sign in to join the conversation
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full relative flex items-end gap-3 bg-black/40 rounded-lg border border-border-glass p-2 focus-within:border-primary/50 focus-within:shadow-[0_0_12px_rgba(13,227,242,0.15)] transition-all">
      {replyingTo && (
        <div className="absolute -top-8 left-2 flex items-center gap-2 text-xs text-text-muted">
          <span>Replying to <span className="text-primary">@{replyingTo.profiles?.username}</span></span>
          <button type="button" onClick={onCancelReply} className="text-accent hover:text-white">✕</button>
        </div>
      )}
      <textarea
        className="w-full bg-transparent border-none text-text-main placeholder-text-muted text-base resize-none focus:ring-0 h-12 max-h-[80px] no-scrollbar py-3 px-2 font-body outline-none"
        placeholder={replyingTo ? "Write a reply..." : "Be the first to break the silence..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
      />
      <div className="flex items-center gap-2 shrink-0 mb-1 mr-1">
        <span className="text-xs text-text-muted font-mono">{content.length}/1000</span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-primary text-background-dark font-display font-semibold uppercase tracking-wider text-sm px-6 py-3 rounded-lg hover:bg-white hover:shadow-[0_0_16px_rgba(13,227,242,0.4)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? "..." : "Post"}
        </button>
      </div>
    </form>
  );
}
