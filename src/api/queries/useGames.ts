import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '../client';
import {
  GameListItemSchema,
  transformGameListItem,
  PendingGameSchema,
  transformPendingGame,
  PublicGameSchema,
  transformPublicGame,
  type PendingGame,
} from '../../schemas/game.schema';
import { safeParse } from '../../schemas/safeParse';
import type { GameListItem, PublicGame } from '../../types';
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

const PublicGamesResponseSchema = z.object({
  data: z.array(PublicGameSchema),
});

export function usePublicGames() {
  return useQuery({
    queryKey: gameKeys.public(),
    queryFn: async (): Promise<PublicGame[]> => {
      const { data } = await apiClient.get('/games/public');
      const validated = safeParse(
        PublicGamesResponseSchema,
        data,
        'usePublicGames'
      );
      return validated.data.map(transformPublicGame);
    },
    staleTime: 30_000,
  });
}

interface CreateGameParams {
  language?: 'nl' | 'en';
  opponent_username?: string;
  board_type?: 'standard' | 'no_bonuses' | 'custom';
  board_template?: (string | null)[][];
  is_public?: boolean;
}

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateGameParams = {}) => {
      const { data } = await apiClient.post('/games', params);
      // Refetch games list and wait for it to complete
      await queryClient.refetchQueries({ queryKey: gameKeys.lists() });
      return data.data;
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
      queryClient.invalidateQueries({ queryKey: gameKeys.public() });
    },
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameUlid: string) => {
      await apiClient.delete(`/games/${gameUlid}`);
    },
    onMutate: async (gameUlid: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: gameKeys.lists() });
      await queryClient.cancelQueries({ queryKey: gameKeys.pending() });
      await queryClient.cancelQueries({ queryKey: gameKeys.public() });

      // Snapshot previous values
      const previousGames = queryClient.getQueryData<GameListItem[]>(
        gameKeys.lists()
      );
      const previousPending = queryClient.getQueryData<PendingGame[]>(
        gameKeys.pending()
      );
      const previousPublic = queryClient.getQueryData<PublicGame[]>(
        gameKeys.public()
      );

      // Optimistically remove the game from all lists
      if (previousGames) {
        queryClient.setQueryData<GameListItem[]>(
          gameKeys.lists(),
          previousGames.filter((g) => g.ulid !== gameUlid)
        );
      }
      if (previousPending) {
        queryClient.setQueryData<PendingGame[]>(
          gameKeys.pending(),
          previousPending.filter((g) => g.ulid !== gameUlid)
        );
      }
      if (previousPublic) {
        queryClient.setQueryData<PublicGame[]>(
          gameKeys.public(),
          previousPublic.filter((g) => g.ulid !== gameUlid)
        );
      }

      return { previousGames, previousPending, previousPublic };
    },
    onError: (error, _gameUlid, context) => {
      // Rollback on error
      if (context?.previousGames) {
        queryClient.setQueryData(gameKeys.lists(), context.previousGames);
      }
      if (context?.previousPending) {
        queryClient.setQueryData(gameKeys.pending(), context.previousPending);
      }
      if (context?.previousPublic) {
        queryClient.setQueryData(gameKeys.public(), context.previousPublic);
      }
      console.error('Failed to delete game:', error);
    },
    onSettled: () => {
      // Refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gameKeys.pending() });
      queryClient.invalidateQueries({ queryKey: gameKeys.public() });
    },
  });
}
