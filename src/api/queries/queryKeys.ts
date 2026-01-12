/**
 * Centralized query key factories for React Query.
 *
 * Using a factory pattern ensures consistent key structure and enables
 * targeted cache invalidation across the application.
 */

export const gameKeys = {
  all: ['games'] as const,
  lists: () => [...gameKeys.all, 'list'] as const,
  list: (filter: string) => [...gameKeys.lists(), filter] as const,
  pending: () => [...gameKeys.all, 'pending'] as const,
  details: () => [...gameKeys.all, 'detail'] as const,
  detail: (ulid: string) => [...gameKeys.details(), ulid] as const,
};

export const userKeys = {
  all: ['users'] as const,
  leaderboard: (type: string = 'elo') => ['leaderboard', type] as const,
  search: (query: string) => [...userKeys.all, 'search', query] as const,
  profile: (ulid: string) => [...userKeys.all, ulid] as const,
  stats: (ulid: string) => [...userKeys.all, ulid, 'stats'] as const,
  eloHistory: (ulid: string) => [...userKeys.all, ulid, 'elo-history'] as const,
  headToHead: (ulid: string) =>
    [...userKeys.all, ulid, 'head-to-head'] as const,
};

export const friendKeys = {
  all: ['friends'] as const,
  lists: () => [...friendKeys.all, 'list'] as const,
  check: (userUlid: string) => [...friendKeys.all, 'check', userUlid] as const,
};

export const authKeys = {
  currentUser: () => ['currentUser'] as const,
};

export const validationKeys = {
  validate: (gameUlid: string, tilePositions: string) =>
    ['validation', gameUlid, tilePositions] as const,
};
