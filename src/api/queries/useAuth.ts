import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiClient } from '../client';
import {
  LoginResponseSchema,
  AuthUserResponseSchema,
  transformUser,
} from '../../schemas/user.schema';
import { safeParse } from '../../schemas/safeParse';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types';
import { authKeys, gameKeys, userKeys, friendKeys } from './queryKeys';
import { API_BASE_URL } from '../../config/api';
import type { PickedAvatar } from '../../utils/avatarImage';
import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';

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

export function useGuestLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/auth/guest');
      const validated = safeParse(LoginResponseSchema, data, 'useGuestLogin');
      return {
        user: transformUser(validated.data),
        token: validated.token,
      };
    },
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      // Skip push token registration for guests
    },
  });
}

interface ConvertGuestParams {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export function useConvertGuest() {
  const setUser = useAuthStore((s) => s.setUser);
  const token = useAuthStore((s) => s.token);

  return useMutation({
    mutationFn: async (params: ConvertGuestParams) => {
      const { data } = await apiClient.post('/auth/convert-guest', params);
      const validated = safeParse(
        AuthUserResponseSchema,
        data,
        'useConvertGuest'
      );
      return transformUser(validated.data);
    },
    onSuccess: async (user) => {
      setUser(user);
      // Register push token after conversion
      if (token) {
        await registerPushTokenWithAuthToken(token).catch(() => {});
      }
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const setLoggingOut = useAuthStore((s) => s.setLoggingOut);
  const queryClient = useQueryClient();

  return useMutation({
    onMutate: () => {
      setLoggingOut(true);
    },
    mutationFn: async () => {
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

  const query = useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async (): Promise<User> => {
      const { data } = await apiClient.get('/auth/user');
      const validated = safeParse(
        AuthUserResponseSchema,
        data,
        'useCurrentUser'
      );
      return transformUser(validated.data);
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const user = query.data;

  // Sync the fetched user into the auth store as a side effect, but only when
  // the user data actually changed to prevent unnecessary re-renders.
  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = useAuthStore.getState().user;
    const hasChanged =
      !currentUser ||
      currentUser.ulid !== user.ulid ||
      currentUser.username !== user.username ||
      currentUser.email !== user.email ||
      currentUser.isGuest !== user.isGuest ||
      currentUser.emailVerifiedAt !== user.emailVerifiedAt ||
      currentUser.avatar !== user.avatar ||
      currentUser.avatarColor !== user.avatarColor;

    if (hasChanged) {
      setUser(user);
    }
  }, [user, setUser]);

  return query;
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

function parseJsonSafely(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function getUploadErrorMessage(payload: unknown): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof (payload as { message: unknown }).message === 'string'
  ) {
    return (payload as { message: string }).message;
  }
  return 'Could not upload your photo.';
}

// The current user's avatar is embedded in cached game and user data, not just
// the auth store, so refresh those surfaces whenever the avatar changes.
function invalidateAvatarSurfaces(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: gameKeys.all });
  queryClient.invalidateQueries({ queryKey: userKeys.all });
  queryClient.invalidateQueries({ queryKey: friendKeys.all });
  queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
}

export function useUpdateAvatar() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: PickedAvatar) => {
      const token = useAuthStore.getState().token;
      const url = `${API_BASE_URL}/auth/user/avatar`;
      const headers = {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let payload: unknown;

      if (Platform.OS === 'web') {
        const blob = await (await fetch(image.uri)).blob();
        const formData = new FormData();
        formData.append('avatar', blob, image.name);
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
        });
        payload = await response.json();
        if (!response.ok) {
          throw new Error(getUploadErrorMessage(payload));
        }
      } else {
        // Native: stream the file as a multipart field. The runtime's fetch +
        // FormData only accept Blob/string parts (not RN's {uri} file shape),
        // so uploadAsync is the reliable way to send a local file.
        const result = await uploadAsync(url, image.uri, {
          httpMethod: 'POST',
          uploadType: FileSystemUploadType.MULTIPART,
          fieldName: 'avatar',
          mimeType: image.mimeType,
          headers,
        });
        payload = parseJsonSafely(result.body);
        if (result.status < 200 || result.status >= 300) {
          throw new Error(getUploadErrorMessage(payload));
        }
      }

      const validated = safeParse(
        AuthUserResponseSchema,
        payload,
        'useUpdateAvatar'
      );
      return transformUser(validated.data);
    },
    onSuccess: (user) => {
      setUser(user);
      invalidateAvatarSurfaces(queryClient);
    },
  });
}

export function useDeleteAvatar() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete('/auth/user/avatar');
      const validated = safeParse(
        AuthUserResponseSchema,
        data,
        'useDeleteAvatar'
      );
      return transformUser(validated.data);
    },
    onSuccess: (user) => {
      setUser(user);
      invalidateAvatarSurfaces(queryClient);
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

export function useDeleteAccount() {
  const logout = useAuthStore((s) => s.logout);
  const setLoggingOut = useAuthStore((s) => s.setLoggingOut);
  const queryClient = useQueryClient();

  return useMutation({
    onMutate: () => {
      setLoggingOut(true);
    },
    mutationFn: async () => {
      await apiClient.delete('/auth/user');
    },
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
}
