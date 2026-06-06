/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameCard } from '../GameCard';
import type { GameListItem, GameListPlayer } from '../../../types';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`ionicon-${name}`}>{name}</Text>;
  },
}));

// Mock Avatar component
jest.mock('../../ui/Avatar', () => ({
  Avatar: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID="avatar">{name}</Text>;
  },
}));

// Mock SmartAvatar component
jest.mock('../../ui/SmartAvatar', () => ({
  SmartAvatar: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID="smart-avatar">{name}</Text>;
  },
}));

// Mock timeAgo utility
jest.mock('../../../utils/timeAgo', () => ({
  timeAgo: () => '2 hours ago',
}));

// Mock TurnTimer component
jest.mock('../../game/TurnTimer', () => ({
  TurnTimer: ({
    expiresAt,
    isMyTurn,
  }: {
    expiresAt: string | null;
    isMyTurn: boolean;
  }) => {
    const { Text } = require('react-native');
    if (!expiresAt || !isMyTurn) return null;
    return <Text testID="turn-timer">24h</Text>;
  },
}));

const MY_ULID = '01hxyz000000000player01';
const OPPONENT_ULID = '01hxyz00000000opponent';

const mockPlayer = (
  overrides: Partial<GameListPlayer> = {}
): GameListPlayer => ({
  ulid: OPPONENT_ULID,
  username: 'opponent_user',
  avatar: null,
  avatarColor: null,
  score: 95,
  isCurrentTurn: false,
  isMe: false,
  hasLeft: false,
  ...overrides,
});

const mockGame: GameListItem = {
  ulid: '01hxyz000000000game0001',
  language: 'en',
  status: 'active',
  maxPlayers: 2,
  players: [
    mockPlayer({
      ulid: MY_ULID,
      username: 'me',
      score: 120,
      isCurrentTurn: true,
      isMe: true,
    }),
    mockPlayer({ ulid: OPPONENT_ULID, username: 'opponent_user', score: 95 }),
  ],
  myScore: 120,
  isMyTurn: true,
  winnerUlid: null,
  updatedAt: new Date().toISOString(),
  lastMoveDescription: 'Played HELLO for 12 points',
  turnExpiresAt: null,
  pendingInvitation: null,
  isPublic: false,
};

function renderCard(game: GameListItem, userUlid = MY_ULID) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <GameCard game={game} userUlid={userUlid} onPress={mockOnPress} />
    </QueryClientProvider>
  );
}

const mockOnPress = jest.fn();

