import axios from 'axios';

// Configure base URL for Django backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Warn in development if using fallback URL
if (!API_BASE_URL) {
  console.error('❌ VITE_API_BASE_URL not set. Please create a .env file with this variable.');
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

// ─── Shared param helper ────────────────────────────────────────────────────
// Strips empty-string, null, and undefined values so they never reach the URL.
const buildParams = (params: Record<string, any>): Record<string, any> =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

// ─── Dashboard APIs ──────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/admin/dashboard/stats/');

// User Management APIs
// User Management APIs
export const getUsers = () => api.get('/admin/users/');
export const createUser = (userData: any) => api.post('/admin/users/', userData);
export const updateUser = (userId: number | string, userData: any) => api.put(`/admin/users/${userId}/`, userData);
export const deleteUser = (userId: number | string) => api.delete(`/admin/users/${userId}/`);

// Processing Units APIs
export const getProcessingUnits = () => api.get('/admin/processing-units/');
export const createProcessingUnit = (unitData: any) => api.post('/admin/processing-units/', unitData);
export const updateProcessingUnit = (unitId: number | string, unitData: any) => api.put(`/admin/processing-units/${unitId}/`, unitData);
export const deleteProcessingUnit = (unitId: number | string) => api.delete(`/admin/processing-units/${unitId}/`);

// Shops APIs
export const getShops = () => api.get('/admin/shops/');
export const createShop = (shopData: any) => api.post('/admin/shops/', shopData);
export const updateShop = (shopId: number | string, shopData: any) => api.put(`/admin/shops/${shopId}/`, shopData);
export const deleteShop = (shopId: number | string) => api.delete(`/admin/shops/${shopId}/`);

// Analytics APIs
export const getAnalytics = (period = '30d') => api.get(`/admin/analytics/overview/?period=${period}`);
export const getDailyStats = (days = 30) => api.get(`/admin/analytics/daily_stats/?days=${days}`);

// Custom Reporting APIs
export const getCustomReport = (params: Record<string, string>) => {
  // Filter out empty values
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
  );
  const queryParams = new URLSearchParams(filteredParams);
  const queryString = queryParams.toString();
  return api.get(`/admin/analytics/custom_report/${queryString ? `?${queryString}` : ''}`);
};

export const exportReportExcel = (params: Record<string, string>) => {
  // Filter out empty values
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
  );
  const queryParams = new URLSearchParams(filteredParams);
  const queryString = queryParams.toString();
  return api.get(`/admin/analytics/export_excel/${queryString ? `?${queryString}` : ''}`, {
    responseType: 'blob'
  });
};

// Supply Chain Stats
export const getSupplyChainStats = () => api.get('/admin/dashboard/supply_chain_stats/');

// Map Locations for Supply Chain Map
export const getMapLocations = () => api.get('/admin/dashboard/map_locations/');

// Animal Traceability APIs (Full CRUD)
export const getAnimals = (params?: { lifecycle_status?: string; slaughtered?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.lifecycle_status) queryParams.append('lifecycle_status', params.lifecycle_status);
  if (params?.slaughtered) queryParams.append('slaughtered', params.slaughtered);
  const queryString = queryParams.toString();
  return api.get(`/admin/animals/${queryString ? `?${queryString}` : ''}`);
};
export const getAnimal = (id: number | string) => api.get(`/admin/animals/${id}/`);
export const createAnimal = (data: any) => api.post('/admin/animals/', data);
export const updateAnimal = (id: number | string, data: any) => api.put(`/admin/animals/${id}/`, data);
export const deleteAnimal = (id: number | string) => api.delete(`/admin/animals/${id}/`);

// Product Traceability APIs (Full CRUD)
export const getProducts = (params?: { product_type?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.product_type) queryParams.append('product_type', params.product_type);
  const queryString = queryParams.toString();
  return api.get(`/admin/products/${queryString ? `?${queryString}` : ''}`);
};
export const getProduct = (id: number | string) => api.get(`/admin/products/${id}/`);
export const createProduct = (data: any) => api.post('/admin/products/', data);
export const updateProduct = (id: number | string, data: any) => api.put(`/admin/products/${id}/`, data);
export const deleteProduct = (id: number | string) => api.delete(`/admin/products/${id}/`);

// Slaughter Parts APIs (Full CRUD)
export const getSlaughterParts = (params?: { animal_id?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.animal_id) queryParams.append('animal_id', params.animal_id.toString());
  const queryString = queryParams.toString();
  return api.get(`/admin/slaughter-parts/${queryString ? `?${queryString}` : ''}`);
};
export const getSlaughterPart = (id: number | string) => api.get(`/admin/slaughter-parts/${id}/`);
export const createSlaughterPart = (data: any) => api.post('/admin/slaughter-parts/', data);
export const updateSlaughterPart = (id: number | string, data: any) => api.put(`/admin/slaughter-parts/${id}/`, data);
export const deleteSlaughterPart = (id: number | string) => api.delete(`/admin/slaughter-parts/${id}/`);

// Abbatoirs API (for selection dropdowns)
export const getAbbatoirs = () => api.get('/admin/abbatoirs/');

