import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { gameKeys } from './useGames';

interface InvitePlayerParams {
  gameUlid: string;
  userUlid: string;
}

export function useInvitePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameUlid, userUlid }: InvitePlayerParams) => {
      const { data } = await apiClient.post(`/games/${gameUlid}/invite`, {
        user_ulid: userUlid,
      });
      return data;
    },
    onSuccess: (_, { gameUlid }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameUlid) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
}
