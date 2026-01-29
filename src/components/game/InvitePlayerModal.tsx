import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
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

interface SearchResult {
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [invitingUserUlid, setInvitingUserUlid] = useState<string | null>(null);
  const { data: friends, isLoading: isLoadingFriends } = useFriends();
  const invitePlayer = useInvitePlayer();
  const createInviteLink = useCreateInviteLink();

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchError('Username must be at least 2 characters');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const { data } = await apiClient.get('/users/search', {
        params: { query: searchQuery.trim() },
      });

      const results = data.data || [];
      if (results.length > 0) {
        setSearchResults(
          results.map((user: SearchResult) => ({
            ulid: user.ulid,
            username: user.username,
            avatar: user.avatar,
          }))
        );
      } else {
        setSearchError('No users found');
      }
    } catch {
      setSearchError('Failed to search for user');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteUser = async (userUlid: string) => {
    setInvitingUserUlid(userUlid);
    try {
      await invitePlayer.mutateAsync({
        gameUlid,
        userUlid,
      });
      setSearchQuery('');
      setSearchResults([]);
      setSearchError(null);
      onSuccess();
      onClose();
    } catch {
      // Error is handled by mutation state
    } finally {
      setInvitingUserUlid(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setActiveTab('users');
    setInvitingUserUlid(null);
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

  const renderUserRow = (
    user: { ulid: string; username: string; avatar: string | null },
    userUlid: string
  ) => {
    const isInviting = invitingUserUlid === userUlid;

    return (
      <View key={user.ulid} style={styles.userRow}>
        <SmartAvatar
          uri={user.avatar}
          name={user.username}
          size={40}
          disabled
        />
        <Text style={styles.userName}>{user.username}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.inviteButton,
            isInviting && styles.inviteButtonLoading,
            {
              opacity:
                pressed && !isInviting && invitingUserUlid === null ? 0.7 : 1,
            },
          ]}
          onPress={() => handleInviteUser(userUlid)}
          disabled={isInviting || invitingUserUlid !== null}
        >
          {isInviting ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={styles.inviteButtonText}>Invite</Text>
          )}
        </Pressable>
      </View>
    );
  };

  const renderUsersTab = () => (
    <>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setSearchError(null);
              if (text.trim() === '') {
                setSearchResults([]);
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
            (!searchQuery.trim() || isSearching) && styles.searchButtonDisabled,
            {
              opacity: pressed && searchQuery.trim() && !isSearching ? 0.7 : 1,
            },
          ]}
          onPress={handleSearch}
          disabled={!searchQuery.trim() || isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </Pressable>
      </View>

      {searchError && <Text style={styles.searchErrorText}>{searchError}</Text>}

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <View style={styles.userListContainer}>
            <FlashList
              data={searchResults}
              renderItem={({ item }) => renderUserRow(item, item.ulid)}
              keyExtractor={(item) => item.ulid}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      )}

      {searchResults.length === 0 && friends && friends.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <View style={styles.userListContainer}>
            <FlashList
              data={friends}
              renderItem={({ item }) =>
                renderUserRow(
                  {
                    ulid: item.ulid,
                    username: item.username,
                    avatar: item.avatar,
                  },
                  item.friendUlid
                )
              }
              keyExtractor={(item) => item.ulid}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      )}

      {searchResults.length === 0 && isLoadingFriends && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {searchResults.length === 0 &&
        !isLoadingFriends &&
        (!friends || friends.length === 0) && (
          <Text style={styles.hintText}>
            Search for a username above to invite them.
          </Text>
        )}
    </>
  );

  const renderShareTab = () => (
    <View style={styles.shareContainer}>
      <Text style={styles.shareTitle}>Invite anyone to join</Text>
      <Text style={styles.shareDescription}>
        Share via WhatsApp, Messages, Email, or any other app
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
    marginBottom: SPACING.md,
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
  searchErrorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  userListContainer: {
    height: 200,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  userName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginLeft: SPACING.md,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    minWidth: 70,
    alignItems: 'center',
  },
  inviteButtonLoading: {
    opacity: 0.7,
  },
  inviteButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.lg,
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
  shareContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: SPACING.xs,
  },
  shareDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
});
