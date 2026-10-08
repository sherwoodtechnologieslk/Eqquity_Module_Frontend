import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const CIS_BASE = `${API_BASE_URL}/cis`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    authService.logout?.();
    throw new Error('No token, authorization denied');
  }

  const response = await fetch(`${CIS_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    authService.logout?.();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }
  return data;
};

export const cisFundService = {
  listManagingCompanies: () => request('/managing-companies'),
  listSchemeStructures: () => request('/scheme-structures'),

  listFundCategories: (managingCompanyId) => {
    const q = managingCompanyId ? `?managingCompanyId=${managingCompanyId}` : '';
    return request(`/fund-categories${q}`);
  },
  createFundCategory: (payload) =>
    request('/fund-categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateFundCategory: (id, payload) =>
    request(`/fund-categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteFundCategory: (id) => request(`/fund-categories/${id}`, { method: 'DELETE' }),

  listServiceProviders: (params = {}) => {
    const search = new URLSearchParams();
    if (params.managingCompanyId) search.set('managingCompanyId', params.managingCompanyId);
    const q = search.toString() ? `?${search.toString()}` : '';
    return request(`/service-providers${q}`);
  },
  createServiceProvider: (payload) =>
    request('/service-providers', { method: 'POST', body: JSON.stringify(payload) }),
  updateServiceProvider: (id, payload) =>
    request(`/service-providers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  listFunds: (managingCompanyId) => {
    const q = managingCompanyId ? `?managingCompanyId=${managingCompanyId}` : '';
    return request(`/funds${q}`);
  },
  getFund: (id) => request(`/funds/${id}`),
  listFundServiceProviders: (fundId) => request(`/funds/${fundId}/service-providers`),
  createFund: (payload) => request('/funds', { method: 'POST', body: JSON.stringify(payload) }),
  updateFund: (id, payload) =>
    request(`/funds/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteFund: (id) => request(`/funds/${id}`, { method: 'DELETE' }),
};

export default cisFundService;
