import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '../../client';
import { mockUser } from '../../../__tests__/utils';
import { useAuthStore } from '../../../stores/authStore';
import { authKeys } from '../queryKeys';
import { useCurrentUser, useLogout, useUpdateProfile } from '../useAuth';

jest.mock('../../client', () => ({
  apiClient: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  getExpoPushTokenAsync: jest.fn(),
}));

const get = apiClient.get as jest.Mock;
const put = apiClient.put as jest.Mock;
const post = apiClient.post as jest.Mock;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('current user cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('keeps a newer profile update when an earlier fetch completes late', async () => {
    const oldUser = mockUser({ username: 'old', eloRating: 1200 });
    const updatedUser = mockUser({ username: 'new', eloRating: 1500 });
    const oldRequest = deferred<{ data: { data: typeof oldUser } }>();
    get.mockReturnValue(oldRequest.promise);
    put.mockResolvedValue({ data: { data: updatedUser } });

    useAuthStore.getState().setAuth(oldUser, 'token');
    const sessionRevision = useAuthStore.getState().sessionRevision;
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { gcTime: 0 },
      },
    });
    const { result, unmount } = await renderHook(
      () => ({ current: useCurrentUser(), update: useUpdateProfile() }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.update.mutateAsync({ username: 'new' });
    });
    await act(async () => {
      oldRequest.resolve({ data: { data: oldUser } });
      await oldRequest.promise;
    });

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(updatedUser);
      expect(
        queryClient.getQueryData(authKeys.currentUser(sessionRevision))
      ).toEqual(updatedUser);
    });
    await unmount();
    queryClient.clear();
  });

  it('does not apply a previous session response after an account switch', async () => {
    const firstUser = mockUser({ ulid: 'first' });
    const secondUser = mockUser({ ulid: 'second' });
    const firstRequest = deferred<{ data: { data: typeof firstUser } }>();
    get
      .mockReturnValueOnce(firstRequest.promise)
      .mockResolvedValue({ data: { data: secondUser } });
    useAuthStore.getState().setAuth(firstUser, 'first-token');

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { gcTime: 0 },
      },
    });
    const { unmount } = await renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(queryClient),
    });

    await act(() =>
      useAuthStore.getState().setAuth(secondUser, 'second-token')
    );
    await act(async () => {
      firstRequest.resolve({ data: { data: firstUser } });
      await firstRequest.promise;
    });

    await waitFor(() =>
      expect(useAuthStore.getState().user).toEqual(secondUser)
    );
    expect(useAuthStore.getState().token).toBe('second-token');
    await unmount();
    queryClient.clear();
  });

  it('does not log out a new session when an old logout finishes late', async () => {
    const firstUser = mockUser({ ulid: 'first' });
    const secondUser = mockUser({ ulid: 'second' });
    const oldLogout = deferred<{ data: unknown }>();
    post.mockReturnValue(oldLogout.promise);
    useAuthStore.getState().setAuth(firstUser, 'first-token');

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { gcTime: 0 } },
    });
    const { result, unmount } = await renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await act(() => result.current.mutate());
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    await act(() =>
      useAuthStore.getState().setAuth(secondUser, 'second-token')
    );
    await act(async () => {
      oldLogout.resolve({ data: {} });
      await oldLogout.promise;
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(useAuthStore.getState().user).toEqual(secondUser);
    expect(useAuthStore.getState().token).toBe('second-token');
    expect(post).toHaveBeenCalledWith(
      '/auth/logout',
      { push_token: null },
      { headers: { Authorization: 'Bearer first-token' } }
    );
    await unmount();
    queryClient.clear();
  });
});
