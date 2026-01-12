import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '../client';
import {
  GameListItemSchema,
  transformGameListItem,
  PendingGameSchema,
  transformPendingGame,
  type PendingGame,
} from '../../schemas/game.schema';
import { safeParse } from '../../schemas/safeParse';
import type { GameListItem } from '../../types';
import { gameKeys } from './queryKeys';

// Re-export for backwards compatibility
export { gameKeys };

const GamesResponseSchema = z.object({
  data: z.array(GameListItemSchema),
});

export function useGames() {
  return useQuery({
    queryKey: gameKeys.lists(),
    queryFn: async (): Promise<GameListItem[]> => {
      const { data } = await apiClient.get('/games');
      const validated = safeParse(GamesResponseSchema, data, 'useGames');
      return validated.data.map(transformGameListItem);
    },
    staleTime: 30_000,
  });
}

const PendingGamesResponseSchema = z.object({
  data: z.array(PendingGameSchema),
});

export function usePendingGames() {
  return useQuery({
    queryKey: gameKeys.pending(),
    queryFn: async (): Promise<PendingGame[]> => {
      const { data } = await apiClient.get('/games/pending');
      const validated = safeParse(
        PendingGamesResponseSchema,
        data,
        'usePendingGames'
      );
      return validated.data.map(transformPendingGame);
    },
    staleTime: 30_000,
  });
}

interface CreateGameParams {
  language?: 'nl' | 'en';
  opponent_username?: string;
  board_type?: 'standard' | 'no_bonuses' | 'custom';
  board_template?: (string | null)[][];
}

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateGameParams = {}) => {
      const { data } = await apiClient.post('/games', params);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
}

export function useJoinGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameUlid: string) => {
      const { data } = await apiClient.post(`/games/${gameUlid}/join`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gameKeys.pending() });
    },
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameUlid: string) => {
      await apiClient.delete(`/games/${gameUlid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete game:', error);
    },
  });
}
