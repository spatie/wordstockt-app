import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../config/theme';
import { RADIUS, SPACING } from '../../config/constants';
import { useFriends } from '../../api/queries/useFriends';
import { useInvitePlayer } from '../../api/queries/useInvites';
import { useCreateInviteLink } from '../../api/queries/useInviteLink';
import { apiClient, getApiError } from '../../api/client';
import { BaseModal } from '../ui/BaseModal';
import { Button } from '../ui/Button';
import { SmartAvatar } from '../ui/SmartAvatar';
import { TabBar } from '../ui/TabBar';

type TabValue = 'users' | 'share';

interface SelectedUser {
  ulid: string;
  username: string;
  avatar: string | null;
}

interface InvitePlayerModalProps {
  visible: boolean;
  onClose: () => void;
  gameUlid: string;
  onSuccess: () => void;
}

const INVITE_TABS = [
  { value: 'users' as const, label: 'Friends & Users' },
  { value: 'share' as const, label: 'Share Link' },
];

export function InvitePlayerModal({
  visible,
  onClose,
  gameUlid,
  onSuccess,
}: InvitePlayerModalProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { data: friends, isLoading: isLoadingFriends } = useFriends();
  const invitePlayer = useInvitePlayer();
  const createInviteLink = useCreateInviteLink();

  const handleSelectFriend = (friend: SelectedUser) => {
    setSelectedUser(friend);
    setSearchQuery('');
    setSearchError(null);
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchError('Username must be at least 2 characters');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const { data } = await apiClient.get('/users/search', {
        params: { query: searchQuery.trim() },
      });

      const matchedUser = data.data?.find(
        (user: { username: string }) =>
          user.username.toLowerCase() === searchQuery.trim().toLowerCase()
      );

      if (matchedUser) {
        setSelectedUser({
          ulid: matchedUser.ulid,
          username: matchedUser.username,
          avatar: matchedUser.avatar,
        });
        setSearchQuery('');
      } else {
        setSearchError('No user found with that name...');
      }
    } catch {
      setSearchError('Failed to search for user');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedUser) return;

    try {
      await invitePlayer.mutateAsync({
        gameUlid,
        userUlid: selectedUser.ulid,
      });
      setSearchQuery('');
      setSelectedUser(null);
      setSearchError(null);
      onSuccess();
      onClose();
    } catch {
      // Error is handled by mutation state
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setSearchError(null);
    setActiveTab('users');
    invitePlayer.reset();
    createInviteLink.reset();
    onClose();
  };

  const handleShareLink = async () => {
    try {
      const result = await createInviteLink.mutateAsync(gameUlid);
      await Share.share({
        message: `Join me on WordStockt! ${result.url}`,
        ...(Platform.OS === 'ios' && { url: result.url }),
      });
    } catch {
      // User cancelled or error handled by mutation state
    }
  };

  const errorMessage = invitePlayer.error
    ? getApiError(invitePlayer.error).message
    : null;

  const linkErrorMessage = createInviteLink.error
    ? getApiError(createInviteLink.error).message
    : null;

  const canInvite = !!selectedUser;
  const showFriendsList = !selectedUser && friends && friends.length > 0;

  const renderUsersTab = () => (
    <>
      {selectedUser && (
        <TouchableOpacity
          style={styles.selectedUserCard}
          onPress={() => setSelectedUser(null)}
        >
          <SmartAvatar
            uri={selectedUser.avatar}
            name={selectedUser.username}
            size={48}
            disabled
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{selectedUser.username}</Text>
          </View>
          <Text style={styles.clearIcon}>×</Text>
        </TouchableOpacity>
      )}

      {!selectedUser && (
        <>
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>+</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Type a username"
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setSearchError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.searchButton,
                (!searchQuery.trim() || isSearching) &&
                  styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {searchError && (
            <Text style={styles.searchErrorText}>{searchError}</Text>
          )}
        </>
      )}

      {showFriendsList && (
        <View style={styles.friendsSection}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <ScrollView
            style={styles.friendsList}
            showsVerticalScrollIndicator={false}
          >
            {friends.map((friend) => (
              <TouchableOpacity
                key={friend.ulid}
                style={styles.friendItem}
                onPress={() =>
                  handleSelectFriend({
                    ulid: friend.friendUlid,
                    username: friend.username,
                    avatar: friend.avatar,
                  })
                }
              >
                <SmartAvatar
                  uri={friend.avatar}
                  name={friend.username}
                  size={40}
                  disabled
                />
                <Text style={styles.friendName}>{friend.username}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {!selectedUser && isLoadingFriends && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {!selectedUser &&
        !isLoadingFriends &&
        (!friends || friends.length === 0) && (
          <Text style={styles.hintText}>
            No friends yet. Type a username above.
          </Text>
        )}

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <Button
        label="Send Invitation"
        onPress={handleInvite}
        disabled={!canInvite}
        loading={invitePlayer.isPending}
        fullWidth
        rounded
        size="lg"
      />
    </>
  );

  const renderShareTab = () => (
    <View style={styles.shareContainer}>
      <View style={styles.shareIconContainer}>
        <Ionicons name="share-outline" size={48} color={colors.primary} />
      </View>

      <Text style={styles.shareTitle}>Share Invite Link</Text>
      <Text style={styles.shareDescription}>
        Share a link via WhatsApp, Messages, Email, or any other app. Anyone
        with the link can join your game.
      </Text>

      {linkErrorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{linkErrorMessage}</Text>
        </View>
      )}

      <Button
        label="Share Invite Link"
        onPress={handleShareLink}
        loading={createInviteLink.isPending}
        fullWidth
        rounded
        size="lg"
      />
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      overlayOpacity={0.7}
      backdropBlur
      contentStyle={styles.modal}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Invite Player</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TabBar tabs={INVITE_TABS} value={activeTab} onChange={setActiveTab} />
      </View>

      {activeTab === 'users' ? renderUsersTab() : renderShareTab()}
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
  tabContainer: {
    marginBottom: SPACING.lg,
    marginHorizontal: -SPACING.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
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
    fontSize: 20,
    color: colors.primary,
    marginRight: SPACING.sm,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
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
  searchErrorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  clearIcon: {
    fontSize: 24,
    color: colors.textSecondary,
    paddingHorizontal: SPACING.sm,
  },
  userInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  friendsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  friendsList: {
    maxHeight: 160,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginLeft: SPACING.md,
  },
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  shareContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  shareIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: SPACING.sm,
  },
  shareDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xxl,
  },
});
