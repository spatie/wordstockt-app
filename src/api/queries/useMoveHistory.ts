import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '../client';
import {
  MoveHistoryItemSchema,
  transformMoveHistoryItem,
} from '../../schemas/game.schema';
import { safeParse } from '../../schemas/safeParse';
import { gameKeys } from './queryKeys';
import type { MoveHistoryItem } from '../../types';

const MoveHistoryResponseSchema = z.object({
  data: z.array(MoveHistoryItemSchema),
});

export function useMoveHistory(gameUlid: string) {
  return useQuery({
    queryKey: gameKeys.moveHistory(gameUlid),
    queryFn: async (): Promise<MoveHistoryItem[]> => {
      const { data } = await apiClient.get(`/games/${gameUlid}/moves`);
      const validated = safeParse(
        MoveHistoryResponseSchema,
        data,
        'useMoveHistory'
      );
      return validated.data.map(transformMoveHistoryItem);
    },
    staleTime: 30_000,
    enabled: gameUlid.length > 0,
  });
}
