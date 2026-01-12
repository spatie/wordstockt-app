import { create } from 'zustand';
import type { GameInvitation } from '../types/invitation';

interface InvitationState {
  pendingInvitation: GameInvitation | null;
}

interface InvitationActions {
  setPendingInvitation: (invitation: GameInvitation | null) => void;
  clearPendingInvitation: () => void;
}

export const useInvitationStore = create<InvitationState & InvitationActions>()(
  (set) => ({
    pendingInvitation: null,

    setPendingInvitation: (invitation) =>
      set({ pendingInvitation: invitation }),

    clearPendingInvitation: () => set({ pendingInvitation: null }),
  })
);
