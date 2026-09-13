import api from '../services/api';
import { preloadImage } from './imageOptimizer';

const getCacheDuration = (url, options) => {
  if (options && options.cacheDuration !== undefined) return options.cacheDuration;

  const urlLower = url.toLowerCase();


  if (urlLower.includes('/auth/users') || urlLower.includes('admin')) {
    return 0; 
  }


  if (urlLower.includes('/team')) {
    return 2 * 60 * 60 * 1000;
  }


  if (urlLower.includes('/events') || urlLower.includes('/announcements') || urlLower.includes('/upload/sections') || urlLower.includes('/special-sponsor')) {
    return 2 * 60 * 1000;
  }


  return 4 * 60 * 60 * 1000;
};

const pendingRequests = {};

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
  

  const cached = localStorage.getItem(cacheKey);
  let hasServedCache = false;
  
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      extractAndPreloadImages(parsed.data);
      

      callback(parsed.data, true);
      hasServedCache = true;
      

      const duration = getCacheDuration(url, options);
      if (Date.now() - parsed.timestamp < duration) {
        return;
      }
    } catch (e) {
      console.error('Failed to parse API cache:', e);
    }
  }


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


  const fetchPromise = api.get(url, options).then(res => {
    const freshData = res.data;
    extractAndPreloadImages(freshData);
    

    localStorage.setItem(cacheKey, JSON.stringify({
      data: freshData,
      timestamp: Date.now()
    }));


    callback(freshData, false);
    

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
