import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const method = config.method?.toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('api_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  return config;
});


api.interceptors.response.use(
  (res) => res,
  (error) => {
    const authUrl = error.config?.url || '';
    const isAuthExchange = authUrl.includes('/auth/login') || authUrl.includes('/auth/microsoft/callback');

    if (error.response?.status === 401 && !isAuthExchange) {
      localStorage.removeItem('accessToken');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/';
      }
    } else if (
      !error.response ||
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504
    ) {
      // Handle Render cold start or severe server overload gracefully
      const queueMessage = 'Heavy traffic right now, you are in a queue. Please wait 30 seconds.';

      // If error.response exists, modify its message payload
      if (error.response && error.response.data) {
        error.response.data.message = queueMessage;
      } else {
        // If it's a network error (!error.response), create a mock response
        error.response = {
          data: {
            message: queueMessage
          }
        };
      }
    }
    return Promise.reject(error);
  }
);

// -------------------------------------------------------------
// Global GET Cache Wrapper
// -------------------------------------------------------------
const originalGet = api.get;
api.get = async (url, config = {}) => {
  // Bypass cache for admin portal or if explicitly requested
  if (config.bypassCache || window.location.pathname.startsWith('/admin')) {
    return originalGet.call(api, url, config);
  }

  const cacheKey = `api_cache_${url}_${JSON.stringify(config.params || {})}`;
  const CACHE_TIME = 2 * 60 * 1000; // 2 minutes
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    try {
      const parsedData = JSON.parse(cachedData);
      const isFresh = parsedData.timestamp && (Date.now() - parsedData.timestamp < CACHE_TIME);

      // Background revalidation if stale
      if (!isFresh) {
        originalGet.call(api, url, config).then(response => {
          if (response.status === 200) {
            localStorage.setItem(cacheKey, JSON.stringify({
              timestamp: Date.now(),
              data: response.data
            }));
          }
        }).catch(() => {});
      }

      // Always return cached data immediately for instant 0ms UI load
      return Promise.resolve({
        data: parsedData.data,
        status: 200,
        statusText: isFresh ? 'OK (Cached)' : 'OK (Cached Stale)',
        headers: {},
        config,
        request: {}
      });
    } catch (e) {
      console.error('Cache parse error:', e);
    }
  }

  // Make network request if no cache is present
  const response = await originalGet.call(api, url, config);
  if (response.status === 200) {
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: response.data
    }));
  }

  return response;
};

export default api;
