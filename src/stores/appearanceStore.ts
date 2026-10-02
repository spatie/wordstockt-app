import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AppearanceName = 'navy' | 'paper' | 'contrast';

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
      onRehydrateStorage: () => () => {
        useAppearanceStore.setState({ isHydrated: true });
      },
    }
  )
);
