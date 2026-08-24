
export const getOptimizedImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;


  if (url.includes('ik.imagekit.io')) {
    if (url.includes('tr=')) return url; 

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tr=q-100,f-auto`;
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
