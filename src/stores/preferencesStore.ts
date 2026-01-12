import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'nl' | 'en';

interface PreferencesState {
  preferredLanguage: Language;
}

interface PreferencesActions {
  setPreferredLanguage: (language: Language) => void;
}

export const usePreferencesStore = create<
  PreferencesState & PreferencesActions
>()(
  persist(
    (set) => ({
      preferredLanguage: 'en',

      setPreferredLanguage: (language) => set({ preferredLanguage: language }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
