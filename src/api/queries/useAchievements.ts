import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '../client';
import { safeParse } from '../../schemas/safeParse';
import type { AchievementsResponse, UserAchievement } from '../../types';

const UserAchievementSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    category: z.string(),
    is_unlocked: z.boolean(),
    unlocked_at: z.string().nullable(),
    context: z.record(z.string(), z.unknown()).nullable(),
  })
  .passthrough();

const AchievementsResponseSchema = z
  .object({
    total_unlocked: z.number(),
    total_available: z.number(),
    categories: z.record(
      z.string(),
      z.object({
        unlocked: z.number(),
        total: z.number(),
      })
    ),
    achievements: z.array(UserAchievementSchema),
  })
  .passthrough();

function transformAchievement(
  data: z.infer<typeof UserAchievementSchema>
): UserAchievement {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    category: data.category,
    isUnlocked: data.is_unlocked,
    unlockedAt: data.unlocked_at,
    context: data.context,
  };
}

function transformResponse(
  data: z.infer<typeof AchievementsResponseSchema>
): AchievementsResponse {
  return {
    totalUnlocked: data.total_unlocked,
    totalAvailable: data.total_available,
    categories: data.categories,
    achievements: data.achievements.map(transformAchievement),
  };
}

export const achievementKeys = {
  all: ['achievements'] as const,
  list: () => [...achievementKeys.all, 'list'] as const,
};

export function useAchievements() {
  return useQuery({
    queryKey: achievementKeys.list(),
    queryFn: async (): Promise<AchievementsResponse> => {
      const { data } = await apiClient.get('/achievements');
      const validated = safeParse(
        AchievementsResponseSchema,
        data.data,
        'useAchievements'
      );
      return transformResponse(validated);
    },
    staleTime: 60_000,
  });
}
