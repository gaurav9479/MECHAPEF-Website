
export const getOptimizedImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  // Return maximum highest resolution original photo without downscaling or lossy compression
  if (url.includes('ik.imagekit.io')) {
    let cleanUrl = url;
    cleanUrl = cleanUrl.replace(/\/tr:[^/]+\//g, '/');
    cleanUrl = cleanUrl.replace(/([?&])tr=[^&]*/g, '');
    cleanUrl = cleanUrl.replace(/[?&]$/, '');
    
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}tr=orig-true,q-100`;
  }

  return url;
};

const preloadedUrls = new Set();

/**
 * Preloads an image into browser memory cache for 0ms instant display.
 * @param {string} url - Image URL
 */
export const preloadImage = (url) => {
  if (!url || typeof url !== 'string') return;
  const optimizedUrl = getOptimizedImageUrl(url);
  if (preloadedUrls.has(optimizedUrl)) return;

  preloadedUrls.add(optimizedUrl);
  const img = new Image();
  img.src = optimizedUrl;
};

/**
 * Preloads an array of image URLs in parallel.
 * @param {Array<string>} urls - Array of Image URLs
 */
export const preloadImages = (urls) => {
  if (!Array.isArray(urls)) return;
  urls.forEach(url => preloadImage(url));
};
