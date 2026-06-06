import axios, { isAxiosError, AxiosError } from 'axios';
import { ZodError } from 'zod';
import { API_BASE_URL } from '../config/api';
import { useAuthStore } from '../stores/authStore';
import { queryClient } from './queryClient';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
      // Drop cached authed data so a forced logout can't leave stale
      // game/user data behind (mirrors what useLogout does explicitly).
      queryClient.clear();
    }
    return Promise.reject(error);
  }
);

export interface ApiError {
  message: string;
  status: number;
}

export function isTimeoutError(error: unknown): boolean {
  return isAxiosError(error) && error.code === 'ECONNABORTED';
}

export function getApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    let message = data?.message ?? 'Network error';

    // Extract first validation error if available
    if (data?.errors && typeof data.errors === 'object') {
      const firstField = Object.keys(data.errors)[0];
      if (firstField && Array.isArray(data.errors[firstField])) {
        message = data.errors[firstField][0];
      }
    }

    return {
      message,
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
