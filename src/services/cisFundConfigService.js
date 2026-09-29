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
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }
  return data;
};

const domainPath = (fundId, domain) => `/funds/${fundId}/configuration/${domain}`;

export const cisFundConfigService = {
  getSummary: (fundId, asOfDate) => {
    const q = asOfDate ? `?asOfDate=${encodeURIComponent(asOfDate)}` : '';
    return request(`/funds/${fundId}/configuration/summary${q}`);
  },

  listVersions: (fundId, domain) => request(`${domainPath(fundId, domain)}/versions`),
  getCurrent: (fundId, domain) => request(`${domainPath(fundId, domain)}/current`),
  getAsOf: (fundId, domain, asOfDate) =>
    request(`${domainPath(fundId, domain)}/as-of?asOfDate=${encodeURIComponent(asOfDate)}`),
  getById: (fundId, domain, configId) => request(`${domainPath(fundId, domain)}/${configId}`),

  createDraft: (fundId, domain, payload) =>
    request(domainPath(fundId, domain), { method: 'POST', body: JSON.stringify(payload) }),
  updateDraft: (fundId, domain, configId, payload) =>
    request(`${domainPath(fundId, domain)}/${configId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteDraft: (fundId, domain, configId) =>
    request(`${domainPath(fundId, domain)}/${configId}`, { method: 'DELETE' }),
  activate: (fundId, domain, configId) =>
    request(`${domainPath(fundId, domain)}/${configId}/activate`, { method: 'POST', body: '{}' }),

  listReference: {
    assetClasses: () => request('/reference/asset-classes'),
    mandateRuleDimensions: () => request('/reference/mandate-rule-dimensions'),
    mandateLimitTypes: () => request('/reference/mandate-limit-types'),
    mandateLimitUnits: () => request('/reference/mandate-limit-units'),
    dealingCutoffTypes: () => request('/reference/dealing-cutoff-types'),
    roundingMethods: () => request('/reference/rounding-methods'),
    settlementConventions: () => request('/reference/settlement-conventions'),
    valuationFrequencies: () => request('/reference/valuation-frequencies'),
    pricingMethods: () => request('/reference/pricing-methods'),
    publishedPriceTypes: () => request('/reference/published-price-types'),
    feeTypes: () => request('/reference/fee-types'),
    feeCalculationBases: () => request('/reference/fee-calculation-bases'),
  },

  listFeeDefinitions: (managingCompanyId) => {
    const q = managingCompanyId ? `?managingCompanyId=${managingCompanyId}` : '';
    return request(`/fee-definitions${q}`);
  },
  createFeeDefinition: (payload) =>
    request('/fee-definitions', { method: 'POST', body: JSON.stringify(payload) }),

  listServiceProvidersAsOf: (fundId, asOfDate) => {
    const q = asOfDate ? `?asOfDate=${encodeURIComponent(asOfDate)}` : '';
    return request(`/funds/${fundId}/service-providers/as-of${q}`);
  },
  createServiceProviderAssignment: (fundId, payload) =>
    request(`/funds/${fundId}/service-provider-assignments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  endServiceProviderAssignment: (fundId, assignmentId, payload) =>
    request(`/funds/${fundId}/service-provider-assignments/${assignmentId}/end`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const CONFIG_DOMAINS = {
  mandate: 'mandate',
  dealing: 'dealing',
  navPricing: 'nav-pricing',
  fee: 'fees',
  calendar: 'calendar',
};

export default cisFundConfigService;
