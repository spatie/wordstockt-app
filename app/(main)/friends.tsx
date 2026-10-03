import type { ThemeColors } from '../../src/config/theme';
import {
  useThemeColors,
  useThemedStyles,
} from '../../src/hooks/useThemeColors';
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../src/api/queries/useFriends';
import { ErrorView } from '../../src/components/ui/ErrorView';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ListRowSkeletons } from '../../src/components/ui/Skeleton';
import { FriendRow } from '../../src/components/friends/FriendRow';
import { HeaderMenu } from '../../src/components/ui/HeaderMenu';
import { AddFriendModal } from '../../src/components/friends/AddFriendModal';
import { useSnackbar } from '../../src/components/ui/SnackbarProvider';
import { LAYOUT } from '../../src/config/constants';
import { ROUTES } from '../../src/config/routes';
import type { Friend } from '../../src/types';

export default function FriendsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
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
    ({ item, index }: { item: Friend; index: number }) => (
      <FriendRow
        friend={item}
        isFirst={index === 0}
        isLast={index === sortedFriends.length - 1}
        onPress={handleFriendPress}
      />
    ),
    [handleFriendPress, sortedFriends.length]
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ListRowSkeletons />
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
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add friend"
                onPress={() => setShowAddModal(true)}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <Ionicons
                  name="person-add-outline"
                  size={22}
                  color={colors.textPrimary}
                />
              </Pressable>
              <HeaderMenu />
            </View>
          ),
        }}
      />
      <View style={styles.headerSection}>
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
          <EmptyState
            icon="people-outline"
            title="No friends yet"
            message="Add someone by username, or from their profile in a game or the leaderboard."
            actionLabel="Add friend"
            onAction={() => setShowAddModal(true)}
          />
        }
      />

      <AddFriendModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddFriendSuccess}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      maxWidth: LAYOUT.contentMaxWidth,
      width: '100%',
      alignSelf: 'center' as const,
    },
    headerSection: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    list: {
      padding: 16,
      paddingTop: 0,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonPressed: {
      opacity: 0.6,
    },
  });
