import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const CIS_BASE = `${API_BASE_URL}/cis`;

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
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    authService.logout?.();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
};

export const cisInvestorService = {
  listInvestors: () => request('/investors'),
  getInvestor: (id) => request(`/investors/${id}`),
  createInvestor: (payload) => request('/investors', { method: 'POST', body: JSON.stringify(payload) }),
  updateInvestor: (id, payload) => request(`/investors/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateIndividual: (id, payload) => request(`/investors/${id}/individual`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateOrganisation: (id, payload) => request(`/investors/${id}/organisation`, { method: 'PUT', body: JSON.stringify(payload) }),

  listIdentifierTypes: () => request('/investor-identifier-types'),
  listIdentifiers: (id) => request(`/investors/${id}/identifiers`),
  getIdentifier: (investorId, identifierId) => request(`/investors/${investorId}/identifiers/${identifierId}`),
  createIdentifier: (id, payload) => request(`/investors/${id}/identifiers`, { method: 'POST', body: JSON.stringify(payload) }),

  listContacts: (id) => request(`/investors/${id}/contacts`),
  createContact: (id, payload) => request(`/investors/${id}/contacts`, { method: 'POST', body: JSON.stringify(payload) }),

  listAddresses: (id) => request(`/investors/${id}/addresses`),
  createAddress: (id, payload) => request(`/investors/${id}/addresses`, { method: 'POST', body: JSON.stringify(payload) }),

  listKycReviews: (id) => request(`/investors/${id}/kyc-reviews`),
  createKycReview: (id, payload) => request(`/investors/${id}/kyc-reviews`, { method: 'POST', body: JSON.stringify(payload) }),
  decideKycReview: (id, reviewId, payload) =>
    request(`/investors/${id}/kyc-reviews/${reviewId}/decide`, { method: 'POST', body: JSON.stringify(payload) }),

  listDocuments: (id) => request(`/investors/${id}/documents`),
  createDocument: (id, payload) => request(`/investors/${id}/documents`, { method: 'POST', body: JSON.stringify(payload) }),

  listBankAccounts: (id) => request(`/investors/${id}/bank-accounts`),
  getBankAccount: (investorId, accountId) => request(`/investors/${investorId}/bank-accounts/${accountId}`),
  createBankAccount: (id, payload) => request(`/investors/${id}/bank-accounts`, { method: 'POST', body: JSON.stringify(payload) }),
  verifyBankAccount: (investorId, accountId) =>
    request(`/investors/${investorId}/bank-accounts/${accountId}/verify`, { method: 'POST', body: JSON.stringify({}) }),

  listInvestorFolios: (id) => request(`/investors/${id}/folios`),
  getFolio: (folioId) => request(`/folios/${folioId}`),
  createFolio: (payload) => request('/folios', { method: 'POST', body: JSON.stringify(payload) }),
  addHolder: (folioId, payload) => request(`/folios/${folioId}/holders`, { method: 'POST', body: JSON.stringify(payload) }),
  listLedger: (folioId) => request(`/folios/${folioId}/unit-ledger`),
  getUnitBalance: (folioId, asOfDate) => {
    const query = asOfDate ? `?asOfDate=${encodeURIComponent(asOfDate)}` : '';
    return request(`/folios/${folioId}/unit-balance${query}`);
  },
  listLedgerEventTypes: () => request('/unit-ledger-event-types'),
};

export default cisInvestorService;
