"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-border-glass px-6 md:px-10 py-4 glass-panel sticky top-0 w-full z-50 border-t-0 border-l-0 border-r-0 rounded-none bg-background-dark/80 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-3 text-white hover:text-primary transition-colors group">
        <div className="size-6 text-primary group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] transition-all">
          <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor" />
          </svg>
        </div>
        <h2 className="text-white text-xl font-display font-bold leading-tight tracking-tight group-hover:text-primary transition-colors">Unmuted</h2>
      </Link>

      <nav className="flex items-center gap-6 md:gap-9">
        <Link className="text-muted hover:text-primary transition-colors text-sm font-medium" href="/trending">
          Trending
        </Link>
        {user ? (
          <>
            <Link className="text-muted hover:text-primary transition-colors text-sm font-medium" href="/profile">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-muted hover:text-accent transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="bg-primary text-background-dark font-display font-bold tracking-wider px-5 py-2 rounded-lg hover:bg-[#00d0e0] hover:shadow-[0_0_16px_rgba(0,240,255,0.4)] transition-all text-sm"
          >
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
