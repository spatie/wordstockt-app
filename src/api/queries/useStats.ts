import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  UserStatsResponseSchema,
  EloHistoryResponseSchema,
  HeadToHeadResponseSchema,
  transformHeadToHeadRecord,
} from '../../schemas/stats.schema';
import { safeParse } from '../../schemas/safeParse';
import type { UserStats, EloHistoryEntry, HeadToHeadRecord } from '../../types';
import { userKeys } from './queryKeys';

export function useUserStats(userUlid: string) {
  return useQuery({
    queryKey: userKeys.stats(userUlid),
    queryFn: async (): Promise<UserStats> => {
      const { data } = await apiClient.get(`/users/${userUlid}/stats`);
      const validated = safeParse(
        UserStatsResponseSchema,
        data,
        'useUserStats'
      );
      return validated.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: userUlid.length > 0,
  });
}

export function useEloHistory(userUlid: string) {
  return useQuery({
    queryKey: userKeys.eloHistory(userUlid),
    queryFn: async (): Promise<EloHistoryEntry[]> => {
      const { data } = await apiClient.get(`/users/${userUlid}/elo-history`);
      const validated = safeParse(
        EloHistoryResponseSchema,
        data,
        'useEloHistory'
      );
      return validated.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: userUlid.length > 0,
  });
}

export function useHeadToHead(userUlid: string) {
  return useQuery({
    queryKey: userKeys.headToHead(userUlid),
    queryFn: async (): Promise<HeadToHeadRecord[]> => {
      const { data } = await apiClient.get(`/users/${userUlid}/head-to-head`);
      const validated = safeParse(
        HeadToHeadResponseSchema,
        data,
        'useHeadToHead'
      );
      return validated.data.map(transformHeadToHeadRecord);
    },
    staleTime: 5 * 60 * 1000,
    enabled: userUlid.length > 0,
  });
}
