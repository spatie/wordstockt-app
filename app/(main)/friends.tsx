import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, RefreshControl, Text, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useFriends } from '../../src/api/queries/useFriends';
import { ErrorView } from '../../src/components/ui/ErrorView';
import { FriendCard } from '../../src/components/friends/FriendCard';
import { AddFriendModal } from '../../src/components/friends/AddFriendModal';
import { useSnackbar } from '../../src/components/ui/SnackbarProvider';
import { colors } from '../../src/config/theme';
import { SPACING, RADIUS } from '../../src/config/constants';
import { ROUTES } from '../../src/config/routes';
import type { Friend } from '../../src/types';

export default function FriendsScreen() {
  const { push } = useRouter();
  const { data: friends, isLoading, error, refetch } = useFriends();
  const { showSnackbar } = useSnackbar();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleAddFriendSuccess = useCallback(() => {
    showSnackbar('Friend added!', 'success');
  }, [showSnackbar]);

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
              Tap the + button to add a friend by username, or view their
              profile from the game list or leaderboard.
            </Text>
          </View>
        }
      />

      <Animated.View style={styles.fabContainer}>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <View style={styles.fabInner}>
            <Ionicons name="person-add" size={26} color="#FFF" />
          </View>
        </Pressable>
      </Animated.View>

      <AddFriendModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddFriendSuccess}
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
  fabContainer: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
    shadowOpacity: 0.2,
  },
  fabInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
