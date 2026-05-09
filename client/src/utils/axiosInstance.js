import axios from 'axios';
import { clearSession } from '../context/AuthContext';

const api = axios.create({
  baseURL: 'https://quezzy-code.vercel.app/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('qz_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const status = err.response?.status;

    const isAuthEndpoint = /\/(login|register|auth\/me)/.test(url);

    if (status === 401 && !isAuthEndpoint) {
      clearSession();
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;