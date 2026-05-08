import axios from 'axios';
import { clearSession } from '../context/AuthContext';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('qz_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const url    = err.config?.url || '';
    const status = err.response?.status;
    const isAuthEndpoint = /\/(login|register|auth\/me)/.test(url);

    // Only force-logout on 401 from real PROTECTED routes (not auth endpoints).
    // This is the ONLY place where we clear the session automatically.
    if (status === 401 && !isAuthEndpoint) {
      console.warn('[Axios] 401 from protected route:', url);
      clearSession();
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;