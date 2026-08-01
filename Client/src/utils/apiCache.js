import api from '../services/api';
import { preloadImage } from './imageOptimizer';

const getCacheDuration = (url, options) => {
  if (options && options.cacheDuration) return options.cacheDuration;

  const urlLower = url.toLowerCase();

  // Admin routes should not be heavily cached
  if (urlLower.includes('/auth/users') || urlLower.includes('admin')) {
    return 0; 
  }

  // Team section: 2 hours
  if (urlLower.includes('/team')) {
    return 2 * 60 * 60 * 1000; // 2 hours in ms
  }

  // Events, Announcements, Banners (upload/sections): 2 minutes
  if (urlLower.includes('/events') || urlLower.includes('/announcements') || urlLower.includes('/upload/sections')) {
    return 2 * 60 * 1000; // 2 minutes in ms
  }

  // Rest usual static components (Sponsors, Past Events, Gallery, Magazine, Projects): Long cache (4 hours)
  return 4 * 60 * 60 * 1000; // 4 hours in ms
};

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
      const duration = getCacheDuration(url, options);
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
