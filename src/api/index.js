import api from './client';

// Fetch years list
export const fetchYears = () =>
  api.get('/content/years').then(res => res.data);

// Fetch modules for a given year ID
export const fetchModulesByYear = (yearId) =>
  api.get(`/content/years/${yearId}/modules`).then(res => res.data);

// Fetch packages (used on checkout)
export const fetchPackages = () =>
  api.get('/packages').then(res => res.data);

// Fetch payments for student
export const fetchPayments = () =>
  api.get('/payments').then(res => res.data);

// Admin dashboard data (pending payments etc.)
export const fetchAdminDashboard = () =>
  api.get('/admin/dashboard').then(res => res.data);

// Simple ping endpoint for warm‑up
export const pingServer = () =>
  api.get('/ping').then(res => res.data);
