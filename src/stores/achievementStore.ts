import { create } from 'zustand';
import type { Achievement } from '../types';

interface AchievementState {
  queue: Achievement[];
  addToQueue: (achievements: Achievement[]) => void;
  dismissNext: () => void;
  clearQueue: () => void;
  currentAchievement: Achievement | null;
}

export const useAchievementStore = create<AchievementState>()((set, get) => ({
  queue: [],

  addToQueue: (achievements) => {
    if (achievements.length === 0) return;
    set((state) => ({
      queue: [...state.queue, ...achievements],
      currentAchievement: state.currentAchievement ?? achievements[0] ?? null,
    }));
  },

  dismissNext: () => {
    set((state) => {
      const newQueue = state.queue.slice(1);
      return {
        queue: newQueue,
        currentAchievement: newQueue[0] ?? null,
      };
    });
  },

  clearQueue: () => set({ queue: [], currentAchievement: null }),

  currentAchievement: null,
}));

// Selector for checking if there are achievements to show
export const useHasPendingAchievements = () =>
  useAchievementStore((state) => state.queue.length > 0);

// Selector for current achievement to display
export const useCurrentAchievement = () =>
  useAchievementStore((state) => state.currentAchievement);
