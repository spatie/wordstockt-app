import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { gameKeys } from './queryKeys';
import type { MoveReactionType } from '../../config/reactions';

interface ChangeMoveReaction {
  gameUlid: string;
  moveUlid: string;
  reaction: MoveReactionType | null;
}

export function useMoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameUlid,
      moveUlid,
      reaction,
    }: ChangeMoveReaction) => {
      const url = `/games/${gameUlid}/moves/${moveUlid}/reaction`;

      if (reaction === null) {
        await apiClient.delete(url);
        return;
      }

      await apiClient.put(url, { reaction });
    },
    onSuccess: (_, { gameUlid }) => {
      queryClient.invalidateQueries({
        queryKey: gameKeys.moveHistory(gameUlid),
      });
    },
  });
}
