import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGames,
  useCreateGame,
  useDeleteGame,
  usePublicGames,
} from '../../src/api/queries/useGames';
import {
  useInvitations,
  useDeclineInvitation,
} from '../../src/api/queries/useInvitations';
import { useAuthStore } from '../../src/stores/authStore';
import { useNavigationStore } from '../../src/stores/navigationStore';
import { useFilteredGames, useGuestRestriction } from '../../src/hooks';
import { ErrorView } from '../../src/components/ui/ErrorView';
import { LoadingView } from '../../src/components/ui/LoadingView';
import { GuestBanner } from '../../src/components/ui/GuestBanner';
import {
  GameCard,
  CreateGameModal,
  InvitationCard,
  PublicGameCard,
  type CreateGameParams,
} from '../../src/components/game-list';
import { TabBar } from '../../src/components/ui/TabBar';
import { getApiError } from '../../src/api/client';
import { colors } from '../../src/config/theme';
import { SPACING, RADIUS } from '../../src/config/constants';
import { ROUTES } from '../../src/config/routes';

type TabValue = 'active' | 'public' | 'completed';

const GAME_TABS = [
  { value: 'active' as const, label: 'Your Games' },
  { value: 'public' as const, label: 'Public' },
  { value: 'completed' as const, label: 'Completed' },
];

// Stable reference for FlatList to prevent unnecessary re-renders
const FLATLIST_DATA = [1] as const;

function PulsingDot() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.set(
      withRepeat(
        withTiming(0.4, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.9 + pulse.value * 0.1 }],
  }));

  return <Animated.View style={[styles.greenDot, animatedStyle]} />;
}

