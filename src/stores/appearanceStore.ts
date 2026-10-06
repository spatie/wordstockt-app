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
  'library',
  'arcade',
  'terracotta',
  'monochrome',
  'classic',
  'ember',
] as const;

export type AppearanceName = (typeof APPEARANCE_NAMES)[number];

function isAppearanceName(value: unknown): value is AppearanceName {
  return APPEARANCE_NAMES.includes(value as AppearanceName);
}

interface AppearanceState {
  appearance: AppearanceName;
  // Use Paper in light mode and Navy in dark mode, following the device
  followSystem: boolean;
  isHydrated: boolean;
  setAppearance: (appearance: AppearanceName) => void;
  setFollowSystem: (followSystem: boolean) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      appearance: 'navy',
      followSystem: false,
      isHydrated: false,
      // Picking a theme is a deliberate choice, so it stops following the system
      setAppearance: (appearance) => set({ appearance, followSystem: false }),
      setFollowSystem: (followSystem) => set({ followSystem }),
    }),
    {
      name: 'appearance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        appearance: state.appearance,
        followSystem: state.followSystem,
      }),
      // Fall back to navy for themes that no longer exist, like the old contrast theme
      merge: (persisted, current) => {
        const { appearance, followSystem } =
          (persisted as
            { appearance?: unknown; followSystem?: unknown } | undefined) ?? {};

        return {
          ...current,
          appearance: isAppearanceName(appearance) ? appearance : 'navy',
          followSystem: followSystem === true,
        };
      },
      onRehydrateStorage: () => () => {
        useAppearanceStore.setState({ isHydrated: true });
      },
    }
  )
);
