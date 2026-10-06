import { useAuthStore } from '../authStore';
import { mockUser } from '../../__tests__/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigationStore } from '../navigationStore';

jest.unmock('zustand/middleware');

describe('authStore', () => {
  beforeEach(async () => {
    useAuthStore.getState().logout();
    await AsyncStorage.clear();
  });

  describe('setAuth', () => {
    it('should set user, token, and isAuthenticated', () => {
      const user = mockUser();

      useAuthStore.getState().setAuth(user, 'token123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe('token123');
      expect(state.session).toEqual({ user, token: 'token123' });
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should override existing auth state', () => {
      const user1 = mockUser({ username: 'user1' });
      const user2 = mockUser({ username: 'user2' });

      useAuthStore.getState().setAuth(user1, 'token1');
      useAuthStore.getState().setAuth(user2, 'token2');

      const state = useAuthStore.getState();
      expect(state.user?.username).toBe('user2');
      expect(state.token).toBe('token2');
    });

    it('clears the previous account’s resume game', () => {
      useNavigationStore.getState().setLastGameUlid('old-game');

      useAuthStore.getState().setAuth(mockUser(), 'new-token');

      expect(useNavigationStore.getState().lastGameUlid).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should update user without affecting other state', () => {
      const initialUser = mockUser({ username: 'initial' });
      useAuthStore.getState().setAuth(initialUser, 'mytoken');

      const updatedUser = mockUser({ username: 'updated', eloRating: 1500 });
      useAuthStore.getState().setUser(updatedUser);

      const state = useAuthStore.getState();
      expect(state.user?.username).toBe('updated');
      expect(state.user?.eloRating).toBe(1500);
      expect(state.token).toBe('mytoken');
      expect(state.isAuthenticated).toBe(true);
      expect(state.session?.user).toEqual(updatedUser);
      expect(state.userRevision).toBe(1);
    });

    it('rejects a result from an older session or user revision', () => {
      const user = mockUser();
      useAuthStore.getState().setAuth(user, 'first');
      const firstSession = useAuthStore.getState().sessionRevision;

      useAuthStore.getState().setAuth(user, 'second');
      expect(
        useAuthStore
          .getState()
          .setUser(mockUser({ username: 'stale' }), firstSession)
      ).toBe(false);

      const currentSession = useAuthStore.getState().sessionRevision;
      useAuthStore.getState().setUser(mockUser({ username: 'new' }));
      expect(
        useAuthStore
          .getState()
          .setUser(mockUser({ username: 'stale' }), currentSession, 0)
      ).toBe(false);
      expect(useAuthStore.getState().user?.username).toBe('new');
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      const user = mockUser();
      useAuthStore.getState().setAuth(user, 'token123');

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.session).toBeNull();
    });

    it('should be idempotent', () => {
      useAuthStore.getState().logout();
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('clears the resume game on logout', () => {
      useNavigationStore.getState().setLastGameUlid('old-game');

      useAuthStore.getState().logout();

      expect(useNavigationStore.getState().lastGameUlid).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set isLoading to true', () => {
      useAuthStore.getState().setLoading(true);

      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('should set isLoading to false', () => {
      useAuthStore.getState().setLoading(true);

      useAuthStore.getState().setLoading(false);

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should not affect other state', () => {
      const user = mockUser();
      useAuthStore.getState().setAuth(user, 'token');

      useAuthStore.getState().setLoading(true);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe('token');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      useAuthStore.getState().setLoading(true);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('rehydration', () => {
    it('migrates a complete legacy user and token', async () => {
      const user = mockUser();
      await AsyncStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { user, token: 'legacy-token' }, version: 0 })
      );

      await useAuthStore.persist.rehydrate();

      expect(useAuthStore.getState().session).toEqual({
        user,
        token: 'legacy-token',
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('drops a partial legacy session instead of routing as authenticated', async () => {
      await AsyncStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: { user: null, token: 'orphan-token' },
          version: 0,
        })
      );

      await useAuthStore.persist.rehydrate();

      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
    });
  });
});
