import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { gameKeys } from './useGames';
import type { GameInviteLink } from '../../types/invitation';
import type { Game } from '../../types/game';

export const inviteLinkKeys = {
  all: ['invite-links'] as const,
  detail: (code: string) => [...inviteLinkKeys.all, code] as const,
};

export function useCreateInviteLink() {
  return useMutation({
    mutationFn: async (gameUlid: string) => {
      const { data } = await apiClient.post<{ data: GameInviteLink }>(
        `/games/${gameUlid}/invite-link`
      );
      return data.data;
    },
  });
}

export function useInviteLinkDetails(code: string | undefined) {
  return useQuery({
    queryKey: inviteLinkKeys.detail(code ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: GameInviteLink }>(
        `/invite-links/${code}`
      );
      return data.data;
    },
    enabled: !!code,
  });
}

export function useRedeemInviteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await apiClient.post<{ data: Game }>(
        `/invite-links/${code}/redeem`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
}
