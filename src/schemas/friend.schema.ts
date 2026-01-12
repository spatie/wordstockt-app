import { z } from 'zod';
import type { Friend, FriendCheckResponse } from '../types';

export const FriendSchema = z.object({
  ulid: z.string(),
  friend_ulid: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
  avatar_color: z.string().nullish(),
  elo_rating: z.number(),
  created_at: z.string(),
});

export type FriendResponse = z.infer<typeof FriendSchema>;

export function transformFriend(data: FriendResponse): Friend {
  return {
    ulid: data.ulid,
    friendUlid: data.friend_ulid,
    username: data.username,
    avatar: data.avatar,
    avatarColor: data.avatar_color ?? null,
    eloRating: data.elo_rating,
    createdAt: data.created_at,
  };
}

export const FriendsListResponseSchema = z.object({
  data: z.array(FriendSchema),
});

export const FriendResponseSchema = z.object({
  data: FriendSchema,
});

export const FriendCheckResponseSchema = z.object({
  is_friend: z.boolean(),
});

export function transformFriendCheck(
  data: z.infer<typeof FriendCheckResponseSchema>
): FriendCheckResponse {
  return {
    isFriend: data.is_friend,
  };
}
