import axios from 'axios';

// Configure base URL for Django backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Warn in development if using fallback URL
if (!API_BASE_URL) {
  console.error('❌ REACT_APP_API_BASE_URL not set. Please create a .env file with this variable.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('authToken', access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Dashboard APIs
export const getDashboardStats = () => api.get('/admin/dashboard/stats/');

// User Management APIs
export const getUsers = () => api.get('/admin/users/');
export const createUser = (userData) => api.post('/admin/users/', userData);
export const updateUser = (userId, userData) => api.put(`/admin/users/${userId}/`, userData);
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}/`);

// Processing Units APIs
export const getProcessingUnits = () => api.get('/admin/processing-units/');
export const createProcessingUnit = (unitData) => api.post('/admin/processing-units/', unitData);
export const updateProcessingUnit = (unitId, unitData) => api.put(`/admin/processing-units/${unitId}/`, unitData);
export const deleteProcessingUnit = (unitId) => api.delete(`/admin/processing-units/${unitId}/`);

// Shops APIs
export const getShops = () => api.get('/admin/shops/');
export const createShop = (shopData) => api.post('/admin/shops/', shopData);
export const updateShop = (shopId, shopData) => api.put(`/admin/shops/${shopId}/`, shopData);
export const deleteShop = (shopId) => api.delete(`/admin/shops/${shopId}/`);

// Analytics APIs
export const getAnalytics = (period = '30d') => api.get(`/admin/analytics/overview/?period=${period}`);
export const getDailyStats = (days = 30) => api.get(`/admin/analytics/daily_stats/?days=${days}`);

export default api;