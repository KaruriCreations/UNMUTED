"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import VideoCard from "@/components/VideoCard";
import LoadingScreen from "@/components/LoadingScreen";

export default function TrendingPage() {
  const [videos, setVideos] = useState([]);
  const [sort, setSort] = useState("hot");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [sort]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos?sort=${sort}&limit=30`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to fetch videos: ${res.status}`);
      }
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching videos:", error);
      setVideos([]);
    }
    setLoading(false);
  };

  const sortOptions = [
    { key: "hot", label: "Hot", icon: "🔥" },
    { key: "new", label: "New", icon: "✨" },
    { key: "controversial", label: "Controversial", icon: "⚡" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Orbs */}
      <div className="fixed w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(0,240,255,0.12)_0%,transparent_70%)] top-[-10%] left-[-10%] rounded-full blur-[60px] -z-10 pointer-events-none" />
      <div className="fixed w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(255,0,60,0.08)_0%,transparent_70%)] bottom-[-10%] right-[-10%] rounded-full blur-[60px] -z-10 pointer-events-none" />

      <Navbar />

      <main className="flex-1 px-6 md:px-12 py-8 md:py-12 max-w-7xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">Trending Discussions</h1>
          <p className="text-muted mt-2 font-body text-base">Join the conversation on the internet&apos;s hottest videos.</p>
        </header>

        {/* Sort tabs */}
        <div className="flex gap-2 mb-8">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`px-4 py-2 rounded-lg font-display font-semibold text-sm uppercase tracking-wider transition-all ${
                sort === opt.key
                  ? "bg-primary/10 text-primary border border-primary/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                  : "text-muted hover:text-white glass-card border border-border-glass"
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

     {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-panel rounded-lg overflow-hidden animate-pulse">
                <div className="h-[180px] bg-skeleton" />
                <div className="p-5">
                  <div className="h-5 bg-skeleton rounded mb-3 w-3/4" />
                  <div className="h-4 bg-skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔇</div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">No videos yet</h2>
            <p className="text-muted mb-6">Be the first to unmute a TikTok video!</p>
            <a href="/" className="bg-primary text-background-dark font-display font-bold px-6 py-3 rounded-lg hover:bg-[#00d0e0] transition-all inline-block">
              Paste a TikTok URL →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
   </main>
   
   {/* Global Loading Screen */}
   <LoadingScreen show={loading} message="Loading trending videos..." />
    </div>
  );
}
