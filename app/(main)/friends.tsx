import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, RefreshControl, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFriends } from '../../src/api/queries/useFriends';
import { ErrorView } from '../../src/components/ui/ErrorView';
import { FriendCard } from '../../src/components/friends/FriendCard';
import { colors } from '../../src/config/theme';
import { ROUTES } from '../../src/config/routes';
import type { Friend } from '../../src/types';

export default function FriendsScreen() {
  const { push } = useRouter();
  const { data: friends, isLoading, error, refetch } = useFriends();
  const [refreshing, setRefreshing] = useState(false);

  const sortedFriends = useMemo(() => {
    if (!friends) return [];
    return [...friends].sort((a, b) =>
      a.username.toLowerCase().localeCompare(b.username.toLowerCase())
    );
  }, [friends]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleFriendPress = useCallback(
    (friendUlid: string) => {
      push(ROUTES.USER_PROFILE(friendUlid));
    },
    [push]
  );

  const renderFriend = useCallback(
    ({ item }: { item: Friend }) => (
      <FriendCard friend={item} onPress={handleFriendPress} />
    ),
    [handleFriendPress]
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorView message="Failed to load friends" onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>
          {friends?.length ?? 0} {friends?.length === 1 ? 'friend' : 'friends'}
        </Text>
      </View>
      <FlashList
        data={sortedFriends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.ulid}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptyText}>
              Add friends by viewing their profile from the game list or
              leaderboard.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
