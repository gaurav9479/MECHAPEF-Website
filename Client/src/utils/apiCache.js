import api from '../services/api';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const apiGetCached = async (url, callback, options = {}) => {
  const cacheKey = `api_cache_${url}`;
  
  // 1. Check localStorage for cached response
  const cached = localStorage.getItem(cacheKey);
  let hasServedCache = false;
  
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      
      // Serve cached data instantly
      callback(parsed.data, true);
      hasServedCache = true;
      
      // If cache is less than 1 day old, skip the background fetch entirely
      if (Date.now() - parsed.timestamp < ONE_DAY_MS) {
        return;
      }
    } catch (e) {
      console.error('Failed to parse API cache:', e);
    }
  }

  // 2. Fetch fresh data from API in background (if no cache or expired)
  try {
    const res = await api.get(url, options);
    const freshData = res.data;
    
    // Save to localStorage
    localStorage.setItem(cacheKey, JSON.stringify({
      data: freshData,
      timestamp: Date.now()
    }));

    // Trigger callback with fresh data
    callback(freshData, false);
    return res;
  } catch (error) {
    console.error(`Background API fetch failed for ${url}:`, error);
    // If background API call fails but we successfully served cache, we don't crash
    if (!hasServedCache) {
      throw error;
    }
  }
};
