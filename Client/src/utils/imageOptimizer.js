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
