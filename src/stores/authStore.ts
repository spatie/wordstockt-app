import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';
import { UserSchema, transformUser } from '../schemas/user.schema';
import { useNavigationStore } from './navigationStore';

interface AuthSession {
  user: User;
  token: string;
}

interface AuthState {
  session: AuthSession | null;
  // Compatibility projections. Only session transitions write these fields.
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  sessionRevision: number;
  userRevision: number;
}

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  setUser: (
    user: User,
    expectedSessionRevision?: number,
    expectedUserRevision?: number
  ) => boolean;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setLoggingOut: (loggingOut: boolean) => void;
}

function sessionFields(session: AuthSession | null) {
  return {
    session,
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: session !== null,
    isGuest: session?.user.isGuest ?? false,
  };
}

function readSession(value: unknown): AuthSession | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as { user?: unknown; token?: unknown };
  if (typeof candidate.token !== 'string' || !candidate.token) return null;

  const parsedUser = UserSchema.safeParse(candidate.user);
  if (!parsedUser.success) return null;

  return { user: transformUser(parsedUser.data), token: candidate.token };
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...sessionFields(null),
      isLoading: true,
      isLoggingOut: false,
      sessionRevision: 0,
      userRevision: 0,

      setAuth: (user, token) => {
        useNavigationStore.getState().clearLastGameUlid();
        set((state) => ({
          ...sessionFields({ user, token }),
          isLoading: false,
          isLoggingOut: false,
          sessionRevision: state.sessionRevision + 1,
          userRevision: 0,
        }));
      },

      setUser: (user, expectedSessionRevision, expectedUserRevision) => {
        let committed = false;
        set((state) => {
          if (
            !state.session ||
            state.session.user.ulid !== user.ulid ||
            (expectedSessionRevision !== undefined &&
              state.sessionRevision !== expectedSessionRevision) ||
            (expectedUserRevision !== undefined &&
              state.userRevision !== expectedUserRevision)
          ) {
            return state;
          }

          committed = true;
          return {
            ...sessionFields({ ...state.session, user }),
            userRevision: state.userRevision + 1,
          };
        });
        return committed;
      },

      logout: () => {
        useNavigationStore.getState().clearLastGameUlid();
        set((state) => ({
          ...sessionFields(null),
          isLoading: false,
          isLoggingOut: false,
          sessionRevision: state.sessionRevision + 1,
          userRevision: 0,
        }));
      },

      setLoading: (isLoading) => set({ isLoading }),
      setLoggingOut: (isLoggingOut) => set({ isLoggingOut }),
    }),
    {
      name: 'auth-storage',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ session: state.session }),
      migrate: (persistedState) => {
        const persisted = persistedState as {
          session?: unknown;
          user?: unknown;
          token?: unknown;
        };
        return { session: readSession(persisted.session ?? persisted) };
      },
      merge: (persistedState, currentState) => {
        const session = readSession(
          (persistedState as { session?: unknown })?.session
        );
        return {
          ...currentState,
          ...sessionFields(session),
          sessionRevision: session ? currentState.sessionRevision + 1 : 0,
        };
      },
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ isLoading: false });
      },
    }
  )
);
