import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const governanceAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

governanceAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const governanceService = {
  listPermissions: () => governanceAPI.get('/governance/permissions'),
  listAdmins: () => governanceAPI.get('/governance/admins'),
  createAdmin: (payload) => governanceAPI.post('/governance/admins', payload),
  updateAdminPermissions: (adminId, permission_ids) =>
    governanceAPI.put(`/governance/admins/${adminId}/permissions`, { permission_ids }),
  revokeAdmin: (adminId) => governanceAPI.patch(`/governance/admins/${adminId}/revoke`),
  reactivateAdmin: (adminId, permission_ids) =>
    governanceAPI.patch(`/governance/admins/${adminId}/reactivate`, { permission_ids }),
  listUserRequests: () => governanceAPI.get('/governance/user-requests'),
  getUserRequest: (id) => governanceAPI.get(`/governance/user-requests/${id}`),
  createUserRequest: (payload) => governanceAPI.post('/governance/user-requests', payload),
  listCompanyUsers: () => governanceAPI.get('/governance/users'),
  updateUserPermissions: (userId, permission_ids) =>
    governanceAPI.put(`/governance/users/${userId}/permissions`, { permission_ids }),
  approveUserRequest: (id) => governanceAPI.post(`/governance/user-requests/${id}/approve`),
  rejectUserRequest: (id, rejection_reason) =>
    governanceAPI.post(`/governance/user-requests/${id}/reject`, { rejection_reason }),
  listAdminRequests: () => governanceAPI.get('/governance/admin-requests'),
  approveAdminRequest: (id) => governanceAPI.post(`/governance/admin-requests/${id}/approve`),
  rejectAdminRequest: (id, rejection_reason) =>
    governanceAPI.post(`/governance/admin-requests/${id}/reject`, { rejection_reason }),
  listAuditEvents: (limit = 100) =>
    governanceAPI.get('/governance/audit-events', { params: { limit } }),
  listBusinessApprovalEntities: () => governanceAPI.get('/governance/business-approval-entities'),
  listBusinessApprovalRequests: (params = {}) =>
    governanceAPI.get('/governance/business-requests', { params }),
  createBusinessApprovalRequest: (payload) =>
    governanceAPI.post('/governance/business-requests', payload),
  approveBusinessApprovalRequest: (id) =>
    governanceAPI.post(`/governance/business-requests/${id}/approve`),
  rejectBusinessApprovalRequest: (id, rejection_reason) =>
    governanceAPI.post(`/governance/business-requests/${id}/reject`, { rejection_reason }),
};

export default governanceService;
