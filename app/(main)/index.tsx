import type { ThemeColors } from '../../src/config/theme';
import {
  useThemeColors,
  useThemedStyles,
} from '../../src/hooks/useThemeColors';
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
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import {
  useRouter,
  useNavigation,
  type NativeStackNavigationProp,
} from 'expo-router';
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
import { GuestBanner } from '../../src/components/ui/GuestBanner';
import {
  GameCard,
  CreateGameModal,
  InvitationCard,
  PublicGameCard,
  type CreateGameParams,
} from '../../src/components/game-list';
import { TabBar } from '../../src/components/ui/TabBar';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { GameCardSkeleton } from '../../src/components/ui/Skeleton';
import { getApiError } from '../../src/api/client';
import { SPACING, RADIUS, LAYOUT } from '../../src/config/constants';
import { ROUTES } from '../../src/config/routes';
import { typography } from '../../src/config/typography';

type TabValue = 'active' | 'public' | 'completed';

const GAME_TABS = [
  { value: 'active' as const, label: 'Your Games' },
  { value: 'public' as const, label: 'Public' },
  { value: 'completed' as const, label: 'Completed' },
];

// Stable reference for FlatList to prevent unnecessary re-renders
const FLATLIST_DATA = [1] as const;

function PulsingDot() {
  const styles = useThemedStyles(createStyles);
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
  const styles = useThemedStyles(createStyles);
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

// Later cards appear together instead of trailing seconds behind
const MAX_STAGGERED_CARDS = 8;

export default function HomeScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
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

  // Refetch when returning to this screen (e.g. from the game board). Wait for
  // the pop animation to finish so cards don't reshuffle mid-transition.
  const navigation =
    useNavigation<
      NativeStackNavigationProp<Record<string, object | undefined>>
    >();
  useEffect(() => {
    let hasAppeared = false;

    return navigation.addListener('transitionEnd', (event) => {
      if (event.data.closing) {
        return;
      }

      // The first appearance is the initial load, which already fetches
      if (!hasAppeared) {
        hasAppeared = true;
        return;
      }

      refetch();
      if (!isGuest) {
        refetchInvitations();
      }
      refetchPublicGames();
    });
  }, [navigation, refetch, refetchInvitations, refetchPublicGames, isGuest]);

  // Cards stagger in on the first load only. Afterwards new cards fade in
  // quickly and existing cards glide to their new position.
  const [hasShownList, setHasShownList] = useState(false);
  useEffect(() => {
    if (!isLoading && !invitationsLoading) {
      setHasShownList(true);
    }
  }, [isLoading, invitationsLoading]);

  const cardEntering = useCallback(
    (index: number) =>
      hasShownList
        ? FadeIn.duration(200)
        : FadeInDown.duration(300).delay(
            Math.min(index, MAX_STAGGERED_CARDS) * 50
          ),
    [hasShownList]
  );

  // Track which invitation is being declined
  const [decliningInvitation, setDecliningInvitation] = useState<string | null>(
    null
  );

  // Navigate to last game on mount only (for app resume)
  // Lazy init so getState() runs once, not on every render.
  const [initialLastGameUlid] = useState(
    () => useNavigationStore.getState().lastGameUlid
  );
  const hasNavigatedToLastGame = useRef(false);
  useEffect(() => {
    if (!initialLastGameUlid || hasNavigatedToLastGame.current) {
      return;
    }
    hasNavigatedToLastGame.current = true;
    clearLastGameUlid();
    push(ROUTES.GAME(initialLastGameUlid));
  }, [initialLastGameUlid, clearLastGameUlid, push]);

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

  const openCreateGame = () => {
    if (isGuest && activeGames.length >= 3) {
      showGameLimitPrompt();
      return;
    }
    setShowCreateModal(true);
  };

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
        {listHeader}
        <View style={styles.content}>
          <GameCardSkeleton />
          <GameCardSkeleton />
          <GameCardSkeleton />
        </View>
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
              const position = cardIndex;
              cardIndex++;
              return (
                <Animated.View
                  key={game.ulid}
                  entering={cardEntering(position)}
                  exiting={FadeOut.duration(200)}
                  layout={LinearTransition.duration(250)}
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
              entering={FadeIn.duration(200).delay(
                hasShownList ? 0 : Math.min(cardIndex, MAX_STAGGERED_CARDS) * 50
              )}
              layout={LinearTransition.duration(250)}
            >
              <SectionHeader title="GAME INVITATIONS" />
            </Animated.View>
            {pendingInvitations.map((invitation, index) => {
              const position = cardIndex + index;
              return (
                <Animated.View
                  key={invitation.ulid || invitation.game.ulid}
                  entering={cardEntering(position)}
                  layout={LinearTransition.duration(250)}
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
              entering={FadeIn.duration(200).delay(
                hasShownList ? 0 : Math.min(cardIndex, MAX_STAGGERED_CARDS) * 50
              )}
              layout={LinearTransition.duration(250)}
            >
              <SectionHeader title="YOUR TURN" isYourTurn />
            </Animated.View>
            {yourTurnGames.map((game) => {
              const position = cardIndex;
              cardIndex++;
              return (
                <Animated.View
                  key={game.ulid}
                  entering={cardEntering(position)}
                  layout={LinearTransition.duration(250)}
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
              entering={FadeIn.duration(200).delay(
                hasShownList ? 0 : Math.min(cardIndex, MAX_STAGGERED_CARDS) * 50
              )}
              layout={LinearTransition.duration(250)}
            >
              <SectionHeader title="OPPONENT'S TURN" />
            </Animated.View>
            {opponentTurnGames.map((game) => {
              const position = cardIndex;
              cardIndex++;
              return (
                <Animated.View
                  key={game.ulid}
                  entering={cardEntering(position)}
                  layout={LinearTransition.duration(250)}
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
          <EmptyState
            icon="grid-outline"
            title="No games yet"
            message="Start a game with a friend, or join a public game."
            actionLabel="New game"
            onAction={openCreateGame}
          />
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
            entering={cardEntering(index)}
            layout={LinearTransition.duration(250)}
          >
            <PublicGameCard game={game} onPress={handlePublicGamePress} />
          </Animated.View>
        ))
      ) : (
        <EmptyState
          icon="globe-outline"
          title="No open games"
          message="Nobody is looking for players right now. Start a public game and anyone can join."
          actionLabel="New game"
          onAction={openCreateGame}
        />
      )}
    </>
  );

  const renderCompletedContent = () => (
    <>
      {completedGames.length > 0 ? (
        completedGames.map((game, index) => (
          <Animated.View
            key={game.ulid}
            entering={cardEntering(index)}
            layout={LinearTransition.duration(250)}
          >
            <GameCard
              game={game}
              userUlid={user?.ulid}
              onPress={handleGamePress}
            />
          </Animated.View>
        ))
      ) : (
        <EmptyState
          icon="trophy-outline"
          title="No finished games yet"
          message="Games you've won or lost show up here."
        />
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
          onPress={openCreateGame}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <View style={styles.fabInner}>
            <Ionicons name="add" size={32} color={colors.onPrimary} />
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      maxWidth: LAYOUT.contentMaxWidth,
      width: '100%',
      alignSelf: 'center' as const,
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
      ...typography.sectionLabel,
      color: colors.textSecondary,
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
