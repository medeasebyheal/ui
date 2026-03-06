import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
console.log(API_BASE);
export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

let pendingRequests = 0;
let loaderCallback = null;

export function setLoaderCallback(cb) {
  loaderCallback = cb;
}

function notifyLoader(show) {
  if (typeof loaderCallback === 'function') loaderCallback(show);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // FormData must be sent as multipart; let browser set Content-Type with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  if (config.skipLoader !== true) {
    pendingRequests += 1;
    if (pendingRequests === 1) notifyLoader(true);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config?.skipLoader !== true) {
      pendingRequests = Math.max(0, pendingRequests - 1);
      if (pendingRequests === 0) notifyLoader(false);
    }
    return response;
  },
  (err) => {
    if (err.config?.skipLoader !== true) {
      pendingRequests = Math.max(0, pendingRequests - 1);
      if (pendingRequests === 0) notifyLoader(false);
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-change'));
    }
    return Promise.reject(err);
  }
);

export default api;
