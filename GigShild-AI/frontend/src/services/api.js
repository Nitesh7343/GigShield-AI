import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Policy APIs
export const policyAPI = {
  createPolicy: () => api.post('/policy/create'),
  getMyPolicy: () => api.get('/policy/me'),
  getAllPolicies: () => api.get('/policy/all'),
};

// Claims APIs
export const claimsAPI = {
  getMyClaiims: () => api.get('/claims/my'),
};

// Payments APIs
export const paymentsAPI = {
  createPayment: (data) => api.post('/payments/create', data),
  getMyPayments: () => api.get('/payments/my'),
  getPaymentDetails: (paymentId) => api.get(`/payments/${paymentId}`),
  submitWithdrawal: (data) => api.post('/payments/withdrawal/request', data),
  getMyWithdrawalRequests: () => api.get('/payments/withdrawal/my-requests'),
};

// Admin APIs
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: () => api.get('/admin/analytics'),
  getWallets: () => api.get('/admin/wallets'),
  getUsers: () => api.get('/admin/users'),
  getDetailedUsers: () => api.get('/admin/users/detailed'),
  getClaims: () => api.get('/admin/claims/all'),
  getTriggers: (city) => api.get('/admin/triggers', { params: { city } }),
  createTrigger: (data) => api.post('/admin/trigger/create', data),
  createManualPayout: (data) => api.post('/admin/manual-payout', data),
  getWithdrawalRequests: () => api.get('/admin/withdrawal-requests'),
  approveWithdrawal: (requestId) => api.post(`/admin/withdrawal-requests/${requestId}/approve`, {}),
  rejectWithdrawal: (requestId, data) => api.post(`/admin/withdrawal-requests/${requestId}/reject`, data),
  getPool: () => api.get('/admin/pool'),
};

// Weather APIs
export const weatherAPI = {
  getWeatherByCity: (city) => api.get(`/weather/${city}`),
  getAllCitiesWeather: () => api.get('/weather/all/cities'),
};

export default api;
