import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useInvitationStore } from '../stores/invitationStore';
import { gameKeys } from '../api/queries/useGames';
import { invitationKeys } from '../api/queries/useInvitations';
import { useWebSocketBase } from './useWebSocketBase';
import type { GameInvitation } from '../types/invitation';

export function useUserWebSocket() {
  const queryClient = useQueryClient();
  const userUlid = useAuthStore((s) => s.user?.ulid);

  const refreshOnConnect = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: gameKeys.lists(),
    });
    queryClient.invalidateQueries({
      queryKey: invitationKeys.lists(),
    });
  }, [queryClient]);

  const handleAppForeground = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: gameKeys.lists(),
    });
    queryClient.invalidateQueries({
      queryKey: invitationKeys.lists(),
    });
  }, [queryClient]);

  const handleMessage = useCallback(
    (message: { event: string; data: unknown }) => {
      if (message.event === 'game.invitation') {
        console.log(
          '[UserWS] Game invitation received, refreshing invitations list'
        );
        queryClient.invalidateQueries({
          queryKey: invitationKeys.lists(),
        });

        const rawData =
          typeof message.data === 'string'
            ? JSON.parse(message.data)
            : message.data;
        const data = rawData as {
          ulid: string;
          game: { ulid: string; language: string };
          inviter: {
            ulid: string;
            username: string;
            avatar: string | null;
            avatar_color: string | null;
          };
        };

        const invitation: GameInvitation = {
          ulid: data.ulid,
          status: 'pending',
          game: data.game,
          inviter: {
            ulid: data.inviter.ulid,
            username: data.inviter.username,
            avatar: data.inviter.avatar,
            avatarColor: data.inviter.avatar_color,
          },
          invitee: {
            ulid: userUlid!,
            username: '',
            avatar: null,
            avatarColor: null,
          },
          createdAt: new Date().toISOString(),
        };

        useInvitationStore.getState().setPendingInvitation(invitation);
      }

      if (message.event === 'game.invitation.accepted') {
        console.log('[UserWS] Invitation accepted, refreshing games list');
        queryClient.invalidateQueries({
          queryKey: gameKeys.lists(),
        });
        queryClient.invalidateQueries({
          queryKey: gameKeys.all,
        });
      }

      if (message.event === 'game.invitation.declined') {
        console.log('[UserWS] Invitation declined, refreshing games list');
        queryClient.invalidateQueries({
          queryKey: gameKeys.lists(),
        });
        queryClient.invalidateQueries({
          queryKey: gameKeys.all,
        });
      }

      if (message.event === 'move.played') {
        console.log('[UserWS] Move played in a game, refreshing games list');
        queryClient.invalidateQueries({
          queryKey: gameKeys.lists(),
        });
      }
    },
    [queryClient, userUlid]
  );

  const { isConnected } = useWebSocketBase({
    channelId: userUlid ? `private-user.${userUlid}` : null,
    logPrefix: 'UserWS',
    onConnected: refreshOnConnect,
    onMessage: handleMessage,
    onAppForeground: handleAppForeground,
  });

  return { isConnected: isConnected() };
}
