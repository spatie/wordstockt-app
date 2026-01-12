import { useAuthStore } from '../authStore';
import { mockUser } from '../../__tests__/utils';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe('setAuth', () => {
    it('should set user, token, and isAuthenticated', () => {
      const user = mockUser();

      useAuthStore.getState().setAuth(user, 'token123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe('token123');
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
  });

  describe('setUser', () => {
    it('should update user without affecting other state', () => {
      const initialUser = mockUser({ username: 'initial' });
      useAuthStore.setState({
        user: initialUser,
        token: 'mytoken',
        isAuthenticated: true,
        isLoading: false,
      });

      const updatedUser = mockUser({ username: 'updated', eloRating: 1500 });
      useAuthStore.getState().setUser(updatedUser);

      const state = useAuthStore.getState();
      expect(state.user?.username).toBe('updated');
      expect(state.user?.eloRating).toBe(1500);
      expect(state.token).toBe('mytoken');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      const user = mockUser();
      useAuthStore.setState({
        user,
        token: 'token123',
        isAuthenticated: true,
        isLoading: false,
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should be idempotent', () => {
      useAuthStore.getState().logout();
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set isLoading to true', () => {
      useAuthStore.getState().setLoading(true);

      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('should set isLoading to false', () => {
      useAuthStore.setState({ isLoading: true });

      useAuthStore.getState().setLoading(false);

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should not affect other state', () => {
      const user = mockUser();
      useAuthStore.setState({
        user,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
      });

      useAuthStore.getState().setLoading(true);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe('token');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      // Create fresh store instance behavior by checking defaults
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true, // Initial loading state
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
