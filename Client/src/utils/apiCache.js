import api from '../services/api';

const CACHE_DURATION_MS = 60 * 1000; // 1 minute caching for better performance

// Global map to store ongoing requests and prevent duplicate concurrent API calls
const pendingRequests = {};

export const apiGetCached = async (url, callback, options = {}) => {
  const cacheKey = `api_cache_${url}`;
  
  // 1. Check localStorage for cached response
  const cached = localStorage.getItem(cacheKey);
  let hasServedCache = false;
  
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      
      // Serve cached data instantly (Stale-While-Revalidate)
      callback(parsed.data, true);
      hasServedCache = true;
      
      // If cache is less than the duration old, skip the background fetch to avoid spamming the server on rapid reloads
      const duration = options.cacheDuration || CACHE_DURATION_MS;
      if (Date.now() - parsed.timestamp < duration) {
        return;
      }
    } catch (e) {
      console.error('Failed to parse API cache:', e);
    }
  }

  // Prevent multiple identical API requests at the same time
  if (pendingRequests[url]) {
    try {
      const res = await pendingRequests[url];
      callback(res.data, false);
      return res;
    } catch (error) {
      if (!hasServedCache) throw error;
      return;
    }
  }

  // 2. Fetch fresh data from API in background (if no cache or expired)
  const fetchPromise = api.get(url, options).then(res => {
    const freshData = res.data;
    
    // Save to localStorage
    localStorage.setItem(cacheKey, JSON.stringify({
      data: freshData,
      timestamp: Date.now()
    }));

    // Trigger callback with fresh data
    callback(freshData, false);
    
    // Cleanup pending request
    delete pendingRequests[url];
    return res;
  }).catch(error => {
    delete pendingRequests[url];
    console.error(`Background API fetch failed for ${url}:`, error);
    if (!hasServedCache) {
      throw error;
    }
  });

  pendingRequests[url] = fetchPromise;
  return fetchPromise;
};
