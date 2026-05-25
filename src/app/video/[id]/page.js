"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import CommentCard from "@/components/CommentCard";
import CommentCompose from "@/components/CommentCompose";
import { createClient } from "@/lib/supabase";
import LoadingScreen from "@/components/LoadingScreen";

export default function VideoPage({ params }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url");

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("latest");
  const [replyingTo, setReplyingTo] = useState(null);
  const [videoCollapsed, setVideoCollapsed] = useState(false); // mobile toggle
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (id !== "new") {
      fetchVideo();
      fetchComments();
    }
  }, [id, sort]);

  // Handle new video submission from home page
  useEffect(() => {
    if (id === "new" && urlParam) {
      handleNewVideo(decodeURIComponent(urlParam));
    }
  }, [id, urlParam]);

  const handleNewVideo = async (tiktokUrl) => {
    const oembedRes = await fetch(`/api/tiktok?url=${encodeURIComponent(tiktokUrl)}`);
    const oembed = oembedRes.ok ? await oembedRes.json() : null;

    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tiktok_url: tiktokUrl,
        tiktok_id: oembed?.embed_product_id || null,
        title: oembed?.title || "TikTok Video",
        author_name: oembed?.author_name || "Unknown",
        author_url: oembed?.author_url || tiktokUrl,
        thumbnail_url: oembed?.thumbnail_url || null,
      }),
    });

    const data = await res.json();
    if (data.id) {
      window.location.href = `/video/${data.id}`;
    }
  };

  const fetchVideo = async () => {
    const { data } = await supabase.from("videos").select("*").eq("id", id).single();
    if (data) setVideo(data);
    setLoading(false);
  };

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?video_id=${id}&sort=${sort}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    }
  }, [id, sort]);

  // Realtime comment subscription
  useEffect(() => {
    if (id === "new") return;
    const channel = supabase
      .channel(`comments-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `video_id=eq.${id}` }, () => {
        fetchComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, fetchComments]);

  if (loading || id === "new") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="text-muted font-display">Loading...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔇</div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Video not found</h2>
            <a href="/" className="text-primary hover:underline font-display">← Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  const videoId = video.tiktok_id || extractVideoId(video.tiktok_url);
  const isValidEmbedId = /^\d+$/.test(videoId);

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      {/* Background Orbs */}
      <div className="fixed w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(13,227,242,0.10)_0%,transparent_70%)] -top-[200px] -left-[200px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,0,60,0.07)_0%,transparent_70%)] -bottom-[100px] -right-[100px] rounded-full -z-10 pointer-events-none" />

      {/* ── DESKTOP layout: side-by-side ── */}
      <div className="hidden md:flex flex-1 overflow-hidden" style={{ height: "100vh" }}>
        {/* Left – Video */}
        <div className="w-1/2 lg:w-[58%] h-full bg-black flex flex-col relative">
          {/* Top bar */}
          <div className="absolute top-0 left-0 p-5 z-20 w-full flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <a href="/trending" className="flex items-center justify-center size-10 rounded-full bg-surface border border-border-glass text-text-main hover:bg-surface-glass-hover transition-colors text-lg">
              ←
            </a>
            <span className="px-3 py-1 text-xs font-display font-semibold uppercase tracking-wider bg-accent/20 text-accent rounded-full border border-accent/30">
              💬 Unmuted
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-[380px] flex flex-col items-center gap-4">
              {isValidEmbedId ? (
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${videoId}?lang=en-US`}
                  className="w-full rounded-xl border border-border-glass"
                  style={{ height: "680px", maxHeight: "78vh" }}
                  allowFullScreen
                  allow="encrypted-media"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              ) : (
                /* Fallback thumbnail when video ID is missing or invalid */
                <div className="w-full aspect-[9/16] rounded-xl overflow-hidden bg-surface-card border border-border-glass flex flex-col items-center justify-center relative">
                  {video.thumbnail_url
                    ? <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover opacity-50" />
                    : <div className="absolute inset-0 bg-background-dark/80" />
                  }
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-muted text-5xl mb-4">▶</span>
                    <p className="text-white font-display font-bold text-lg">Preview Unavailable</p>
                    <p className="text-muted text-sm mt-2">Watch the full video directly on TikTok.</p>
                  </div>
                </div>
              )}
              {/* Video info card */}
              <div className="w-full p-4 glass-card rounded-lg border border-border-glass">
                <p className="text-white font-display font-bold leading-tight">{video.author_name}</p>
                <p className="text-text-muted text-sm mt-1 line-clamp-2">{video.title}</p>
                <a
                  href={video.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-display font-semibold hover:bg-primary/20 transition-all border border-primary/20"
                >
                  Watch on TikTok ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right – Comments */}
        <div className="w-1/2 lg:w-[42%] h-full flex flex-col border-l border-border-glass bg-background-dark/60 backdrop-blur-3xl relative">
          {/* Thread header */}
          <div className="h-[68px] shrink-0 glass-panel border-t-0 border-r-0 border-l-0 flex items-center justify-between px-6 z-20">
            <div>
              <h2 className="font-display font-bold text-lg text-text-main">Discussion</h2>
              <p className="text-text-muted text-xs">{comments.length} comment{comments.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex gap-2">
              {["latest", "top"].map((s) => (
                <button key={s} onClick={() => setSort(s)}
                  className={`px-3 py-1 text-xs font-display font-semibold uppercase tracking-wider rounded-lg transition-all ${sort === s ? "bg-primary/10 text-primary" : "text-muted hover:text-white"}`}>
                  {s === "latest" ? "Latest" : "Top"}
                </button>
              ))}
            </div>
          </div>

          {/* Comment feed */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-4 pb-[160px]">
            {comments.length === 0
              ? <div className="text-center py-16"><div className="text-5xl mb-4">🔇</div><h3 className="font-display text-xl font-bold text-white mb-2">No comments yet</h3><p className="text-muted">Be the first to break the silence.</p></div>
              : comments.map((c) => <CommentCard key={c.id} comment={c} currentUser={user} onReply={setReplyingTo} />)}
          </div>

          {/* Compose */}
          <div className="absolute bottom-0 left-0 w-full glass-panel border-b-0 border-r-0 border-l-0 z-20 p-4 shadow-[0_-10px_40px_rgba(5,5,10,0.8)]">
            <CommentCompose videoId={id} parentId={replyingTo?.id || null} currentUser={user} onPosted={fetchComments} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} />
          </div>
        </div>
      </div>

      {/* ── MOBILE layout: stacked ── */}
      <div className="flex md:hidden flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-4 py-3 glass-panel border-x-0 border-t-0 sticky top-0 z-30">
          <a href="/trending" className="flex items-center justify-center size-9 rounded-full bg-surface border border-border-glass text-text-main text-base">
            ←
          </a>
          <span className="font-display font-bold text-sm text-white truncate max-w-[180px]">@{video.author_name}</span>
          <span className="px-2 py-0.5 text-xs font-display font-semibold uppercase tracking-wider bg-accent/20 text-accent rounded-full border border-accent/30">
            💬
          </span>
        </div>

        {/* Collapsible video embed */}
        <div className="w-full bg-black">
          <button
            onClick={() => setVideoCollapsed((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-display font-semibold text-text-muted uppercase tracking-wider bg-black/80"
          >
            <span>📺 {videoCollapsed ? "Show Video" : "Hide Video"}</span>
            <span>{videoCollapsed ? "▼" : "▲"}</span>
          </button>

          {!videoCollapsed && (
            <div className="flex justify-center px-4 pb-4">
              {isValidEmbedId ? (
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${videoId}?lang=en-US`}
                  className="w-full max-w-[340px] rounded-xl border border-border-glass"
                  style={{ height: "560px" }}
                  allowFullScreen
                  allow="encrypted-media"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              ) : (
                <div className="w-full max-w-[340px] aspect-[9/16] rounded-xl overflow-hidden bg-surface-card border border-border-glass flex flex-col items-center justify-center relative">
                  {video.thumbnail_url
                    ? <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover opacity-50" />
                    : <div className="absolute inset-0 bg-background-dark/80" />
                  }
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-muted text-4xl mb-3">▶</span>
                    <p className="text-white font-display font-bold text-base">Preview Unavailable</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Video info strip */}
          <div className="px-4 pb-3 pt-1 flex items-center justify-between gap-2 bg-black/60">
            <div className="min-w-0">
              <p className="text-white text-sm font-display font-bold truncate">{video.title}</p>
              <p className="text-text-muted text-xs">by @{video.author_name}</p>
            </div>
            <a
              href={video.tiktok_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-display font-semibold border border-primary/20 whitespace-nowrap"
            >
              TikTok ↗
            </a>
          </div>
        </div>

        {/* Comments section */}
        <div className="flex-1 flex flex-col relative">
          {/* Comment header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-glass bg-background-dark/80 backdrop-blur sticky top-[52px] z-20">
            <p className="text-text-muted text-xs font-display font-semibold uppercase tracking-wider">
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              {["latest", "top"].map((s) => (
                <button key={s} onClick={() => setSort(s)}
                  className={`px-2.5 py-1 text-xs font-display font-semibold uppercase tracking-wider rounded-lg transition-all ${sort === s ? "bg-primary/10 text-primary border border-primary/30" : "text-muted"}`}>
                  {s === "latest" ? "Latest" : "Top"}
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          <div className="px-4 py-4 flex flex-col gap-4 pb-[140px]">
            {comments.length === 0
              ? <div className="text-center py-12"><div className="text-4xl mb-3">🔇</div><p className="font-display font-bold text-white mb-1">No comments yet</p><p className="text-muted text-sm">Be the first to break the silence.</p></div>
              : comments.map((c) => <CommentCard key={c.id} comment={c} currentUser={user} onReply={setReplyingTo} />)}
          </div>

          {/* Compose box fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-30 glass-panel border-b-0 border-x-0 p-3 shadow-[0_-8px_30px_rgba(5,5,10,0.9)]">
            <CommentCompose videoId={id} parentId={replyingTo?.id || null} currentUser={user} onPosted={fetchComments} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function extractVideoId(url) {
  if (!url) return "";
  const videoMatch = url.match(/\/video\/(\d+)/);
  if (videoMatch) return videoMatch[1];
  
  // We can't reliably extract numeric ID from short urls synchronously
  // Better to return empty so it falls back gracefully
  return "";
}
