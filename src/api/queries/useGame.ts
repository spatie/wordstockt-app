import { useCallback, useEffect, useRef } from 'react';
import { isAxiosError } from 'axios';
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
import { useAuthStore } from '../../stores/authStore';
import type { Game, PlacedTile, Achievement } from '../../types';

// There are no realtime updates, so an open game polls while it waits on
// other players. Polling pauses while the app is in the background.
const WAITING_POLL_INTERVAL = 20_000;

export function isWaitingOnOthers(
  game: Game | undefined,
  userUlid: string | undefined
): boolean {
  if (!game || !userUlid) {
    return false;
  }

  if (game.status === 'pending') {
    return true;
  }

  return game.status === 'active' && game.currentTurnUserUlid !== userUlid;
}

export function shouldRetryGameRequest(
  failureCount: number,
  error: unknown
): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined;

  if (status === 401 || status === 403 || status === 404) {
    return false;
  }

  return failureCount < 2;
}

function gameQueryOptions(gameUlid: string) {
  return {
    queryKey: gameKeys.detail(gameUlid),
    queryFn: async (): Promise<Game> => {
      const { data } = await apiClient.get(`/games/${gameUlid}`);
      const validated = safeParse(GameSchema, data.data, 'useGame');
      return transformGame(validated);
    },
    staleTime: 30_000,
    retry: shouldRetryGameRequest,
  };
}

export function useGame(gameUlid: string) {
  const queryClient = useQueryClient();
  const userUlid = useAuthStore((s) => s.user?.ulid);

  const query = useQuery({
    ...gameQueryOptions(gameUlid),
    enabled: gameUlid.length > 0,
    refetchInterval: (query) =>
      isWaitingOnOthers(query.state.data, userUlid)
        ? WAITING_POLL_INTERVAL
        : false,
  });

  // A new move (picked up by polling or a refetch) also changes the move
  // history and the games list
  const lastMoveUlid = query.data
    ? (query.data.lastMove?.ulid ?? null)
    : undefined;
  const previousLastMoveUlid = useRef(lastMoveUlid);

  useEffect(() => {
    const previous = previousLastMoveUlid.current;
    previousLastMoveUlid.current = lastMoveUlid;

    if (previous === undefined || previous === lastMoveUlid) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: gameKeys.moveHistory(gameUlid) });
    queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
  }, [lastMoveUlid, gameUlid, queryClient]);

  return query;
}

// Start loading a game before navigating to it (e.g. on press in), so the
// game screen can often render straight away.
export function usePrefetchGame() {
  const queryClient = useQueryClient();

  return useCallback(
    (gameUlid: string) => {
      queryClient.prefetchQuery(gameQueryOptions(gameUlid));
    },
    [queryClient]
  );
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
      const { data } = await apiClient.post(
        `/games/${gameUlid}/moves`,
        { tiles: placedTilesToApi(tiles) },
        { timeout: 7000 }
      );
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
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
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
