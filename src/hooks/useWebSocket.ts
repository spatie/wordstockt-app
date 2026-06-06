import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { gameKeys } from '../api/queries/useGames';
import { useWebSocketBase } from './useWebSocketBase';

export function useWebSocket(gameUlid: string | null) {
  const queryClient = useQueryClient();

  const handleMessage = useCallback(
    (message: { event: string; data: unknown }) => {
      if (!gameUlid) return;

      if (message.event === 'move.played') {
        console.log('[WS] Move played, refreshing game');
        queryClient.invalidateQueries({
          queryKey: gameKeys.detail(gameUlid),
        });
        queryClient.invalidateQueries({
          queryKey: gameKeys.lists(),
        });
      }

      if (message.event === 'game.started') {
        console.log('[WS] Game started, refreshing game');
        queryClient.invalidateQueries({
          queryKey: gameKeys.detail(gameUlid),
        });
        queryClient.invalidateQueries({
          queryKey: gameKeys.lists(),
        });
      }

      if (message.event === 'game.invitation.accepted') {
        console.log('[WS] Invitation accepted, refreshing game');
        queryClient.invalidateQueries({
          queryKey: gameKeys.detail(gameUlid),
        });
        queryClient.invalidateQueries({
          queryKey: gameKeys.lists(),
        });
      }

      if (message.event === 'game.invitation.declined') {
        console.log('[WS] Invitation declined, refreshing game');
        queryClient.invalidateQueries({
          queryKey: gameKeys.detail(gameUlid),
        });
        queryClient.invalidateQueries({
          queryKey: gameKeys.lists(),
        });
      }
    },
    [gameUlid, queryClient]
  );

  const { isConnected } = useWebSocketBase({
    channelId: gameUlid ? `private-game.${gameUlid}` : null,
    logPrefix: 'WS',
    onMessage: handleMessage,
  });

  return { isConnected: isConnected() };
}
