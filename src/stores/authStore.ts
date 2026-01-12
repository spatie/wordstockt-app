import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setLoggingOut: (loggingOut: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      isLoggingOut: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true, isLoading: false }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isLoggingOut: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setLoggingOut: (isLoggingOut) => set({ isLoggingOut }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useAuthStore.setState({ isLoading: false, isAuthenticated: false });
        } else if (state) {
          useAuthStore.setState({
            isAuthenticated: !!state.token,
            isLoading: false,
          });
        }
      },
    }
  )
);
