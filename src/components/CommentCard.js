"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function CommentCard({ comment, currentUser, onReply, depth = 0 }) {
  const [voteState, setVoteState] = useState(comment.user_vote || null); // 'up', 'down', or null
  const [upvotes, setUpvotes] = useState(comment.upvotes || 0);
  const [downvotes, setDownvotes] = useState(comment.downvotes || 0);
  const supabase = createClient();

  const handleVote = async (type) => {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    if (voteState === type) {
      // Remove vote
      await supabase.from("votes").delete().match({ comment_id: comment.id, user_id: currentUser.id });
      if (type === "up") setUpvotes((v) => v - 1);
      else setDownvotes((v) => v - 1);
      setVoteState(null);
    } else {
      // Upsert vote
      const { error } = await supabase.from("votes").upsert(
        { comment_id: comment.id, user_id: currentUser.id, vote_type: type },
        { onConflict: "comment_id,user_id" }
      );
      if (!error) {
        if (voteState === "up") setUpvotes((v) => v - 1);
        if (voteState === "down") setDownvotes((v) => v - 1);
        if (type === "up") setUpvotes((v) => v + 1);
        else setDownvotes((v) => v + 1);
        setVoteState(type);
      }
    }
  };

  const timeAgo = getTimeAgo(comment.created_at);
  const isReply = depth > 0;

  return (
    <div className={`glass-card rounded-lg p-4 w-full group relative ${isReply ? "ml-8 border-l-2 border-l-border-glass" : ""}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full shrink-0 border border-white/10 bg-surface-card flex items-center justify-center text-primary font-display font-bold text-sm overflow-hidden"
        >
          {comment.profiles?.avatar_url ? (
            <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            (comment.profiles?.username || "?")[0].toUpperCase()
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-display font-bold text-sm text-text-main">
              @{comment.profiles?.username || "anon"}
            </span>
            <span className="text-text-muted text-xs font-light">{timeAgo}</span>
          </div>
          <p className="text-text-main text-base leading-relaxed break-words">{comment.content}</p>

          {/* Action buttons */}
          <div className="mt-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-4">
            <button
              onClick={() => onReply?.(comment)}
              className="text-xs font-display font-semibold text-text-muted hover:text-white uppercase tracking-wider flex items-center gap-1"
            >
              ↩ Reply
            </button>
            {currentUser?.id === comment.user_id && (
              <button
                onClick={async () => {
                  if (window.confirm("Are you sure you want to delete this comment?")) {
                    await fetch(`/api/comments?id=${comment.id}`, { method: "DELETE" });
                    if (comment.onDeleted) comment.onDeleted();
                    // We can also trigger a full re-fetch if parent supports it, 
                    // for now reloading window works natively, or relying on realtime.
                    window.location.reload();
                  }
                }}
                className="text-xs font-display font-semibold text-accent hover:text-accent-pink uppercase tracking-wider flex items-center gap-1"
              >
                × Delete
              </button>
            )}
          </div>
        </div>

        {/* Vote column */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 px-1">
          <button
            onClick={() => handleVote("up")}
            className={`transition-colors text-lg ${voteState === "up" ? "text-accent-pink drop-shadow-[0_0_8px_rgba(255,0,60,0.5)]" : "text-text-muted hover:text-accent-pink"}`}
          >
            ▲
          </button>
          <span className={`font-display text-xs font-bold ${voteState === "up" ? "text-accent-pink" : voteState === "down" ? "text-text-muted" : "text-text-muted"}`}>
            {formatCount(upvotes - downvotes)}
          </span>
          <button
            onClick={() => handleVote("down")}
            className={`transition-colors text-lg ${voteState === "down" ? "text-muted" : "text-text-muted hover:text-white"}`}
          >
            ▼
          </button>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

function formatCount(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
