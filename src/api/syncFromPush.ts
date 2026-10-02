import { queryClient } from './queryClient';
import { gameKeys } from './queries/queryKeys';
import { invitationKeys } from './queries/useInvitations';
import { useInvitationStore } from '../stores/invitationStore';
import type { GameInvitation } from '../types/invitation';

/**
 * Refreshes cached data when a push notification arrives while the app is
 * open. Pushes are how open screens learn about moves, finished games and
 * invitations.
 */
export async function syncFromPush(
  data: Record<string, unknown> | undefined
): Promise<void> {
  const gameUlid = typeof data?.game_ulid === 'string' ? data.game_ulid : null;

  queryClient.invalidateQueries({ queryKey: gameKeys.lists() });

  if (gameUlid) {
    queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameUlid) });
    queryClient.invalidateQueries({
      queryKey: gameKeys.moveHistory(gameUlid),
    });
  }

  if (data?.type !== 'invitation' || !gameUlid) {
    queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    return;
  }

  // Load the new invitation, then offer it in the in-app invitation dialog
  await queryClient.refetchQueries({ queryKey: invitationKeys.lists() });

  const invitation = queryClient
    .getQueryData<GameInvitation[]>(invitationKeys.lists())
    ?.find(
      (candidate) =>
        candidate.game.ulid === gameUlid && candidate.status === 'pending'
    );

  if (invitation) {
    useInvitationStore.getState().setPendingInvitation(invitation);
  }
}
