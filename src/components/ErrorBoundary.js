"use client";

import { useState, useEffect } from "react";

export default function ErrorBoundary({ fallback, children }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasError) {
      console.error("Error Boundary caught an error:", error);
    }
  }, [hasError, error]);

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    setError(error);
    console.error("Uncaught error:", error, errorInfo);
  }

  if (hasError) {
    return fallback || (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6">
          <span className="text-6xl text-accent">💥</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-4">
          Something went wrong
        </h1>
        <p className="text-muted mb-6">
          We've been notified about this issue and will fix it shortly.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-background-dark font-display font-bold px-6 py-3 rounded-lg hover:bg-[#00d0e0] transition-all"
        >
          Try Again
        </button>
        <div className="mt-4 text-xs text-muted max-w-md">
          {error?.message || "Unknown error"}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}