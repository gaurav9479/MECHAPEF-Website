import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  register: (data) => api.post('/auth/register', data),
};

export const eventService = {
  getAll: (params) => api.get('/events', { params }),
  getFeatured: () => api.get('/events/featured'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getStats: (id) => api.get(`/events/${id}/stats`),
  register: (eventId, data) => api.post(`/events/${eventId}/register`, data),
  getRegistrations: (eventId) => api.get(`/events/${eventId}/registrations`),
  markAttendance: (registrationId, data) => api.put(`/registrations/${registrationId}/attendance`, data),
  wipeData: (id) => api.delete(`/events/${id}/wipe-data`),
};

export const registrationService = {
  getMyRegistrations: () => api.get('/registrations/my-registrations'),
  cancel: (id) => api.delete(`/registrations/${id}`),
};

export const teamService = {
  getAll: (params) => api.get('/team', { params }),
  create: (data) => api.post('/team', data),
  update: (id, data) => api.put(`/team/${id}`, data),
  delete: (id) => api.delete(`/team/${id}`),
};

export const announcementService = {
  getActive: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

export const sponsorService = {
  getAll: () => api.get('/sponsors'),
  create: (data) => api.post('/sponsors', data),
  update: (id, data) => api.put(`/sponsors/${id}`, data),
  delete: (id) => api.delete(`/sponsors/${id}`),
};

export const sponsorConfigService = {
  getConfig: () => api.get('/sponsors/config'),
  updateConfig: (data) => api.put('/sponsors/config', data),
};