// Compliance & Certifications APIs
export const getComplianceAudits = () => api.get('/admin/compliance/');
export const getComplianceAudit = (id: number | string) => api.get(`/admin/compliance/${id}/`);
export const createComplianceAudit = (data: any) => api.post('/admin/compliance/', data);
export const updateComplianceAudit = (id: number | string, data: any) => api.put(`/admin/compliance/${id}/`, data);

export const getCertifications = () => api.get('/admin/certifications/');
export const createCertification = (data: any) => api.post('/admin/certifications/', data);
export const updateCertification = (id: number | string, data: any) => api.put(`/admin/certifications/${id}/`, data);

// Approval Workflows & Registrations APIs
export const getRegistrationApplications = () => api.get('/admin/registrations/');
export const getRegistrationApplication = (id: number | string) => api.get(`/admin/registrations/${id}/`);
export const approveApplication = (id: number | string) => api.post(`/admin/registrations/${id}/approve/`);
export const rejectApplication = (id: number | string, reason: string) => api.post(`/admin/registrations/${id}/reject/`, { reason });

export const getApprovalWorkflows = () => api.get('/admin/workflows/');
export const createApprovalWorkflow = (data: any) => api.post('/admin/workflows/', data);
export const updateApprovalWorkflow = (id: number | string, data: any) => api.put(`/admin/workflows/${id}/`, data);

// ─── Report API Functions ────────────────────────────────────────────────────
//
// Each function maps directly to one of the 8 business reports.  Params are
// typed as Record<string,any> so callers can pass any subset of filter keys;
// buildParams() strips blank/null values before they hit the URL.

/**
 * Report 1 — Sales per Shop
 * Endpoint: GET /sales/
 * Supported params: shop_id, start_date, end_date, payment_method
 * Response: paginated { count, results: Sale[] } or Sale[]
 */
export const getSalesReport = (params: Record<string, any>, signal?: AbortSignal) =>
  api.get('/sales/', { params: buildParams(params), signal });

/**
 * Report 2 — Product Production Report
 * Endpoint: GET /admin/products/
 * Supported params: processing_unit_id, start_date, end_date, product_type, category
 */
export const getProductionReport = (params: Record<string, any>, signal?: AbortSignal) =>
  api.get('/admin/products/', { params: buildParams(params), signal });

/**
 * Report 3 — Product Issue Report
 * Endpoint: GET /admin/products/ (client-side filter: transferred_to IS NOT NULL)
 * Also fetches GET /receipts/ in parallel for received-weight reconciliation.
 * Supported params: processing_unit_id, shop_id, start_date, end_date
 */
export const getProductIssueReport = (params: Record<string, any>, signal?: AbortSignal) =>
  api.get('/admin/products/', { params: buildParams(params), signal });

/**
 * Report 4 — Animals Report
 * Endpoint: GET /admin/animals/
 * Supported params: species, slaughtered, abbatoir_id, start_date, end_date
 * Note: lifecycle_status is a computed property — filtered client-side.
 */
export const getAnimalsReport = (params: Record<string, any>, signal?: AbortSignal) =>
  api.get('/admin/animals/', { params: buildParams(params), signal });

/**
 * Report 5 — Slaughter Parts Report
 * Endpoint: GET /admin/slaughter-parts/
 * Supported params: part_type, processing_unit_id, start_date, end_date
 */
export const getSlaughterPartsReport = (params: Record<string, any>, signal?: AbortSignal) =>
  api.get('/admin/slaughter-parts/', { params: buildParams(params), signal });

/**
 * Report 6 — Product Stock (Shop)
 * Endpoint: GET /inventory/
 * NOTE: InventoryViewSet is not yet implemented on the backend (returns 404).
 *       The caller must catch 404 and display a backend-config error.
 * Supported params: shop_id
 */
export const getShopStockReport = (params: Record<string, any>, signal?: AbortSignal) =>
  api.get('/inventory/', { params: buildParams(params), signal });

/**
 * Report 7 — Product Stock (Container / In-Transit)
 * Endpoint: GET /admin/products/
 * Client-side filter: transferred_to IS NOT NULL AND received_at IS NULL
 * Supported params: processing_unit_id, shop_id, start_date, end_date
 */
export const getInTransitStockReport = (params: Record<string, any>, signal?: AbortSignal) =>
  api.get('/admin/products/', { params: buildParams(params), signal });

/**
 * Report 8 — Product Stock (Processing Unit)
 * Endpoint: GET /admin/products/
 * Supported params: processing_unit_id, start_date, end_date, product_type
 */
export const getPUStockReport = (params: Record<string, any>, signal?: AbortSignal) =>
  api.get('/admin/products/', { params: buildParams(params), signal });

// ─── Supporting endpoints used by multiple reports ───────────────────────────

/**
 * Fetch receipt records for a shop (used in Product Issue reconciliation).
 * Endpoint: GET /receipts/
 * Supported params: shop_id, start_date, end_date
 */
export const getReceiptsList = (params: Record<string, any>, signal?: AbortSignal) =>
  api.get('/receipts/', { params: buildParams(params), signal });

/**
 * Fetch all product categories (used as a filter option in production report).
 * Endpoint: GET /product-categories/
 */
export const getProductCategories = () => api.get('/product-categories/');

export default api;