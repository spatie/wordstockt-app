import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '../client';
import {
  LeaderboardEntrySchema,
  LeaderboardMetaSchema,
  transformLeaderboardEntry,
  transformLeaderboardMeta,
  UserPublicSchema,
  transformUserPublic,
} from '../../schemas/user.schema';
import { safeParse } from '../../schemas/safeParse';
import type { LeaderboardResponse, LeaderboardType } from '../../types';
import { userKeys } from './queryKeys';

const LeaderboardResponseSchema = z.object({
  data: z.array(LeaderboardEntrySchema),
  meta: LeaderboardMetaSchema,
});

export function useLeaderboard(type: LeaderboardType = 'elo') {
  return useQuery({
    queryKey: userKeys.leaderboard(type),
    queryFn: async (): Promise<LeaderboardResponse> => {
      const { data } = await apiClient.get('/users/leaderboard', {
        params: { type },
      });
      const validated = safeParse(
        LeaderboardResponseSchema,
        data,
        'useLeaderboard'
      );
      return {
        data: validated.data.map(transformLeaderboardEntry),
        meta: transformLeaderboardMeta(validated.meta),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

const SearchUsersResponseSchema = z.object({
  data: z.array(
    z.object({
      ulid: z.string(),
      username: z.string(),
      avatar: z.string().nullable(),
      avatar_color: z.string().nullish(),
      eloRating: z.number(),
    })
  ),
});

export interface UserSearchResult {
  ulid: string;
  username: string;
  avatar: string | null;
  avatarColor: string | null;
  eloRating: number;
}

export function useSearchUsers(query: string, exact: boolean = false) {
  return useQuery({
    queryKey: userKeys.search(query, exact),
    queryFn: async (): Promise<UserSearchResult[]> => {
      const { data } = await apiClient.get('/users/search', {
        params: { query, ...(exact && { exact: true }) },
      });
      const validated = safeParse(
        SearchUsersResponseSchema,
        data,
        'useSearchUsers'
      );
      return validated.data.map((user) => ({
        ulid: user.ulid,
        username: user.username,
        avatar: user.avatar,
        avatarColor: user.avatar_color ?? null,
        eloRating: user.eloRating,
      }));
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
    retry: false,
  });
}

const UserProfileResponseSchema = z.object({
  data: UserPublicSchema,
});

export function useUserProfile(userUlid: string) {
  return useQuery({
    queryKey: userKeys.profile(userUlid),
    queryFn: async () => {
      const { data } = await apiClient.get(`/users/${userUlid}`);
      const validated = safeParse(
        UserProfileResponseSchema,
        data,
        'useUserProfile'
      );
      return transformUserPublic(validated.data);
    },
    staleTime: 5 * 60 * 1000,
    enabled: userUlid.length > 0,
  });
}
