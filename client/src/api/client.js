import axios from 'axios';

function resolveBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();

  if (configured?.startsWith('http')) {
    return configured.replace(/\/$/, '');
  }

  if (import.meta.env.DEV) {
    return '/api';
  }

  return '/api';
}

export const api = axios.create({
  baseURL: resolveBaseUrl()
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trend_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('trend_token');
      localStorage.removeItem('trend_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
