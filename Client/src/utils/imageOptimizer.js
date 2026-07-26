/**
 * Helper to serve ImageKit URLs in modern WebP/AVIF format with 100% full original quality (zero degradation).
 * @param {string} url - Image URL
 * @returns {string} Optimized Image URL with 100% quality
 */
export const getOptimizedImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  // Serve modern format (WebP/AVIF) while maintaining 100% original quality
  if (url.includes('ik.imagekit.io')) {
    if (url.includes('tr=')) return url; // Already transformed

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tr=q-100,f-auto`;
  }

  return url;
};

// Memory cache set to avoid duplicate preloading
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
