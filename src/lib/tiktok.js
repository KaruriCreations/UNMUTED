/**
 * Fetch TikTok video metadata via their oEmbed endpoint (no API key needed).
 * Falls back gracefully if the video is private/deleted.
 */
export async function fetchTikTokOembed(url) {
  try {
    const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || "TikTok Video",
      author_name: data.author_name || "Unknown",
      author_url: data.author_url || url,
      thumbnail_url: data.thumbnail_url || null,
      html: data.html || null,
      provider_name: data.provider_name || "TikTok",
      width: data.thumbnail_width || 576,
      height: data.thumbnail_height || 1024,
      embed_product_id: data.embed_product_id || null,
    };
  } catch {
    return null;
  }
}

/**
 * Extract TikTok video ID from URL.
 * Handles: https://www.tiktok.com/@user/video/7123456789
 *          https://vm.tiktok.com/ZMxxxxxxx/
 */
export function extractTikTokId(url) {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Validate TikTok URL format.
 */
export function isValidTikTokUrl(url) {
  return /tiktok\.com/i.test(url);
}
