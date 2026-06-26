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
  return config;
});


api.interceptors.response.use(
  (res) => res,
  (error) => {
    const authUrl = error.config?.url || '';
    const isAuthExchange = authUrl.includes('/auth/login') || authUrl.includes('/auth/microsoft/callback');

    if (error.response?.status === 401 && !isAuthExchange) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
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

export default api;
