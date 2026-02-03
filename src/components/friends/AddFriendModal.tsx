import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BaseModal } from '../ui/BaseModal';
import { SmartAvatar } from '../ui/SmartAvatar';
import { useSearchUsers, type UserSearchResult } from '../../api/queries/useUsers';
import { useAddFriend, useIsFriend } from '../../api/queries/useFriends';
import { getApiError } from '../../api/client';
import { colors } from '../../config/theme';
import { RADIUS, SPACING } from '../../config/constants';

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type SearchState = 'empty' | 'searching' | 'found' | 'not_found' | 'already_friend';

export function AddFriendModal({
  visible,
  onClose,
  onSuccess,
}: AddFriendModalProps) {
  const [username, setUsername] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');
  const [searchState, setSearchState] = useState<SearchState>('empty');
  const [foundUser, setFoundUser] = useState<UserSearchResult | null>(null);

  const searchQuery = useSearchUsers(searchTrigger, true);
  const addFriend = useAddFriend();
  const friendCheck = useIsFriend(foundUser?.ulid ?? '');

  const handleSearch = useCallback(() => {
    const trimmed = username.trim();
    if (trimmed.length < 2) return;

    setSearchState('searching');
    setFoundUser(null);
    setSearchTrigger(trimmed);
  }, [username]);

  // Handle search result
  React.useEffect(() => {
    if (!searchTrigger) return;

    if (searchQuery.isLoading) {
      setSearchState('searching');
      return;
    }

    if (searchQuery.isError) {
      setSearchState('not_found');
      return;
    }

    if (searchQuery.data) {
      if (searchQuery.data.length === 0) {
        setSearchState('not_found');
        setFoundUser(null);
      } else {
        setFoundUser(searchQuery.data[0] ?? null);
        setSearchState('found');
      }
    }
  }, [searchTrigger, searchQuery.isLoading, searchQuery.isError, searchQuery.data]);

  // Check if user is already a friend
  React.useEffect(() => {
    if (searchState === 'found' && friendCheck.data?.isFriend) {
      setSearchState('already_friend');
    }
  }, [searchState, friendCheck.data?.isFriend]);

  const handleAddFriend = useCallback(async () => {
    if (!foundUser) return;

    try {
      await addFriend.mutateAsync(foundUser.ulid);
      onSuccess();
      handleClose();
    } catch {
      // Error handled by mutation state
    }
  }, [foundUser, addFriend, onSuccess]);

  const handleClose = useCallback(() => {
    setUsername('');
    setSearchTrigger('');
    setSearchState('empty');
    setFoundUser(null);
    addFriend.reset();
    onClose();
  }, [onClose, addFriend]);

  const errorMessage = addFriend.error
    ? getApiError(addFriend.error).message
    : null;

  const renderContent = () => {
    if (searchState === 'searching') {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.stateText}>Searching...</Text>
        </View>
      );
    }

    if (searchState === 'not_found') {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="person-outline" size={32} color={colors.textMuted} />
          <Text style={styles.stateText}>User not found</Text>
          <Text style={styles.stateSubtext}>
            Check the username and try again
          </Text>
        </View>
      );
    }

    if (searchState === 'already_friend' && foundUser) {
      return (
        <View style={styles.userCard}>
          <SmartAvatar
            uri={foundUser.avatar}
            name={foundUser.username}
            size={48}
            backgroundColor={foundUser.avatarColor ?? undefined}
            disabled
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{foundUser.username}</Text>
            <Text style={styles.userRating}>ELO: {foundUser.eloRating}</Text>
          </View>
          <View style={styles.alreadyFriendBadge}>
            <Text style={styles.alreadyFriendText}>Already friends</Text>
          </View>
        </View>
      );
    }

    if (searchState === 'found' && foundUser) {
      return (
        <View style={styles.userCard}>
          <SmartAvatar
            uri={foundUser.avatar}
            name={foundUser.username}
            size={48}
            backgroundColor={foundUser.avatarColor ?? undefined}
            disabled
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{foundUser.username}</Text>
            <Text style={styles.userRating}>ELO: {foundUser.eloRating}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              addFriend.isPending && styles.addButtonLoading,
              { opacity: pressed && !addFriend.isPending ? 0.7 : 1 },
            ]}
            onPress={handleAddFriend}
            disabled={addFriend.isPending}
          >
            {addFriend.isPending ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Text style={styles.addButtonText}>Add</Text>
            )}
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer}>
        <Text style={styles.hintText}>
          Enter a username to find and add a friend
        </Text>
      </View>
    );
  };

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      overlayOpacity={0.7}
      backdropBlur
      contentStyle={styles.modal}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Add Friend</Text>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [
            styles.closeButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="person"
            size={18}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter exact username"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (searchState !== 'empty') {
                setSearchState('empty');
                setFoundUser(null);
                setSearchTrigger('');
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.searchButton,
            (!username.trim() || username.trim().length < 2 || searchState === 'searching') &&
              styles.searchButtonDisabled,
            {
              opacity:
                pressed &&
                username.trim().length >= 2 &&
                searchState !== 'searching'
                  ? 0.7
                  : 1,
            },
          ]}
          onPress={handleSearch}
          disabled={!username.trim() || username.trim().length < 2 || searchState === 'searching'}
        >
          {searchState === 'searching' ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </Pressable>
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {renderContent()}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.backgroundLight,
    margin: SPACING.xxl,
    padding: SPACING.xxl,
    borderRadius: RADIUS.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      paddingVertical: 0,
    }),
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: colors.buttonSecondary,
    opacity: 0.6,
  },
  searchButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  stateContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  stateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: SPACING.sm,
  },
  stateSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: SPACING.xs,
  },
  hintText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  userRating: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  addButtonLoading: {
    opacity: 0.7,
  },
  addButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  alreadyFriendBadge: {
    backgroundColor: colors.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  alreadyFriendText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
});
