import api from '../services/api';
import { preloadImage } from './imageOptimizer';

const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes caching for images and data

// Global map to store ongoing requests and prevent duplicate concurrent API calls
const pendingRequests = {};

// Automatically warm up browser image cache when payload contains image URLs
const extractAndPreloadImages = (payload) => {
  if (!payload) return;
  const target = payload.data || payload;

  if (target.logoURL) preloadImage(target.logoURL);

  if (Array.isArray(target)) {
    target.forEach(item => {
      if (item.logoURL) preloadImage(item.logoURL);
      if (item.imageURL) preloadImage(item.imageURL);
      if (item.bannerURL) preloadImage(item.bannerURL);
      if (item.mobileImageURL) preloadImage(item.mobileImageURL);
    });
  }

  if (target.images && Array.isArray(target.images)) {
    target.images.forEach(img => {
      if (img.imageURL) preloadImage(img.imageURL);
    });
  }
};

export const apiGetCached = async (url, callback, options = {}) => {
  const cacheKey = `api_cache_${url}`;
  
  // 1. Check localStorage for cached response
  const cached = localStorage.getItem(cacheKey);
  let hasServedCache = false;
  
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      extractAndPreloadImages(parsed.data);
      
      // Serve cached data instantly (Stale-While-Revalidate)
      callback(parsed.data, true);
      hasServedCache = true;
      
      // If cache is less than the duration old, skip the background fetch to avoid spamming the server on rapid reloads
      const duration = options.cacheDuration !== undefined ? options.cacheDuration : CACHE_DURATION_MS;
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
      extractAndPreloadImages(res.data);
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
    extractAndPreloadImages(freshData);
    
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

export const apiClearCache = (url) => {
  if (url) {
    localStorage.removeItem(`api_cache_${url}`);
  } else {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('api_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
};
