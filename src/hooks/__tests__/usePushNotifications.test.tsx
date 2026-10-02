import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '../usePushNotifications';
import { useAuthStore } from '../../stores/authStore';
import { mockUser } from '../../__tests__/utils';

const mockRegisterToken = jest.fn().mockResolvedValue(undefined);

jest.mock('../../api/queries/useAuth', () => ({
  useRegisterPushToken: () => ({ mutateAsync: mockRegisterToken }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));
jest.mock('expo-device', () => ({
  isDevice: true,
  deviceName: 'Test phone',
}));
jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'project' } } },
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'device-token' }),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

describe('push notification lifecycle', () => {
  let onAppState: ((state: string) => void) | null;

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().logout();
    onAppState = null;
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, listener) => {
        onAppState = listener as (state: string) => void;
        return { remove: jest.fn() };
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips guests, registers on conversion, and deduplicates foreground checks', async () => {
    const guest = mockUser({ isGuest: true });
    useAuthStore.getState().setAuth(guest, 'guest-auth-token');
    const { unmount } = await renderHook(() => usePushNotifications());

    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(mockRegisterToken).not.toHaveBeenCalled();

    await act(() => {
      useAuthStore.getState().setUser({ ...guest, isGuest: false });
    });

    await waitFor(() => expect(mockRegisterToken).toHaveBeenCalledTimes(1));
    expect(mockRegisterToken).toHaveBeenCalledWith({
      token: 'device-token',
      deviceName: 'Test phone',
      authToken: 'guest-auth-token',
    });

    await act(() => onAppState?.('active'));
    await waitFor(() =>
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledTimes(2)
    );
    expect(mockRegisterToken).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it('registers again for a new session and stops after logout', async () => {
    const user = mockUser();
    useAuthStore.getState().setAuth(user, 'first-auth-token');
    const { unmount } = await renderHook(() => usePushNotifications());
    await waitFor(() => expect(mockRegisterToken).toHaveBeenCalledTimes(1));

    await act(() => useAuthStore.getState().setAuth(user, 'second-auth-token'));
    await waitFor(() => expect(mockRegisterToken).toHaveBeenCalledTimes(2));
    expect(mockRegisterToken).toHaveBeenLastCalledWith({
      token: 'device-token',
      deviceName: 'Test phone',
      authToken: 'second-auth-token',
    });

    await act(() => useAuthStore.getState().logout());
    expect(onAppState).toBeTruthy();
    await act(() => onAppState?.('active'));
    expect(mockRegisterToken).toHaveBeenCalledTimes(2);
    await unmount();
  });
});
