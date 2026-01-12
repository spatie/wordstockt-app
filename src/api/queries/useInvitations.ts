import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { gameKeys } from './useGames';
import type { GameInvitation } from '../../types/invitation';

export const invitationKeys = {
  all: ['invitations'] as const,
  lists: () => [...invitationKeys.all, 'list'] as const,
};

interface ApiGameInvitation {
  ulid: string;
  status: 'pending' | 'accepted' | 'declined';
  game: { ulid: string; language: string };
  inviter: {
    ulid: string;
    username: string;
    avatar: string | null;
    avatar_color: string | null;
  };
  invitee: {
    ulid: string;
    username: string;
    avatar: string | null;
    avatar_color: string | null;
  };
  created_at: string;
}

function transformInvitation(data: ApiGameInvitation): GameInvitation {
  return {
    ulid: data.ulid,
    status: data.status,
    game: data.game,
    inviter: {
      ulid: data.inviter.ulid,
      username: data.inviter.username,
      avatar: data.inviter.avatar,
      avatarColor: data.inviter.avatar_color,
    },
    invitee: {
      ulid: data.invitee.ulid,
      username: data.invitee.username,
      avatar: data.invitee.avatar,
      avatarColor: data.invitee.avatar_color,
    },
    createdAt: data.created_at,
  };
}

export function useInvitations() {
  return useQuery({
    queryKey: invitationKeys.lists(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ApiGameInvitation[] }>(
        '/invitations'
      );
      return data.data.map(transformInvitation);
    },
    staleTime: 30 * 1000,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationUlid: string) => {
      const { data } = await apiClient.post(
        `/invitations/${invitationUlid}/accept`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationUlid: string) => {
      const { data } = await apiClient.post(
        `/invitations/${invitationUlid}/decline`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationUlid: string) => {
      await apiClient.delete(`/invitations/${invitationUlid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });
}