function SectionHeader({
  title,
  count,
  isYourTurn,
}: {
  title: string;
  count?: number;
  isYourTurn?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {isYourTurn && <PulsingDot />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {count !== undefined && count > 0 && (
        <View style={styles.waitingBadge}>
          <Text style={styles.waitingBadgeText}>{count} Waiting</Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { push } = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isGuest, showGameLimitPrompt } = useGuestRestriction();
  const { data: games, isLoading, error, refetch } = useGames();
  const {
    data: invitations,
    isLoading: invitationsLoading,
    refetch: refetchInvitations,
  } = useInvitations();
  const { data: publicGames, refetch: refetchPublicGames } = usePublicGames();
  const createGame = useCreateGame();
  const deleteGame = useDeleteGame();
  const declineInvitation = useDeclineInvitation();
  const clearLastGameUlid = useNavigationStore((s) => s.clearLastGameUlid);

  // Refetch when screen gains focus (e.g., returning from game board)
  useFocusEffect(
    useCallback(() => {
      refetch();
      if (!isGuest) {
        refetchInvitations();
      }
      refetchPublicGames();
    }, [refetch, refetchInvitations, refetchPublicGames, isGuest])
  );

  // Track which invitation is being declined
  const [decliningInvitation, setDecliningInvitation] = useState<string | null>(
    null
  );

  // Navigate to last game on mount only (for app resume)
  // Using a ref to capture the initial value to avoid re-running when lastGameUlid changes
  const initialLastGameUlid = useRef(
    useNavigationStore.getState().lastGameUlid
  );
  useEffect(() => {
    if (initialLastGameUlid.current) {
      const gameUlid = initialLastGameUlid.current;
      initialLastGameUlid.current = null;
      clearLastGameUlid();
      // Small delay to ensure index is in navigation stack before pushing
      // This ensures router.canGoBack() works correctly on game screen
      setTimeout(() => {
        push(ROUTES.GAME(gameUlid));
      }, 50);
    }
  }, [clearLastGameUlid, push]);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const tabOpacity = useSharedValue(1);
  const tabTranslateY = useSharedValue(0);

  const tabContentStyle = useAnimatedStyle(() => ({
    opacity: tabOpacity.value,
    transform: [{ translateY: tabTranslateY.value }],
  }));

  const handleTabChange = useCallback(
    (newTab: TabValue) => {
      if (newTab === activeTab) return;
      tabOpacity.set(0);
      tabTranslateY.set(10);
      setActiveTab(newTab);
      tabOpacity.set(withTiming(1, { duration: 200 }));
      tabTranslateY.set(withTiming(0, { duration: 200 }));
    },
    [activeTab, tabOpacity, tabTranslateY]
  );

  const {
    activeGames,
    completedGames,
    yourTurnGames,
    opponentTurnGames,
    awaitingOpponentGames,
  } = useFilteredGames(games);

  // Memoize FlatList components to prevent unnecessary re-renders
  // Must be before any conditional returns to satisfy React hooks rules
  const listHeader = useMemo(
    () => (
      <>
        {isGuest && <GuestBanner />}
        <TabBar tabs={GAME_TABS} value={activeTab} onChange={handleTabChange} />
      </>
    ),
    [isGuest, activeTab, handleTabChange]
  );

  const keyExtractor = useCallback(() => 'content', []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isGuest) {
      await Promise.all([refetch(), refetchPublicGames()]);
    } else {
      await Promise.all([
        refetch(),
        refetchInvitations(),
        refetchPublicGames(),
      ]);
    }
    setRefreshing(false);
  };

  const handleGamePress = useCallback(
    (gameUlid: string) => {
      push(ROUTES.GAME(gameUlid));
    },
    [push]
  );

  const handleGameDelete = useCallback(
    (gameUlid: string) => {
      Alert.alert(
        'Delete Game',
        'Are you sure you want to delete this game? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteGame.mutateAsync(gameUlid);
              } catch (e) {
                Alert.alert('Error', getApiError(e).message);
              }
            },
          },
        ]
      );
    },
    [deleteGame]
  );

  const handleInvitationPress = useCallback(
    (gameUlid: string, invitationUlid: string) => {
      push(`${ROUTES.GAME(gameUlid)}?invitation=${invitationUlid}`);
    },
    [push]
  );

  const handleInvitationDecline = useCallback(
    async (invitationUlid: string) => {
      setDecliningInvitation(invitationUlid);
      try {
        await declineInvitation.mutateAsync(invitationUlid);
      } catch (e) {
        const error = getApiError(e);
        Alert.alert('Error', error.message);
      } finally {
        setDecliningInvitation(null);
      }
    },
    [declineInvitation]
  );

  const handlePublicGamePress = useCallback(
    (gameUlid: string) => {
      push(ROUTES.GAME(gameUlid));
    },
    [push]
  );

  const handleCreateGame = async (params: CreateGameParams) => {
    try {
      const result = await createGame.mutateAsync(params);
      setShowCreateModal(false);
      if (!params.is_public) {
        push(ROUTES.GAME(result.ulid));
      }
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading || invitationsLoading) {
    return (
      <View style={styles.container}>
        <LoadingView />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorView
          message="Unable to load your games. Please check your connection and try again."
          onRetry={refetch}
        />
      </View>
    );
  }

  const renderActiveContent = () => {
    let cardIndex = 0;
    const pendingInvitations = invitations ?? [];

    return (
      <>
        {/* Awaiting Opponent Section - First */}
        {awaitingOpponentGames.length > 0 && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
          >
            <SectionHeader title="AWAITING OPPONENT" />
            {awaitingOpponentGames.map((game) => {
              const delay = cardIndex * 50;
              cardIndex++;
              return (
                <Animated.View
                  key={game.ulid}
                  entering={FadeInDown.duration(300).delay(delay)}
                  exiting={FadeOut.duration(200)}
                >
                  <GameCard
                    game={game}
                    userUlid={user?.ulid}
                    onPress={handleGamePress}
                    onDelete={handleGameDelete}
                  />
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* Invitations Section */}
        {pendingInvitations.length > 0 && (
          <>
            <Animated.View
              entering={FadeIn.duration(200).delay(cardIndex * 50)}
            >
              <SectionHeader title="GAME INVITATIONS" />
            </Animated.View>
            {pendingInvitations.map((invitation, index) => {
              const delay = cardIndex * 50 + index * 50;
              return (
                <Animated.View
                  key={invitation.ulid || invitation.game.ulid}
                  entering={FadeInDown.duration(300).delay(delay)}
                >
                  <InvitationCard
                    invitation={invitation}
                    onPress={handleInvitationPress}
                    onDecline={handleInvitationDecline}
                    isDeclining={decliningInvitation === invitation.ulid}
                  />
                </Animated.View>
              );
            })}
          </>
        )}

        {yourTurnGames.length > 0 && (
          <>
            <Animated.View
              entering={FadeIn.duration(200).delay(cardIndex * 50)}
            >
              <SectionHeader title="YOUR TURN" isYourTurn />
            </Animated.View>
            {yourTurnGames.map((game) => {
              const delay = cardIndex * 50;
              cardIndex++;
              return (
                <Animated.View
                  key={game.ulid}
                  entering={FadeInDown.duration(300).delay(delay)}
                >
                  <GameCard
                    game={game}
                    userUlid={user?.ulid}
                    onPress={handleGamePress}
                  />
                </Animated.View>
              );
            })}
          </>
        )}
        {opponentTurnGames.length > 0 && (
          <>
            <Animated.View
              entering={FadeIn.duration(200).delay(cardIndex * 50)}
            >
              <SectionHeader title="OPPONENT'S TURN" />
            </Animated.View>
            {opponentTurnGames.map((game) => {
              const delay = cardIndex * 50;
              cardIndex++;
              return (
                <Animated.View
                  key={game.ulid}
                  entering={FadeInDown.duration(300).delay(delay)}
                >
                  <GameCard
                    game={game}
                    userUlid={user?.ulid}
                    onPress={handleGamePress}
                  />
                </Animated.View>
              );
            })}
          </>
        )}
        {activeGames.length === 0 && (
          <Animated.View
            style={styles.emptyContainer}
            entering={FadeIn.duration(300)}
          >
            <Text style={styles.emptyText}>No active games</Text>
            <Text style={styles.emptySubtext}>
              Create a new game or join a public one to get started!
            </Text>
          </Animated.View>
        )}
      </>
    );
  };

  const renderPublicContent = () => (
    <>
      {publicGames && publicGames.length > 0 ? (
        publicGames.map((game, index) => (
          <Animated.View
            key={game.ulid}
            entering={FadeInDown.duration(300).delay(index * 50)}
          >
            <PublicGameCard game={game} onPress={handlePublicGamePress} />
          </Animated.View>
        ))
      ) : (
        <Animated.View
          style={styles.emptyContainer}
          entering={FadeIn.duration(300)}
        >
          <Text style={styles.emptyText}>No public games</Text>
          <Text style={styles.emptySubtext}>
            Create a public game and let others join!
          </Text>
        </Animated.View>
      )}
    </>
  );

  const renderCompletedContent = () => (
    <>
      {completedGames.length > 0 ? (
        completedGames.map((game, index) => (
          <Animated.View
            key={game.ulid}
            entering={FadeInDown.duration(300).delay(index * 50)}
          >
            <GameCard
              game={game}
              userUlid={user?.ulid}
              onPress={handleGamePress}
            />
          </Animated.View>
        ))
      ) : (
        <Animated.View
          style={styles.emptyContainer}
          entering={FadeIn.duration(300)}
        >
          <Text style={styles.emptyText}>No completed games</Text>
          <Text style={styles.emptySubtext}>
            Your finished games will appear here.
          </Text>
        </Animated.View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={FLATLIST_DATA}
        renderItem={() => (
          <Animated.View style={[styles.content, tabContentStyle]}>
            {activeTab === 'active' && renderActiveContent()}
            {activeTab === 'public' && renderPublicContent()}
            {activeTab === 'completed' && renderCompletedContent()}
          </Animated.View>
        )}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
      />

      <Animated.View style={styles.fabContainer}>
        <Pressable
          onPress={() => {
            if (isGuest && activeGames.length >= 3) {
              showGameLimitPrompt();
              return;
            }
            setShowCreateModal(true);
          }}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <View style={styles.fabInner}>
            <Ionicons name="add" size={32} color="#FFF" />
          </View>
        </Pressable>
      </Animated.View>

      <CreateGameModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateGame}
        isPending={createGame.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  waitingBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
  },
  waitingBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.7,
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
