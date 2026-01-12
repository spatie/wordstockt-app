import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import {
  FriendsListResponseSchema,
  FriendResponseSchema,
  FriendCheckResponseSchema,
  transformFriend,
  transformFriendCheck,
} from '../../schemas/friend.schema';
import { safeParse } from '../../schemas/safeParse';
import type { Friend, FriendCheckResponse } from '../../types';
import { friendKeys } from './queryKeys';

// Re-export for backwards compatibility
export { friendKeys };

export function useFriends() {
  return useQuery({
    queryKey: friendKeys.lists(),
    queryFn: async (): Promise<Friend[]> => {
      const { data } = await apiClient.get('/friends');
      const validated = safeParse(
        FriendsListResponseSchema,
        data,
        'useFriends'
      );
      return validated.data.map(transformFriend);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useIsFriend(userUlid: string) {
  return useQuery({
    queryKey: friendKeys.check(userUlid),
    queryFn: async (): Promise<FriendCheckResponse> => {
      const { data } = await apiClient.get(`/friends/check/${userUlid}`);
      const validated = safeParse(
        FriendCheckResponseSchema,
        data,
        'useIsFriend'
      );
      return transformFriendCheck(validated);
    },
    staleTime: 5 * 60 * 1000,
    enabled: userUlid.length > 0,
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userUlid: string): Promise<Friend> => {
      const { data } = await apiClient.post('/friends', {
        user_ulid: userUlid,
      });
      const validated = safeParse(FriendResponseSchema, data, 'useAddFriend');
      return transformFriend(validated.data);
    },
    onMutate: async (userUlid) => {
      await queryClient.cancelQueries({ queryKey: friendKeys.check(userUlid) });
      const previousStatus = queryClient.getQueryData<FriendCheckResponse>(
        friendKeys.check(userUlid)
      );
      queryClient.setQueryData<FriendCheckResponse>(
        friendKeys.check(userUlid),
        { isFriend: true }
      );
      return { previousStatus };
    },
    onError: (_, userUlid, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(
          friendKeys.check(userUlid),
          context.previousStatus
        );
      }
    },
    onSettled: (_, __, userUlid) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.lists() });
      queryClient.invalidateQueries({ queryKey: friendKeys.check(userUlid) });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userUlid: string): Promise<void> => {
      await apiClient.delete(`/friends/${userUlid}`);
    },
    onMutate: async (userUlid) => {
      await queryClient.cancelQueries({ queryKey: friendKeys.check(userUlid) });
      const previousStatus = queryClient.getQueryData<FriendCheckResponse>(
        friendKeys.check(userUlid)
      );
      queryClient.setQueryData<FriendCheckResponse>(
        friendKeys.check(userUlid),
        { isFriend: false }
      );
      return { previousStatus };
    },
    onError: (_, userUlid, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(
          friendKeys.check(userUlid),
          context.previousStatus
        );
      }
    },
    onSettled: (_, __, userUlid) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.lists() });
      queryClient.invalidateQueries({ queryKey: friendKeys.check(userUlid) });
    },
  });
}
