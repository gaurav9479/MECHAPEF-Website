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
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('api_cache_')) {
        sessionStorage.removeItem(key);
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
        window.location.href = '/login';
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
  const cachedData = sessionStorage.getItem(cacheKey);

  // Return cached response if available
  if (cachedData) {
    try {
      const parsedData = JSON.parse(cachedData);
      return Promise.resolve({
        data: parsedData,
        status: 200,
        statusText: 'OK (Cached)',
        headers: {},
        config,
        request: {}
      });
    } catch (e) {
      console.error('Cache parse error:', e);
    }
  }

  // Make network request and cache the result
  const response = await originalGet.call(api, url, config);
  if (response.status === 200) {
    sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
  }
  
  return response;
};

export default api;
