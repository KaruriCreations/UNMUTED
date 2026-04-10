"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({ comments: 0, upvotes: 0, videos: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    setUser(u);

    // Fetch profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", u.id)
      .single();

    if (prof) {
      setProfile(prof);
      setBio(prof.bio || "");
      setDisplayName(prof.display_name || "");
    }

    // Fetch user's comments with video info
    const { data: userComments } = await supabase
      .from("comments")
      .select("*, videos(id, title, thumbnail_url, author_name), profiles(username)")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setComments(userComments || []);

    // Compute stats
    const { count: commentCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", u.id);

    const { count: videoCount } = await supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("submitted_by", u.id);

    // Total upvotes on user's comments
    const { data: userCommentIds } = await supabase
      .from("comments")
      .select("id")
      .eq("user_id", u.id);

    let totalUpvotes = 0;
    if (userCommentIds?.length > 0) {
      const ids = userCommentIds.map((c) => c.id);
      const { count: upCount } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .in("comment_id", ids)
        .eq("vote_type", "up");
      totalUpvotes = upCount || 0;
    }

    setStats({
      comments: commentCount || 0,
      upvotes: totalUpvotes,
      videos: videoCount || 0,
    });

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    await supabase
      .from("profiles")
      .update({ bio, display_name: displayName })
      .eq("id", user.id);
    setProfile((p) => ({ ...p, bio, display_name: displayName }));
    setEditing(false);
  };

  const getRank = () => {
    if (stats.upvotes >= 1000) return "S";
    if (stats.upvotes >= 500) return "A+";
    if (stats.upvotes >= 100) return "A";
    if (stats.upvotes >= 50) return "B";
    if (stats.upvotes >= 10) return "C";
    return "D";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted font-display">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Profile Identity */}
        <aside className="w-[280px] shrink-0 border-r border-border-glass bg-background-dark flex flex-col p-6 h-[calc(100vh-65px)] overflow-y-auto no-scrollbar">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4 mb-10">
            <div className="relative group">
              <div className="w-[120px] h-[120px] rounded-lg border-2 border-primary overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.3)] bg-surface-card flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary text-4xl font-display font-bold">
                    {(profile?.username || "?")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-background-dark border border-primary text-primary font-mono text-xs px-2 py-0.5 rounded-sm">
                ONLINE
              </div>
            </div>
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-accent tracking-wider">
                @{profile?.username}
              </h1>
              <p className="font-mono text-muted text-xs mt-1">
                JOINED {new Date(profile?.created_at).toISOString().split("T")[0].replaceAll("-", ".")}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mb-10">
            <div className="glass-card p-3 rounded-lg flex flex-col items-center justify-center border border-border-glass hover:border-primary transition-colors cursor-default">
              <span className="font-mono text-xs text-muted mb-1">VIDEOS</span>
              <span className="font-display text-3xl font-bold text-primary">{stats.videos}</span>
            </div>
            <div className="glass-card p-3 rounded-lg flex flex-col items-center justify-center border border-border-glass hover:border-primary transition-colors cursor-default">
              <span className="font-mono text-xs text-muted mb-1">COMMENTS</span>
              <span className="font-display text-3xl font-bold text-primary">{stats.comments}</span>
            </div>
            <div className="glass-card p-3 rounded-lg flex flex-col items-center justify-center border border-border-glass hover:border-primary transition-colors cursor-default">
              <span className="font-mono text-xs text-muted mb-1">UPVOTES</span>
              <span className="font-display text-3xl font-bold text-primary">{formatCount(stats.upvotes)}</span>
            </div>
            <div className="glass-card p-3 rounded-lg flex flex-col items-center justify-center border border-border-glass hover:border-accent transition-colors cursor-default">
              <span className="font-mono text-xs text-muted mb-1">RANK</span>
              <span className="font-display text-3xl font-bold text-accent">{getRank()}</span>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-auto">
            <h3 className="font-mono text-xs text-muted uppercase mb-2 pb-1 border-b border-border-glass">Bio</h3>
            {editing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black/40 border border-border-glass rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                  placeholder="Display name"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-black/40 border border-border-glass rounded px-3 py-2 text-white text-sm resize-none h-20 focus:outline-none focus:border-primary"
                  placeholder="Your bio..."
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="flex-1 py-2 bg-primary text-background-dark text-sm font-display font-bold rounded">
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="flex-1 py-2 glass-card border border-border-glass text-muted text-sm font-display rounded">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-text-main mb-4">{profile?.bio || "No bio yet."}</p>
                <button
                  onClick={() => setEditing(true)}
                  className="w-full py-2 glass-card border border-border-glass text-primary font-display font-semibold uppercase tracking-widest text-sm hover:bg-primary hover:text-background-dark transition-all rounded-lg flex items-center justify-center gap-2"
                >
                  ✏️ Edit Profile
                </button>
              </>
            )}

            {/* Danger Zone */}
            <div className="mt-8 pt-4 border-t border-accent/30">
              <h3 className="font-mono text-xs text-accent uppercase mb-2">Danger Zone</h3>
              <button
                onClick={async () => {
                  if (window.confirm("WARNING: This will permanently delete your account, comments, and all data. Are you absolutely certain?")) {
                    const res = await fetch("/api/profile", { method: "DELETE" });
                    if (res.ok) {
                      await supabase.auth.signOut();
                      window.location.href = "/";
                    } else {
                      alert("Failed to delete account. Please try again.");
                    }
                  }
                }}
                className="w-full py-2 bg-accent/10 border border-accent/50 text-accent font-display font-semibold uppercase tracking-widest text-sm hover:bg-accent hover:text-white transition-all rounded-lg flex items-center justify-center gap-2 drop-shadow-[0_0_8px_rgba(255,0,60,0.2)] hover:drop-shadow-[0_0_12px_rgba(255,0,60,0.5)]"
              >
                ⚠️ Delete Account
              </button>
            </div>
          </div>
        </aside>

        {/* Right: Activity Feed */}
        <section className="flex-1 flex flex-col h-[calc(100vh-65px)] bg-background-dark relative">
          <div className="sticky top-0 z-10 glass-panel border-x-0 border-t-0 px-8 py-4 flex justify-between items-center">
            <h2 className="font-display text-xl font-bold tracking-widest flex items-center gap-2">
              📋 ACTIVITY LOG
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6 flex flex-col gap-3">
            {comments.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔇</div>
                <h3 className="font-display text-xl font-bold text-white mb-2">No activity yet</h3>
                <p className="text-muted mb-4">Start commenting on videos to build your history.</p>
                <Link href="/trending" className="text-primary hover:underline font-display font-semibold">
                  Browse Trending →
                </Link>
              </div>
            ) : (
              comments.map((comment) => (
                <Link key={comment.id} href={`/video/${comment.video_id}`}>
                  <article className="flex rounded-lg border border-border-glass bg-background-dark overflow-hidden cursor-pointer hover:bg-surface-glass-hover transition-colors group">
                    {/* Thumbnail */}
                    <div className="w-[80px] shrink-0 border-r border-border-glass relative bg-surface-card">
                      {comment.videos?.thumbnail_url ? (
                        <img
                          alt="Thumb"
                          className="w-full h-full object-cover group-hover:grayscale transition-all"
                          src={comment.videos.thumbnail_url}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted text-xl">▶</span>
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-primary">@{comment.videos?.author_name || "?"}</span>
                          <span className="text-muted">•</span>
                          <span className="text-muted">{getTimeAgo(comment.created_at)}</span>
                        </div>
                        <div className="flex gap-3 text-muted font-mono text-xs">
                          <span className="flex items-center gap-1">▲ {comment.upvotes || 0}</span>
                          <span className="flex items-center gap-1">▼ {comment.downvotes || 0}</span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-text-main group-hover:text-white transition-colors line-clamp-2">
                        {comment.content}
                      </p>
                    </div>
                  </article>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
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