describe('GameCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders opponent name', () => {
    renderCard(mockGame);

    // Multiple elements may contain the name (avatar + card), check at least one exists
    expect(screen.getAllByText('opponent_user').length).toBeGreaterThan(0);
  });

  it('renders scores correctly', () => {
    renderCard(mockGame);

    expect(screen.getByText('120')).toBeTruthy();
    expect(screen.getByText('95')).toBeTruthy();
  });

  it('shows all three scores for a 3-player game and marks the left player', () => {
    const threePlayerGame: GameListItem = {
      ...mockGame,
      maxPlayers: 3,
      players: [
        mockPlayer({
          ulid: MY_ULID,
          username: 'me',
          score: 214,
          isCurrentTurn: true,
          isMe: true,
        }),
        mockPlayer({ ulid: '01player02', username: 'jess', score: 289 }),
        mockPlayer({
          ulid: '01player03',
          username: 'tom',
          score: 176,
          hasLeft: true,
        }),
      ],
    };

    renderCard(threePlayerGame);

    expect(screen.getByText('214')).toBeTruthy();
    expect(screen.getByText('289')).toBeTruthy();

    const leftScore = screen.getByText('176');
    expect(leftScore).toBeTruthy();
    // The left player's score is struck-through.
    const flattened = Array.isArray(leftScore.props.style)
      ? Object.assign({}, ...leftScore.props.style.filter(Boolean))
      : leftScore.props.style;
    expect(flattened.textDecorationLine).toBe('line-through');

    // The other players' names are comma-joined in the header.
    expect(screen.getAllByText('jess, tom').length).toBeGreaterThan(0);
  });

  it('renders last move description', () => {
    renderCard(mockGame);

    expect(screen.getByText('played "HELLO" +12')).toBeTruthy();
  });

  it('renders time ago', () => {
    renderCard(mockGame);

    expect(screen.getByText('2 hours ago')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    renderCard(mockGame);

    const playButton = screen.getByText('Play');
    fireEvent.press(playButton);

    expect(mockOnPress).toHaveBeenCalled();
  });

  it('shows Play button for active games when it is my turn', () => {
    renderCard(mockGame);

    expect(screen.getByText('Play')).toBeTruthy();
  });

  it('shows View button for active games when it is opponent turn', () => {
    const opponentTurnGame: GameListItem = {
      ...mockGame,
      isMyTurn: false,
      lastMoveDescription: 'opponent_user played HELLO for 12 points',
    };

    renderCard(opponentTurnGame);

    expect(screen.getByText('View')).toBeTruthy();
    expect(screen.getByText('You played "HELLO" +12')).toBeTruthy();
  });

  it('shows Won badge and placement for finished games when user won', () => {
    const finishedGame: GameListItem = {
      ...mockGame,
      status: 'finished',
      winnerUlid: MY_ULID,
    };

    renderCard(finishedGame);

    expect(screen.getByText('Won')).toBeTruthy();
    expect(screen.getByText('1st of 2')).toBeTruthy();
  });

  it('shows Lost badge for finished games when user lost', () => {
    const finishedGame: GameListItem = {
      ...mockGame,
      status: 'finished',
      winnerUlid: OPPONENT_ULID,
      players: [
        mockPlayer({
          ulid: MY_ULID,
          username: 'me',
          score: 95,
          isMe: true,
        }),
        mockPlayer({
          ulid: OPPONENT_ULID,
          username: 'opponent_user',
          score: 120,
        }),
      ],
    };

    renderCard(finishedGame);

    expect(screen.getByText('Lost')).toBeTruthy();
    expect(screen.getByText('2nd of 2')).toBeTruthy();
  });

  it('shows invite text when no other players', () => {
    const pendingGame: GameListItem = {
      ...mockGame,
      maxPlayers: 2,
      players: [
        mockPlayer({
          ulid: MY_ULID,
          username: 'me',
          score: 0,
          isCurrentTurn: false,
          isMe: true,
        }),
      ],
      status: 'pending',
      lastMoveDescription: null,
      isPublic: false,
    };

    renderCard(pendingGame);

    expect(screen.getByText('Invite a player')).toBeTruthy();
    expect(screen.getByText('Tap to find an opponent')).toBeTruthy();
  });

  it('shows Start now button for the creator of a pending game with 2+ players', () => {
    const pendingGame: GameListItem = {
      ...mockGame,
      maxPlayers: 3,
      status: 'pending',
      lastMoveDescription: null,
      players: [
        mockPlayer({
          ulid: MY_ULID,
          username: 'me',
          score: 0,
          isMe: true,
        }),
        mockPlayer({ ulid: '01player02', username: 'jess', score: 0 }),
      ],
    };

    renderCard(pendingGame);

    expect(screen.getByText('Start now')).toBeTruthy();
  });

  it('shows "Game in progress" when no last move description', () => {
    const gameInProgress: GameListItem = {
      ...mockGame,
      lastMoveDescription: null,
    };

    renderCard(gameInProgress);

    expect(screen.getByText('Game in progress')).toBeTruthy();
  });

  it('shows turn timer when it is my turn and turnExpiresAt is set', () => {
    const gameWithTimer: GameListItem = {
      ...mockGame,
      isMyTurn: true,
      turnExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };

    renderCard(gameWithTimer);

    expect(screen.getByTestId('turn-timer')).toBeTruthy();
  });

  it('does not show turn timer when it is not my turn', () => {
    const gameNotMyTurn: GameListItem = {
      ...mockGame,
      isMyTurn: false,
      turnExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };

    renderCard(gameNotMyTurn);

    expect(screen.queryByTestId('turn-timer')).toBeNull();
  });

  it('does not show turn timer when turnExpiresAt is null', () => {
    const gameNoExpiry: GameListItem = {
      ...mockGame,
      isMyTurn: true,
      turnExpiresAt: null,
    };

    renderCard(gameNoExpiry);

    expect(screen.queryByTestId('turn-timer')).toBeNull();
  });

  it('does not show turn timer for finished games', () => {
    const finishedGame: GameListItem = {
      ...mockGame,
      status: 'finished',
      winnerUlid: MY_ULID,
      turnExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };

    renderCard(finishedGame);

    // Timer should not render even if turnExpiresAt is set because isMyTurn logic
    // won't apply for finished games in the card display
    expect(screen.queryByTestId('turn-timer')).toBeNull();
  });
});
