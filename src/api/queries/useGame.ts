import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  GameSchema,
  MoveResponseSchema,
  transformGame,
} from '../../schemas/game.schema';
import { safeParse } from '../../schemas/safeParse';
import { placedTilesToApi } from '../transforms/tileTransforms';
import { gameKeys } from './queryKeys';
import { useAchievementStore } from '../../stores/achievementStore';
import type { Game, PlacedTile, Achievement } from '../../types';

export function useGame(gameUlid: string) {
  return useQuery({
    queryKey: gameKeys.detail(gameUlid),
    queryFn: async (): Promise<Game> => {
      const { data } = await apiClient.get(`/games/${gameUlid}`);
      const validated = safeParse(GameSchema, data.data, 'useGame');
      return transformGame(validated);
    },
    staleTime: 30_000,
    enabled: gameUlid.length > 0,
  });
}

interface SubmitMoveParams {
  gameUlid: string;
  tiles: PlacedTile[];
}

interface MoveResult {
  game: Game;
  move: { ulid: string; score?: number; words?: string[] | null };
  achievements: Achievement[];
}

export function useSubmitMove() {
  const queryClient = useQueryClient();
  const addToQueue = useAchievementStore((s) => s.addToQueue);

  return useMutation({
    mutationFn: async ({
      gameUlid,
      tiles,
    }: SubmitMoveParams): Promise<MoveResult> => {
      const { data } = await apiClient.post(`/games/${gameUlid}/moves`, {
        tiles: placedTilesToApi(tiles),
      });
      const validated = safeParse(MoveResponseSchema, data, 'useSubmitMove');
      return {
        game: transformGame(validated.data),
        move: validated.move,
        achievements: validated.achievements ?? [],
      };
    },
    onSuccess: (result, { gameUlid }) => {
      queryClient.setQueryData(gameKeys.detail(gameUlid), result.game);
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });

      // Add any unlocked achievements to the queue
      if (result.achievements.length > 0) {
        addToQueue(result.achievements);
      }
    },
  });
}

export function usePassTurn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameUlid: string): Promise<Game> => {
      const { data } = await apiClient.post(`/games/${gameUlid}/pass`);
      const validated = safeParse(MoveResponseSchema, data, 'usePassTurn');
      return transformGame(validated.data);
    },
    onSuccess: (game) => {
      queryClient.setQueryData(gameKeys.detail(game.ulid), game);
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
    },
  });
}

interface SwapTilesParams {
  gameUlid: string;
  tiles: { letter: string; points: number }[];
}

export function useSwapTiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameUlid, tiles }: SwapTilesParams): Promise<Game> => {
      const { data } = await apiClient.post(`/games/${gameUlid}/swap`, {
        tiles,
      });
      const validated = safeParse(MoveResponseSchema, data, 'useSwapTiles');
      return transformGame(validated.data);
    },
    onSuccess: (game) => {
      queryClient.setQueryData(gameKeys.detail(game.ulid), game);
    },
  });
}

export function useResignGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameUlid: string): Promise<Game> => {
      const { data } = await apiClient.post(`/games/${gameUlid}/resign`);
      const validated = safeParse(MoveResponseSchema, data, 'useResignGame');
      return transformGame(validated.data);
    },
    onSuccess: (game) => {
      queryClient.setQueryData(gameKeys.detail(game.ulid), game);
      queryClient.refetchQueries({ queryKey: gameKeys.lists() });
    },
  });
}
