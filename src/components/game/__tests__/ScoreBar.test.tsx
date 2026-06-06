/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ScoreBar } from '../ScoreBar';
import type { Game, Player } from '../../../types';

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

// Mock vector icons (no native font loading in the test environment).
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{`icon:${name}`}</Text>;
  },
}));

// Mock the start-game mutation so ScoreBar can render without a query client.
const mockStartGame = jest.fn();
jest.mock('../../../api/queries/useGames', () => ({
  useStartGame: () => ({ mutate: mockStartGame, isPending: false }),
}));

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  ulid: 'player-ulid',
  username: 'Player',
  avatar: null,
  avatarColor: null,
  score: 0,
  rackCount: 7,
  isCurrentTurn: false,
  turnOrder: 1,
  hasLeft: false,
  ...overrides,
});

const createMockGame = (overrides: Partial<Game> = {}): Game => ({
  ulid: '01hxyz000000000game0001',
  language: 'en',
  status: 'active',
  maxPlayers: 2,
  board: [],
  boardTemplate: [],
  players: [
    makePlayer({
      ulid: '01hxyz000000000player01',
      username: 'player1',
      score: 10,
      isCurrentTurn: true,
      turnOrder: 1,
    }),
    makePlayer({
      ulid: '01hxyz00000000opponent',
      username: 'opponent',
      score: 20,
      isCurrentTurn: false,
      turnOrder: 2,
    }),
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

beforeEach(() => {
  mockStartGame.mockClear();
});

describe('ScoreBar', () => {
  it('renders a chip for each player with "You" for self', () => {
    const game = createMockGame();
    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.getByText('opponent')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy();
  });

  it('renders three chips for a 3-player game', () => {
    const game = createMockGame({
      maxPlayers: 3,
      players: [
        makePlayer({
          ulid: '01hxyz000000000player01',
          username: 'player1',
          score: 10,
          isCurrentTurn: true,
          turnOrder: 1,
        }),
        makePlayer({
          ulid: 'p2',
          username: 'Jess',
          score: 20,
          turnOrder: 2,
        }),
        makePlayer({
          ulid: 'p3',
          username: 'Tom',
          score: 5,
          turnOrder: 3,
        }),
      ],
    });
    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('Jess')).toBeTruthy();
    expect(screen.getByText('Tom')).toBeTruthy();
  });

  it('shows a LEFT tag for a player who has left', () => {
    const game = createMockGame({
      maxPlayers: 3,
      players: [
        makePlayer({
          ulid: '01hxyz000000000player01',
          username: 'player1',
          score: 10,
          isCurrentTurn: true,
          turnOrder: 1,
        }),
        makePlayer({
          ulid: 'p2',
          username: 'Jess',
          score: 20,
          turnOrder: 2,
        }),
        makePlayer({
          ulid: 'p3',
          username: 'Tom',
          score: 5,
          // A left player must never be highlighted even if flagged current.
          isCurrentTurn: true,
          hasLeft: true,
          leftReason: 'removed',
          turnOrder: 3,
        }),
      ],
    });
    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.getByText('LEFT')).toBeTruthy();
    expect(screen.getByText('Tom')).toBeTruthy();
  });

  it('renders tiles in bag for an active game', () => {
    const game = createMockGame({ tilesRemaining: 50 });
    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.getByText('in bag')).toBeTruthy();
  });

  it('shows an invite seat when a pending game has an open seat', () => {
    const game = createMockGame({
      status: 'pending',
      players: [
        makePlayer({
          ulid: '01hxyz000000000player01',
          username: 'player1',
          score: 0,
          isCurrentTurn: true,
          turnOrder: 1,
        }),
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

    expect(screen.getByText('Invite')).toBeTruthy();
    fireEvent(screen.getByText('+'), 'pressOut');
    expect(onInvite).toHaveBeenCalledTimes(1);
  });

  it('shows a PENDING tag for an invited but unjoined seat', () => {
    const game = createMockGame({
      status: 'pending',
      maxPlayers: 2,
      players: [
        makePlayer({
          ulid: '01hxyz000000000player01',
          username: 'player1',
          score: 0,
          isCurrentTurn: true,
          turnOrder: 1,
        }),
      ],
      pendingInvitation: {
        ulid: 'inv-1',
        invitee: {
          ulid: 'invitee-1',
          username: 'Invitee',
          avatar: null,
          avatarColor: null,
        },
      },
    });

    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.getByText('PENDING')).toBeTruthy();
    expect(screen.getByText('Invitee')).toBeTruthy();
  });

  it('does not show invite seats when the game is active', () => {
    const game = createMockGame({
      status: 'active',
      maxPlayers: 2,
      players: [
        makePlayer({
          ulid: '01hxyz000000000player01',
          username: 'player1',
          score: 0,
          isCurrentTurn: true,
          turnOrder: 1,
        }),
      ],
    });

    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.queryByText('Invite')).toBeNull();
  });

  it('shows Start now for the creator once two players have joined', () => {
    const game = createMockGame({
      status: 'pending',
      maxPlayers: 3,
      players: [
        makePlayer({
          ulid: '01hxyz000000000player01',
          username: 'player1',
          score: 0,
          isCurrentTurn: true,
          turnOrder: 1,
        }),
        makePlayer({
          ulid: 'p2',
          username: 'Jess',
          score: 0,
          turnOrder: 2,
        }),
      ],
    });

    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    const startButton = screen.getByText('Start now');
    expect(startButton).toBeTruthy();
    fireEvent(startButton, 'pressOut');
    expect(mockStartGame).toHaveBeenCalledWith(game.ulid);
  });

  it('does not show Start now for a non-creator', () => {
    const game = createMockGame({
      status: 'pending',
      maxPlayers: 3,
      players: [
        makePlayer({
          ulid: 'creator-ulid',
          username: 'Creator',
          score: 0,
          isCurrentTurn: true,
          turnOrder: 1,
        }),
        makePlayer({
          ulid: '01hxyz000000000player01',
          username: 'player1',
          score: 0,
          turnOrder: 2,
        }),
      ],
    });

    render(<ScoreBar game={game} currentUserUlid="01hxyz000000000player01" />);

    expect(screen.queryByText('Start now')).toBeNull();
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
