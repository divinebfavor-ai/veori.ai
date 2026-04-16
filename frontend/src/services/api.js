import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE, withCredentials: true });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('vt');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vt');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login    = (d) => api.post('/auth/login', d);
export const register = (d) => api.post('/auth/register', d);
export const getMe    = ()  => api.get('/auth/me');

// Leads
export const getLeads      = (p) => api.get('/leads', { params: p });
export const getLead       = (id) => api.get(`/leads/${id}`);
export const createLead    = (d)  => api.post('/leads', d);
export const bulkImport    = (d)  => api.post('/leads/bulk', d);
export const updateLead    = (id, d) => api.put(`/leads/${id}`, d);
export const deleteLead    = (id)    => api.delete(`/leads/${id}`);
export const researchLead  = (id)    => api.get(`/leads/${id}/research`);

// Calls
export const getCalls      = (p)  => api.get('/calls', { params: p });
export const getLiveCalls  = ()   => api.get('/calls/live');
export const initiateCall  = (d)  => api.post('/calls/initiate', d);
export const takeoverCall  = (d)  => api.post('/calls/takeover', d);
export const returnToAI    = (d)  => api.post('/calls/return-to-ai', d);

// Campaigns
export const getCampaigns      = ()   => api.get('/campaigns');
export const createCampaign    = (d)  => api.post('/campaigns', d);
export const updateCampaign    = (id, d) => api.put(`/campaigns/${id}`, d);
export const startCampaign     = (id) => api.post(`/campaigns/${id}/start`);
export const pauseCampaign     = (id) => api.post(`/campaigns/${id}/pause`);
export const stopCampaign      = (id) => api.post(`/campaigns/${id}/stop`);
export const getCampaignStats  = (id) => api.get(`/campaigns/${id}/stats`);

// Phone Numbers
export const getPhoneNumbers   = ()   => api.get('/phone-numbers');
export const getPhoneHealth    = ()   => api.get('/phone-numbers/health');
export const addPhoneNumber    = (d)  => api.post('/phone-numbers', d);
export const updatePhoneNumber = (id, d) => api.put(`/phone-numbers/${id}`, d);
export const deletePhoneNumber = (id) => api.delete(`/phone-numbers/${id}`);

// Deals
export const getDeals   = ()     => api.get('/deals');
export const getDeal    = (id)   => api.get(`/deals/${id}`);
export const createDeal = (d)    => api.post('/deals', d);
export const updateDeal = (id,d) => api.put(`/deals/${id}`, d);

// Buyers
export const getBuyers   = ()     => api.get('/buyers');
export const createBuyer = (d)    => api.post('/buyers', d);
export const updateBuyer = (id,d) => api.put(`/buyers/${id}`, d);
export const deleteBuyer = (id)   => api.delete(`/buyers/${id}`);

// Analytics
export const getDashboardStats = () => api.get('/analytics/dashboard');

// Assistant
export const assistantChat = (messages) => api.post('/assistant/chat', { messages });
export const ariaChat      = (messages) => api.post('/assistant/aria',  { messages });

export default api;
