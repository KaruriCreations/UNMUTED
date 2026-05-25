"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";
import LoadingScreen from "@/components/LoadingScreen";
import SkeletonLoader from "@/components/SkeletonLoader";

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentVideos, setRecentVideos] = useState([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Fetch a few recent videos for the ticker
    fetch("/api/videos?sort=new&limit=10", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRecentVideos(data); })
      .catch(() => {});
  }, []);

   const handleSubmit = async (e) => {
     e.preventDefault();
     
     // Basic validation
     if (!url.trim()) {
       setError("Please enter a TikTok URL.");
       return;
     }
     
     if (!url.includes("tiktok.com")) {
       setError("Please enter a valid TikTok URL.");
       return;
     }

     setError("");
     setLoading(true);

     // Fetch oEmbed data with timeout
     let oembed = null;
     try {
       const controller = new AbortController();
       const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
       
       const oembedRes = await fetch(`/api/tiktok?url=${encodeURIComponent(url)}`, {
         signal: controller.signal
       });
       
       clearTimeout(timeoutId);
       
       if (oembedRes.ok) {
         oembed = await oembedRes.json();
       }
     } catch (error) {
       if (error.name !== 'AbortError') {
         console.error('Failed to fetch TikTok oEmbed:', error);
       }
       // Continue with default values - don't fail the whole operation
     }

     // Create or find existing video entry
     const res = await fetch("/api/videos", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         tiktok_url: url,
         title: oembed?.title || "TikTok Video",
         author_name: oembed?.author_name || "Unknown",
         author_url: oembed?.author_url || url,
         thumbnail_url: oembed?.thumbnail_url || null,
       }),
     });

     const data = await res.json();
     setLoading(false);

     if (data.id) {
       router.push(`/video/${data.id}`);
     } else {
       setError(data.error || "Something went wrong. Try again.");
     }
   };

  return (
    <div className="flex-1 flex flex-col relative min-h-screen">
      <Navbar />

      {/* Background Orbs */}
      <div className="fixed w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(0,240,255,0.15)_0%,rgba(0,240,255,0)_70%)] top-[10%] left-[20%] rounded-full blur-[60px] -z-10 pointer-events-none" />
      <div className="fixed w-[35vw] h-[35vw] bg-[radial-gradient(circle,rgba(255,0,60,0.1)_0%,rgba(255,0,60,0)_70%)] bottom-[20%] right-[15%] rounded-full blur-[60px] -z-10 pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 relative z-0">
        <div className="w-full max-w-[720px] flex flex-col items-center gap-10">
          <h1 className="text-white font-display text-5xl md:text-[64px] font-bold leading-tight tracking-tight text-center drop-shadow-lg">
            Unmute the Internet
          </h1>
          <p className="text-muted text-lg text-center max-w-md -mt-4">
            Paste a TikTok link. Start the conversation they tried to stop.
          </p>

          {/* Input Area */}
          <div className="w-full max-w-[600px]">
            <form
              onSubmit={handleSubmit}
              className={`glass-panel rounded-lg flex items-stretch h-16 w-full transition-all duration-300 focus-within:border-primary focus-within:shadow-[0_0_16px_rgba(0,240,255,0.4)] ${error ? "!border-accent !shadow-[0_0_16px_rgba(255,0,60,0.4)] animate-shake" : ""}`}
            >
              <input
                className="flex-1 bg-transparent border-none text-white px-6 py-0 focus:ring-0 placeholder:text-muted text-lg font-body outline-none"
                placeholder="Paste TikTok URL here..."
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError("");
                }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-background-dark font-display font-bold tracking-wider px-8 h-full rounded-r-lg hover:bg-[#00d0e0] transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin text-2xl">⏳</span>
                ) : (
                  <span className="font-bold text-2xl">→</span>
                )}
              </button>
            </form>

            <div className="h-6 mt-2 text-center">
              {error && <span className="text-accent text-sm font-body">{error}</span>}
            </div>
          </div>
        </div>
      </main>

       {/* Trending Ticker */}
       <div className="fixed bottom-0 w-full glass-panel border-b-0 border-l-0 border-r-0 rounded-none h-12 flex items-center overflow-hidden group">
         <div className="flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] text-sm font-body text-muted">
           {recentVideos.length > 0 ? (
             <>
               <div className="flex items-center space-x-12 px-6">
                 {recentVideos.map((v) => (
                   <a key={v.id} href={`/video/${v.id}`} className="hover:text-accent cursor-pointer transition-colors flex items-center gap-2">
                     <span className="text-accent">🔥</span> @{v.author_name} • <span className="text-primary">💬 {v.comment_count || 0}</span>
                   </a>
                 ))}
               </div>
               <div className="flex items-center space-x-12 px-6">
                 {recentVideos.map((v) => (
                   <a key={`dup-${v.id}`} href={`/video/${v.id}`} className="hover:text-accent cursor-pointer transition-colors flex items-center gap-2">
                     <span className="text-accent">🔥</span> @{v.author_name} • <span className="text-primary">💬 {v.comment_count || 0}</span>
                   </a>
                 ))}
               </div>
             </>
           ) : (
             <>
               {[1, 2].map((i) => (
                 <div key={i} className="flex items-center space-x-12 px-6">
                   <span className="flex items-center gap-2"><span className="text-accent">🔥</span> Paste a TikTok URL to get started • <span className="text-primary">💬 Unmute</span></span>
                   <span className="flex items-center gap-2"><span className="text-accent">🔥</span> Join the conversation • <span className="text-primary">💬 Comment</span></span>
                   <span className="flex items-center gap-2"><span className="text-accent">🔥</span> Browse trending discussions • <span className="text-primary">💬 Vote</span></span>
                 </div>
               ))}
             </>
           )}
         </div>
       </div>
       
       {/* Global Loading Screen */}
       <LoadingScreen show={loading} message="Processing TikTok..." />
     </div>
   );
}
