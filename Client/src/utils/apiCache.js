import api from '../services/api';

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
    } catch (e) {
      console.error('Failed to parse API cache:', e);
    }
  }

  // 2. Fetch fresh data from API in background
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
