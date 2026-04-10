"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleTikTokLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "tiktok",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Orbs */}
      <div className="fixed w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(0,240,255,0.12)_0%,transparent_70%)] top-[10%] left-[10%] rounded-full blur-[60px] -z-10 pointer-events-none" />
      <div className="fixed w-[35vw] h-[35vw] bg-[radial-gradient(circle,rgba(255,0,60,0.08)_0%,transparent_70%)] bottom-[10%] right-[10%] rounded-full blur-[60px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-center py-8">
        <Link href="/" className="flex items-center gap-3 text-white hover:text-primary transition-colors">
          <div className="size-6 text-primary">
            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-xl font-display font-bold tracking-tight">Unmuted</h2>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="glass-panel rounded-xl p-8">
            <h1 className="font-display text-3xl font-bold text-white text-center mb-2">Welcome back</h1>
            <p className="text-text-muted text-center mb-8">Sign in to unmute the conversation</p>

            {error && (
              <div className="bg-accent/10 border border-accent/30 text-accent rounded-lg px-4 py-3 mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-display font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-border-glass rounded-lg px-4 py-3 text-white placeholder:text-muted focus:outline-none focus:border-primary focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-display font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-border-glass rounded-lg px-4 py-3 text-white placeholder:text-muted focus:outline-none focus:border-primary focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-background-dark font-display font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-[#00d0e0] hover:shadow-[0_0_16px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 mt-2"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border-glass" />
              <span className="text-xs text-text-muted font-display uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border-glass" />
            </div>

            {/* <button
              onClick={handleTikTokLogin}
              className="w-full glass-card border border-border-glass rounded-lg py-3 text-white font-display font-semibold hover:bg-surface-glass-hover transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 448 512" fill="currentColor">
                <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
              </svg>
              Continue with TikTok
            </button> */}

            <p className="text-center text-text-muted text-sm mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline font-semibold">Sign up</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
