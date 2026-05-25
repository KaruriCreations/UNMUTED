// Utility functions for API calls with caching, retry mechanisms and error handling

let tiktokCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function fetchWithCache(url, options = {}) {
  // Check cache for GET requests
  if (options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
    const cached = tiktokCache.get(url);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.data;
    }
  }

  try {
    const response = await fetchWithRetry(url, options);
    
    // Cache GET responses
    if (options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
      tiktokCache.set(url, {
        data: response,
        timestamp: Date.now()
      });
      
      // Clean old cache entries periodically
      if (tiktokCache.size > 100) {
        const oldestKey = [...tiktokCache.entries()].reduce((a, b) => 
          a[1].timestamp > b[1].timestamp ? b : a
        )[0];
        tiktokCache.delete(oldestKey);
      }
    }
    
    return response;
  } catch (error) {
    console.error(`API call failed: ${url}`, error);
    throw error;
  }
}

export function clearTiktokCache() {
  tiktokCache.clear();
}

export async function fetchTikTokOembedWithCache(url) {
  return fetchWithCache(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
}