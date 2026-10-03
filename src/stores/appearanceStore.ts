import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const APPEARANCE_NAMES = [
  'navy',
  'forest',
  'plum',
  'paper',
  'sky',
  'sage',
] as const;

export type AppearanceName = (typeof APPEARANCE_NAMES)[number];

function isAppearanceName(value: unknown): value is AppearanceName {
  return APPEARANCE_NAMES.includes(value as AppearanceName);
}

interface AppearanceState {
  appearance: AppearanceName;
  isHydrated: boolean;
  setAppearance: (appearance: AppearanceName) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      appearance: 'navy',
      isHydrated: false,
      setAppearance: (appearance) => set({ appearance }),
    }),
    {
      name: 'appearance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ appearance: state.appearance }),
      // Fall back to navy for themes that no longer exist, like the old contrast theme
      merge: (persisted, current) => {
        const appearance = (persisted as { appearance?: unknown } | undefined)
          ?.appearance;

        return {
          ...current,
          appearance: isAppearanceName(appearance) ? appearance : 'navy',
        };
      },
      onRehydrateStorage: () => () => {
        useAppearanceStore.setState({ isHydrated: true });
      },
    }
  )
);
