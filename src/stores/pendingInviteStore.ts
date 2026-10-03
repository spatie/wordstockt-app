import { create } from 'zustand';

interface PendingInviteState {
  code: string | null;
  setCode: (code: string) => void;
  clear: () => void;
}

// Invite code from a deep link, opened once the user is signed in
export const usePendingInviteStore = create<PendingInviteState>()((set) => ({
  code: null,
  setCode: (code) => set({ code }),
  clear: () => set({ code: null }),
}));
