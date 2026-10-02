import type { ThemeColors } from '../../config/theme';
import { useThemeColors, useThemedStyles } from '../../hooks/useThemeColors';
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
import { useSearchUsers } from '../../api/queries/useUsers';
import { useAddFriend, useIsFriend } from '../../api/queries/useFriends';
import { getApiError } from '../../api/client';
import { RADIUS, SPACING } from '../../config/constants';

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type SearchState =
  'empty' | 'searching' | 'found' | 'not_found' | 'already_friend';

export function AddFriendModal({
  visible,
  onClose,
  onSuccess,
}: AddFriendModalProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [username, setUsername] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');

  const searchQuery = useSearchUsers(searchTrigger, true);
  const foundUser =
    searchTrigger && searchQuery.isSuccess
      ? (searchQuery.data[0] ?? null)
      : null;
  const addFriend = useAddFriend();
  const friendCheck = useIsFriend(foundUser?.ulid ?? '');
  const searchState: SearchState = !searchTrigger
    ? 'empty'
    : searchQuery.isPending
      ? 'searching'
      : searchQuery.isError || !foundUser
        ? 'not_found'
        : friendCheck.isSuccess && friendCheck.data?.isFriend
          ? 'already_friend'
          : 'found';

  const handleSearch = useCallback(() => {
    const trimmed = username.trim();
    if (trimmed.length < 2) return;

    setSearchTrigger(trimmed);
  }, [username]);

  const handleClose = useCallback(() => {
    setUsername('');
    setSearchTrigger('');
    addFriend.reset();
    onClose();
  }, [onClose, addFriend]);

  const handleAddFriend = useCallback(async () => {
    if (!foundUser) return;

    try {
      await addFriend.mutateAsync(foundUser.ulid);
      onSuccess();
      handleClose();
    } catch {
      // Error handled by mutation state
    }
  }, [foundUser, addFriend, onSuccess, handleClose]);

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
              setSearchTrigger('');
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
            (!username.trim() ||
              username.trim().length < 2 ||
              searchState === 'searching') &&
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
          disabled={
            !username.trim() ||
            username.trim().length < 2 ||
            searchState === 'searching'
          }
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
