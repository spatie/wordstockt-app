import { create } from 'zustand';

interface NotificationState {
  // Map of gameUlid -> notification identifiers
  notifications: Record<string, string[]>;
}

interface NotificationActions {
  addNotification: (identifier: string, gameUlid: string) => void;
  getIdentifiersForGame: (gameUlid: string) => string[];
  clearForGame: (gameUlid: string) => void;
}

export const useNotificationStore = create<
  NotificationState & NotificationActions
>((set, get) => ({
  notifications: {},

  addNotification: (identifier, gameUlid) =>
    set((state) => {
      const existing = state.notifications[gameUlid] ?? [];
      if (existing.includes(identifier)) {
        return state;
      }
      return {
        notifications: {
          ...state.notifications,
          [gameUlid]: [...existing, identifier],
        },
      };
    }),

  getIdentifiersForGame: (gameUlid) => {
    return get().notifications[gameUlid] ?? [];
  },

  clearForGame: (gameUlid) =>
    set((state) => {
      const { [gameUlid]: _, ...remaining } = state.notifications;
      return { notifications: remaining };
    }),
}));
