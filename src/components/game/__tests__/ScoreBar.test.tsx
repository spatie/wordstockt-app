import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ScoreBar } from '../ScoreBar';
import type { Game } from '../../../types';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  Text: ({
    children,
    style,
  }: {
    children: React.ReactNode;
    style?: object;
  }) => {
    const { Text } = require('react-native');
    return <Text style={style}>{children}</Text>;
  },
  MD3DarkTheme: {
    colors: {
      primary: '#4A90D9',
      secondary: '#3D5A80',
      error: '#E91E63',
      background: '#0D1B2A',
      surface: '#1B2838',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onBackground: '#FFFFFF',
      onSurface: '#FFFFFF',
    },
  },
}));

const createMockGame = (overrides: Partial<Game> = {}): Game => ({
  ulid: '01hxyz000000000game0001',
  language: 'en',
  status: 'active',
  board: [],
  boardTemplate: [],
  players: [
    {
      ulid: '01hxyz000000000player01',
      username: 'player1',
      avatar: null,
      avatarColor: null,
      score: 10,
      rackCount: 7,
      isCurrentTurn: true,
    },
    {
      ulid: '01hxyz00000000opponent',
      username: 'opponent',
      avatar: null,
      avatarColor: null,
      score: 20,
      rackCount: 7,
      isCurrentTurn: false,
    },
  ],
  myRack: [],
  tilesRemaining: 80,
  currentTurnUserUlid: '01hxyz000000000player01',
  winnerUlid: null,
  isLastMove: false,
  lastMove: null,
  turnExpiresAt: null,
  pendingInvitation: null,
  isPublic: false,
  canJoin: false,
  ...overrides,
});

describe('ScoreBar', () => {
  it('renders opponent name when opponent exists', () => {
    const game = createMockGame();
    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.getByText('OPPONENT')).toBeTruthy();
    expect(screen.getByText('YOU')).toBeTruthy();
  });

  it('renders scores for both players', () => {
    const game = createMockGame();
    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
  });

  it('renders tiles remaining', () => {
    const game = createMockGame({ tilesRemaining: 50 });
    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.getByText('50')).toBeTruthy();
    expect(screen.getByText('Tiles')).toBeTruthy();
  });

  it('shows INVITE button when no opponent and game is pending', () => {
    const game = createMockGame({
      status: 'pending',
      players: [
        {
          ulid: '01hxyz000000000player01',
          username: 'player1',
          avatar: null,
          avatarColor: null,
          score: 0,
          rackCount: 7,
          isCurrentTurn: true,
        },
      ],
    });
    const onInvite = jest.fn();

    render(
      <ScoreBar
        game={game}
        currentUserUlid="01hxyz000000000player01"
        onInvite={onInvite}
      />
    );

    expect(screen.getByText('INVITE')).toBeTruthy();
  });

  it('calls onInvite when INVITE button is pressed', () => {
    const game = createMockGame({
      status: 'pending',
      players: [
        {
          ulid: '01hxyz000000000player01',
          username: 'player1',
          avatar: null,
          avatarColor: null,
          score: 0,
          rackCount: 7,
          isCurrentTurn: true,
        },
      ],
    });
    const onInvite = jest.fn();

    render(
      <ScoreBar
        game={game}
        currentUserUlid="01hxyz000000000player01"
        onInvite={onInvite}
      />
    );

    fireEvent.press(screen.getByText('INVITE'));

    expect(onInvite).toHaveBeenCalledTimes(1);
  });

  it('does not show INVITE button when opponent exists', () => {
    const game = createMockGame();
    const onInvite = jest.fn();

    render(
      <ScoreBar
        game={game}
        currentUserUlid="01hxyz000000000player01"
        onInvite={onInvite}
      />
    );

    expect(screen.queryByText('INVITE')).toBeNull();
  });

  it('does not show INVITE button when game is active (even without opponent)', () => {
    const game = createMockGame({
      status: 'active',
      players: [
        {
          ulid: '01hxyz000000000player01',
          username: 'player1',
          avatar: null,
          avatarColor: null,
          score: 0,
          rackCount: 7,
          isCurrentTurn: true,
        },
      ],
    });
    const onInvite = jest.fn();

    render(
      <ScoreBar
        game={game}
        currentUserUlid="01hxyz000000000player01"
        onInvite={onInvite}
      />
    );

    expect(screen.queryByText('INVITE')).toBeNull();
  });

  it('shows Won chip when game is finished and current user won', () => {
    const game = createMockGame({
      status: 'finished',
      winnerUlid: '01hxyz000000000player01',
    });

    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.getByText('Won')).toBeTruthy();
  });

  it('shows Lost chip when game is finished and current user lost', () => {
    const game = createMockGame({
      status: 'finished',
      winnerUlid: '01hxyz00000000opponent',
    });

    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.getByText('Lost')).toBeTruthy();
  });
});
