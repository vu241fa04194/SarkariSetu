import axios from 'axios';

// Base API URL pointing to the Express backend
const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

export const API_BASE_URL = String(RAW_API_URL).trim().replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Automatically attach JWT token if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sarkarisetu_token');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Secure error handling and session expiration detection
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred.';

    if (error.response?.status === 401) {
      if (localStorage.getItem('sarkarisetu_token')) {
        localStorage.removeItem('sarkarisetu_token');
        window.dispatchEvent(new CustomEvent('sarkarisetu:session_expired'));
      }
      message =
        error.response?.data?.message ||
        'Your session has expired. Please sign in again.';
    } else if (error.response?.status === 403) {
      message = error.response?.data?.message || 'Access forbidden: Insufficient permissions.';
    } else if (error.response?.status === 429) {
      message = error.response?.data?.message || 'Too many requests. Please wait a moment and try again.';
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timeout: The server took too long to respond.';
    } else if (!error.response) {
      message = 'Network error: Unable to connect to the SarkariSetu backend.';
    }

    return Promise.reject(new Error(message));
  }
);

// ==========================================
// PHASE 1 REST APIs: Schemes & Categories
// ==========================================

export const getSchemes = async (params = {}) => {
  const response = await apiClient.get('/schemes', { params });
  return response.data;
};

export const getSchemeById = async (id) => {
  const response = await apiClient.get(`/schemes/${id}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await apiClient.get('/categories');
  return response.data;
};

export const getFilterOptions = async () => {
  const response = await apiClient.get('/schemes/meta/filters');
  return response.data;
};

export const createScheme = async (schemeData) => {
  const response = await apiClient.post('/schemes', schemeData);
  return response.data;
};

export const updateScheme = async (id, schemeData) => {
  const response = await apiClient.put(`/schemes/${id}`, schemeData);
  return response.data;
};

export const deleteScheme = async (id) => {
  const response = await apiClient.delete(`/schemes/${id}`);
  return response.data;
};

// ==========================================
// PHASE 2 REST APIs: Auth, Profile & Saved
// ==========================================

export const registerUser = async (userData) => {
  const response = await apiClient.post('/users/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/users/login', credentials);
  return response.data;
};

export const logoutUser = async () => {
  try {
    const response = await apiClient.post('/users/logout');
    return response.data;
  } catch {
    return { success: true };
  }
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/users/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await apiClient.post(`/users/reset-password/${token}`, { password });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await apiClient.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await apiClient.put('/users/profile', profileData);
  return response.data;
};

export const getSavedSchemes = async () => {
  const response = await apiClient.get('/users/saved-schemes');
  return response.data;
};

export const saveScheme = async (schemeId) => {
  const response = await apiClient.post(`/users/saved-schemes/${schemeId}`);
  return response.data;
};

export const removeSavedScheme = async (schemeId) => {
  const response = await apiClient.delete(`/users/saved-schemes/${schemeId}`);
  return response.data;
};

export const getRecentlyViewedSchemes = async () => {
  const response = await apiClient.get('/users/recently-viewed');
  return response.data;
};

// ==========================================
// PHASE 2 & 5: Eligibility & Recommendations
// ==========================================

export const checkEligibility = async (profile, schemeId = null) => {
  const payload = { profile };
  if (schemeId) payload.schemeId = schemeId;
  const response = await apiClient.post('/eligibility/check', payload);
  return response.data;
};

export const getRecommendations = async () => {
  const response = await apiClient.get('/eligibility/recommendations');
  return response.data;
};

// ==========================================
// PHASE 3: Views, Tracker & Notifications
// ==========================================

export const trackSchemeView = async (schemeId) => {
  const response = await apiClient.post(`/schemes/${schemeId}/view`);
  return response.data;
};

export const getMyApplications = async (params = {}) => {
  const response = await apiClient.get('/applications', { params });
  return response.data;
};

export const trackApplication = async (applicationData) => {
  const response = await apiClient.post('/applications', applicationData);
  return response.data;
};

export const updateApplication = async (id, applicationData) => {
  const response = await apiClient.put(`/applications/${id}`, applicationData);
  return response.data;
};

export const deleteApplication = async (id) => {
  const response = await apiClient.delete(`/applications/${id}`);
  return response.data;
};

export const getMyNotifications = async () => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await apiClient.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await apiClient.put('/notifications/read-all');
  return response.data;
};

// ==========================================
// PHASE 7: Document Checklists
// ==========================================

export const getSchemeChecklist = async (schemeId) => {
  const response = await apiClient.get(`/checklists/scheme/${schemeId}`);
  return response.data;
};

export const saveSchemeChecklist = async (schemeId, data) => {
  const response = await apiClient.post(`/checklists/scheme/${schemeId}`, data);
  return response.data;
};

export const toggleChecklistItem = async (schemeId, data) => {
  const response = await apiClient.patch(`/checklists/scheme/${schemeId}/item`, data);
  return response.data;
};

export const resetSchemeChecklist = async (schemeId) => {
  const response = await apiClient.delete(`/checklists/scheme/${schemeId}`);
  return response.data;
};

export const getMyChecklists = async () => {
  const response = await apiClient.get('/checklists');
  return response.data;
};

// ==========================================
// PHASE 3 & Security: Admin Operations
// ==========================================

export const getAdminStats = async () => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

export const getAdminAnalytics = async () => {
  const response = await apiClient.get('/admin/analytics');
  return response.data;
};

export const getAdminUsers = async (params = {}) => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

export const getAdminApplications = async () => {
  const response = await apiClient.get('/admin/applications');
  return response.data;
};

export const updateSchemeVerification = async (id, verificationStatus) => {
  const response = await apiClient.put(`/admin/schemes/${id}/verification`, {
    verificationStatus,
  });
  return response.data;
};

export const updateSchemeStatus = async (id, status) => {
  const response = await apiClient.put(`/admin/schemes/${id}/status`, {
    status,
  });
  return response.data;
};

export const getAdminAuditLogs = async (params = {}) => {
  const response = await apiClient.get('/admin/audit-logs', { params });
  return response.data;
};

export default apiClient;
