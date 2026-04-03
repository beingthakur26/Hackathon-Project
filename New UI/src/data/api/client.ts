import axios from 'axios';
import { API_BASE_URL } from '../../app/config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject auth token from localStorage if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('toxinai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error normalizer
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'Unknown error';
    return Promise.reject(new Error(message));
  }
);
