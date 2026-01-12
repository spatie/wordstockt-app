import { z } from 'zod';
import type {
  User,
  LeaderboardEntry,
  LeaderboardMeta,
  CurrentUserLeaderboardEntry,
  LeaderboardType,
} from '../types';

export const UserSchema = z.object({
  ulid: z.string(),
  username: z.string(),
  email: z.string().email().optional(),
  avatar: z.string().nullable(),
  avatarColor: z.string().nullish(),
  eloRating: z.number(),
  gamesPlayed: z.number(),
  gamesWon: z.number(),
  emailVerifiedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type UserResponse = z.infer<typeof UserSchema>;

export const UserPublicSchema = z.object({
  ulid: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
  avatarColor: z.string().nullish(),
  eloRating: z.number(),
  gamesPlayed: z.number(),
  gamesWon: z.number(),
  winRate: z.number(),
});

export type UserPublicResponse = z.infer<typeof UserPublicSchema>;

export interface UserPublic {
  ulid: string;
  username: string;
  avatar: string | null;
  avatarColor: string | null;
  eloRating: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
}

export function transformUserPublic(data: UserPublicResponse): UserPublic {
  return {
    ulid: data.ulid,
    username: data.username,
    avatar: data.avatar,
    avatarColor: data.avatarColor ?? null,
    eloRating: data.eloRating,
    gamesPlayed: data.gamesPlayed,
    gamesWon: data.gamesWon,
    winRate: data.winRate,
  };
}

export function transformUser(data: UserResponse): User {
  return {
    ulid: data.ulid,
    username: data.username,
    email: data.email,
    avatar: data.avatar,
    avatarColor: data.avatarColor ?? null,
    eloRating: data.eloRating,
    gamesPlayed: data.gamesPlayed,
    gamesWon: data.gamesWon,
    emailVerifiedAt: data.emailVerifiedAt,
    createdAt: data.createdAt,
  };
}

export const LeaderboardEntrySchema = z.object({
  rank: z.number(),
  ulid: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
  avatarColor: z.string().nullish(),
  eloRating: z.number(),
  gamesPlayed: z.number(),
  gamesWon: z.number(),
  winsInPeriod: z.number().optional(),
});

export function transformLeaderboardEntry(
  data: z.infer<typeof LeaderboardEntrySchema>
): LeaderboardEntry {
  return {
    rank: data.rank,
    ulid: data.ulid,
    username: data.username,
    avatar: data.avatar,
    avatarColor: data.avatarColor ?? null,
    eloRating: data.eloRating,
    gamesPlayed: data.gamesPlayed,
    gamesWon: data.gamesWon,
    winsInPeriod: data.winsInPeriod,
  };
}

export const CurrentUserLeaderboardEntrySchema = z.object({
  rank: z.number().nullable(),
  message: z.string().optional(),
  ulid: z.string().optional(),
  username: z.string().optional(),
  avatar: z.string().nullable().optional(),
  avatarColor: z.string().nullish().optional(),
  eloRating: z.number().optional(),
  gamesPlayed: z.number().optional(),
  gamesWon: z.number().optional(),
  winsInPeriod: z.number().optional(),
});

export function transformCurrentUserEntry(
  data: z.infer<typeof CurrentUserLeaderboardEntrySchema> | null
): CurrentUserLeaderboardEntry | null {
  if (!data) return null;
  return {
    rank: data.rank,
    message: data.message,
    ulid: data.ulid,
    username: data.username,
    avatar: data.avatar ?? null,
    avatarColor: data.avatarColor ?? null,
    eloRating: data.eloRating,
    gamesPlayed: data.gamesPlayed,
    gamesWon: data.gamesWon,
    winsInPeriod: data.winsInPeriod,
  };
}

export const LeaderboardMetaSchema = z.object({
  type: z.enum(['elo', 'monthly', 'yearly']),
  label: z.string(),
  currentUser: CurrentUserLeaderboardEntrySchema.nullable(),
});

export function transformLeaderboardMeta(
  data: z.infer<typeof LeaderboardMetaSchema>
): LeaderboardMeta {
  return {
    type: data.type as LeaderboardType,
    label: data.label,
    currentUser: transformCurrentUserEntry(data.currentUser),
  };
}

export const LoginResponseSchema = z.object({
  data: UserSchema,
  token: z.string(),
});

export const AuthUserResponseSchema = z.object({
  data: UserSchema,
});
