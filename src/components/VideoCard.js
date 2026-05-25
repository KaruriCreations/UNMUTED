"use client";

import Link from "next/link";
import SkeletonLoader from "./SkeletonLoader";

export default function VideoCard({ video, isLoading = false }) {
  const timeAgo = getTimeAgo(video.created_at);

  if (isLoading || !video) {
    return (
      <Link href="/video/placeholder">
        <article className="glass-panel rounded-lg overflow-hidden flex flex-col cursor-default h-full">
          <div className="relative h-[180px] overflow-hidden">
            <SkeletonLoader width="100%" height="100%" borderRadius="lg" />
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80" />
          </div>
          <div className="p-5 flex flex-col flex-1">
            <div className="h-4 bg-skeleton rounded mb-2 w-full"></div>
            <div className="h-4 bg-skeleton rounded mb-2 w-[80%]"></div>
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-4 bg-skeleton rounded"></div>
                <div className="h-4 bg-skeleton rounded w-[60%]"></div>
              </div>
              <SkeletonLoader width="60" height="10" borderRadius="sm" />
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/video/${video.id}`}>
      <article className="glass-panel rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all duration-300 group h-full hover:shadow-[0_0_16px_rgba(0,240,255,0.4)] hover:border-primary">
        <div className="relative h-[180px] overflow-hidden">
          {video.thumbnail_url ? (
            <img
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={video.thumbnail_url}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-card">
              <span className="text-muted text-4xl">▶</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80" />
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display font-semibold text-lg leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {video.title}
          </h3>
          <p className="text-text-muted text-xs mb-3 truncate">by {video.author_name}</p>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-primary">
              <span className="text-sm">💬</span>
              <span className="font-display font-semibold text-sm">
                {formatCount(video.comment_count || 0)} Comments
              </span>
            </div>
            <span className="text-xs text-muted font-body">{timeAgo}</span>
          </div>
        </div>
      </article>
    </Link>
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
