import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NavigationState {
  lastGameUlid: string | null;
  currentlyViewedGameUlid: string | null;
  isHydrated: boolean;
}

interface NavigationActions {
  setLastGameUlid: (ulid: string | null) => void;
  clearLastGameUlid: () => void;
  setCurrentlyViewedGameUlid: (ulid: string | null) => void;
}

export const useNavigationStore = create<NavigationState & NavigationActions>()(
  persist(
    (set) => ({
      lastGameUlid: null,
      currentlyViewedGameUlid: null,
      isHydrated: false,

      setLastGameUlid: (ulid) => set({ lastGameUlid: ulid }),

      clearLastGameUlid: () => set({ lastGameUlid: null }),

      setCurrentlyViewedGameUlid: (ulid) =>
        set({ currentlyViewedGameUlid: ulid }),
    }),
    {
      name: 'navigation-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ lastGameUlid: state.lastGameUlid }),
      onRehydrateStorage: () => () => {
        useNavigationStore.setState({ isHydrated: true });
      },
    }
  )
);
