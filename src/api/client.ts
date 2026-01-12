import axios, { AxiosError } from 'axios';
import { ZodError } from 'zod';
import { API_BASE_URL } from '../config/api';
import { useAuthStore } from '../stores/authStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message: string }>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export interface ApiError {
  message: string;
  status: number;
}

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.message ?? 'Network error',
      status: error.response?.status ?? 500,
    };
  }
  if (error instanceof ZodError) {
    console.error('Zod validation error:', error.issues);
    return {
      message: 'Invalid response from server',
      status: 500,
    };
  }
  console.error('Unknown error:', error);
  return { message: 'Unknown error', status: 500 };
}
