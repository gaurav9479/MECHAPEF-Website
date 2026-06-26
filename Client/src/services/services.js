import api from './api';

const getMicrosoftRedirectUri = () => {
  const { protocol, hostname, port } = window.location;
  const isLocalDev = port === '5173' && (hostname === 'localhost' || hostname === '127.0.0.1');
  const origin = isLocalDev ? `${protocol}//localhost:${port}` : window.location.origin;

  return `${origin}/login`;
};

export const authService = {
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  
  getMicrosoftUrl: () => api.get('/auth/microsoft/url', {
    params: { redirectUri: getMicrosoftRedirectUri() },
  }),
  microsoftLogin: async (code, code_verifier) => {
    const clientId = sessionStorage.getItem('ms_client_id');
    const tenantId = sessionStorage.getItem('ms_tenant_id') || 'common';
    const scope = sessionStorage.getItem('ms_scope') || 'openid profile email User.Read';
    const redirectUri = sessionStorage.getItem('ms_redirect_uri') || getMicrosoftRedirectUri();

    if (!clientId || !code_verifier) {
      throw new Error('Microsoft login session expired. Please try again.');
    }

    const tokenParams = new URLSearchParams({
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier,
      scope,
    });

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange Microsoft authorization code.');
    }

    return api.post('/auth/microsoft/token', {
      accessToken: tokenData.access_token,
    });
  },
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
