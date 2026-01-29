/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GameCard } from '../GameCard';
import type { GameListItem } from '../../../types';

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

const mockGame: GameListItem = {
  ulid: '01hxyz000000000game0001',
  language: 'en',
  status: 'active',
  opponent: {
    ulid: '01hxyz00000000opponent',
    username: 'opponent_user',
    avatar: null,
    avatarColor: null,
  },
  myScore: 120,
  opponentScore: 95,
  isMyTurn: true,
  winnerUlid: null,
  updatedAt: new Date().toISOString(),
  lastMoveDescription: 'Played HELLO for 12 points',
  turnExpiresAt: null,
  pendingInvitation: null,
  isPublic: false,
};

describe('GameCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders opponent name', () => {
    render(
      <GameCard
        game={mockGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    // Multiple elements may contain the name (avatar + card), check at least one exists
    expect(screen.getAllByText('opponent_user').length).toBeGreaterThan(0);
  });

  it('renders scores correctly', () => {
    render(
      <GameCard
        game={mockGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText(/120/)).toBeTruthy();
    expect(screen.getByText(/95/)).toBeTruthy();
  });

  it('renders last move description', () => {
    render(
      <GameCard
        game={mockGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('played "HELLO" +12')).toBeTruthy();
  });

  it('renders time ago', () => {
    render(
      <GameCard
        game={mockGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('2 hours ago')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    render(
      <GameCard
        game={mockGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    const playButton = screen.getByText('Play');
    fireEvent.press(playButton);

    expect(mockOnPress).toHaveBeenCalled();
  });

  it('shows Play button for active games when it is my turn', () => {
    render(
      <GameCard
        game={mockGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('Play')).toBeTruthy();
  });

  it('shows View button for active games when it is opponent turn', () => {
    const opponentTurnGame: GameListItem = {
      ...mockGame,
      isMyTurn: false,
      lastMoveDescription: 'opponent_user played HELLO for 12 points',
    };

    render(
      <GameCard
        game={opponentTurnGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('View')).toBeTruthy();
    expect(screen.getByText('You played "HELLO" +12')).toBeTruthy();
  });

  it('shows Won badge for finished games when user won', () => {
    const finishedGame: GameListItem = {
      ...mockGame,
      status: 'finished',
      winnerUlid: '01hxyz000000000player01',
    };

    render(
      <GameCard
        game={finishedGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('Won')).toBeTruthy();
  });

  it('shows Lost badge for finished games when user lost', () => {
    const finishedGame: GameListItem = {
      ...mockGame,
      status: 'finished',
      winnerUlid: '01hxyz00000000opponent',
    };

    render(
      <GameCard
        game={finishedGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('Lost')).toBeTruthy();
  });

  it('shows invite text when no opponent', () => {
    const pendingGame: GameListItem = {
      ...mockGame,
      opponent: null,
      status: 'pending',
      lastMoveDescription: null,
      isPublic: false,
    };

    render(
      <GameCard
        game={pendingGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('Invite a player')).toBeTruthy();
    expect(screen.getByText('Tap to find an opponent')).toBeTruthy();
  });

  it('shows "Game in progress" when no last move description', () => {
    const gameInProgress: GameListItem = {
      ...mockGame,
      lastMoveDescription: null,
    };

    render(
      <GameCard
        game={gameInProgress}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('Game in progress')).toBeTruthy();
  });

  it('shows turn timer when it is my turn and turnExpiresAt is set', () => {
    const gameWithTimer: GameListItem = {
      ...mockGame,
      isMyTurn: true,
      turnExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };

    render(
      <GameCard
        game={gameWithTimer}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.getByTestId('turn-timer')).toBeTruthy();
  });

  it('does not show turn timer when it is not my turn', () => {
    const gameNotMyTurn: GameListItem = {
      ...mockGame,
      isMyTurn: false,
      turnExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };

    render(
      <GameCard
        game={gameNotMyTurn}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.queryByTestId('turn-timer')).toBeNull();
  });

  it('does not show turn timer when turnExpiresAt is null', () => {
    const gameNoExpiry: GameListItem = {
      ...mockGame,
      isMyTurn: true,
      turnExpiresAt: null,
    };

    render(
      <GameCard
        game={gameNoExpiry}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    expect(screen.queryByTestId('turn-timer')).toBeNull();
  });

  it('does not show turn timer for finished games', () => {
    const finishedGame: GameListItem = {
      ...mockGame,
      status: 'finished',
      winnerUlid: '01hxyz000000000player01',
      turnExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };

    render(
      <GameCard
        game={finishedGame}
        userUlid="01hxyz000000000player01"
        onPress={mockOnPress}
      />
    );

    // Timer should not render even if turnExpiresAt is set because isMyTurn logic
    // won't apply for finished games in the card display
    expect(screen.queryByTestId('turn-timer')).toBeNull();
  });
});
