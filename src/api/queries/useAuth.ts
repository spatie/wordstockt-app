import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiClient, getApiError } from '../client';
import {
  LoginResponseSchema,
  AuthUserResponseSchema,
  transformUser,
} from '../../schemas/user.schema';
import { safeParse } from '../../schemas/safeParse';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types';
import { authKeys } from './queryKeys';
import { API_BASE_URL } from '../../config/api';

async function getCurrentPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

async function registerPushTokenWithAuthToken(
  authToken: string
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  if (!Device.isDevice) {
    return;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });

  await fetch(`${API_BASE_URL}/auth/push-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      token: pushToken.data,
      device_name: Device.deviceName ?? undefined,
    }),
  });
}

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (params: LoginParams) => {
      const { data } = await apiClient.post('/auth/login', params);
      const validated = safeParse(LoginResponseSchema, data, 'useLogin');
      return {
        user: transformUser(validated.data),
        token: validated.token,
      };
    },
    onSuccess: async ({ user, token }) => {
      setAuth(user, token);
      await registerPushTokenWithAuthToken(token).catch(() => {});
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (params: RegisterParams) => {
      const { data } = await apiClient.post('/auth/register', params);
      const validated = safeParse(LoginResponseSchema, data, 'useRegister');
      return {
        user: transformUser(validated.data),
        token: validated.token,
      };
    },
    onSuccess: async ({ user, token }) => {
      setAuth(user, token);
      await registerPushTokenWithAuthToken(token).catch(() => {});
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const setLoggingOut = useAuthStore((s) => s.setLoggingOut);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      setLoggingOut(true);

      // Get push token with timeout to prevent hanging
      let pushToken: string | null = null;
      try {
        const tokenPromise = getCurrentPushToken();
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 3000)
        );
        pushToken = await Promise.race([tokenPromise, timeoutPromise]);
      } catch {
        // Ignore push token errors during logout
      }

      await apiClient.post('/auth/logout', {
        push_token: pushToken,
      });
    },
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async (): Promise<User> => {
      const { data } = await apiClient.get('/auth/user');
      const validated = safeParse(
        AuthUserResponseSchema,
        data,
        'useCurrentUser'
      );
      const user = transformUser(validated.data);
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

interface UpdateProfileParams {
  username?: string;
  email?: string;
  avatar?: string | null;
  avatar_color?: string | null;
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (params: UpdateProfileParams) => {
      const { data } = await apiClient.put('/auth/user', params);
      const validated = safeParse(
        AuthUserResponseSchema,
        data,
        'useUpdateProfile'
      );
      return transformUser(validated.data);
    },
    onSuccess: (user) => {
      setUser(user);
    },
  });
}

interface RegisterPushTokenParams {
  token: string;
  deviceName?: string;
}

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: async ({ token, deviceName }: RegisterPushTokenParams) => {
      await apiClient.post('/auth/push-token', {
        token,
        device_name: deviceName,
      });
    },
  });
}

interface ChangePasswordParams {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (params: ChangePasswordParams) => {
      await apiClient.post('/auth/change-password', params);
    },
  });
}

interface ForgotPasswordParams {
  identifier: string;
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (params: ForgotPasswordParams) => {
      const { data } = await apiClient.post('/auth/forgot-password', params);
      return data;
    },
  });
}

interface VerifyEmailResponse {
  message: string;
  verified: boolean;
}

export function useVerifyEmail() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string): Promise<VerifyEmailResponse> => {
      const { data } = await apiClient.get(url);
      return data;
    },
    onSuccess: (data) => {
      if (data.verified && user) {
        setUser({
          ...user,
          emailVerifiedAt: new Date().toISOString(),
        });
        queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      }
    },
  });
}

interface ResendVerificationResponse {
  message: string;
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (): Promise<ResendVerificationResponse> => {
      const { data } = await apiClient.post('/auth/resend-verification');
      return data;
    },
  });
}
