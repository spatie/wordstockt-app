import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type {
  User,
  GameListItem,
  Tile,
  PlacedTile,
  PendingTile,
  Game,
  Player,
  ValidationResponse,
  WordValidationResult,
  TileValidationStatus,
} from '../types';

// Create a fresh QueryClient for each test
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper with providers
interface WrapperProps {
  children: React.ReactNode;
}

export function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// Custom render with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: createWrapper(), ...options });
}

// Mock data factories
export const mockUser = (overrides?: Partial<User>): User => ({
  ulid: '01hxyz000000000testuser',
  username: 'testuser',
  email: 'test@example.com',
  avatar: null,
  avatarColor: null,
  eloRating: 1200,
  gamesPlayed: 10,
  gamesWon: 5,
  isGuest: false,
  emailVerifiedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const mockGameListItem = (
  overrides?: Partial<GameListItem>
): GameListItem => ({
  ulid: '01hxyz000000000game0001',
  language: 'en',
  status: 'active',
  maxPlayers: 2,
  players: [
    {
      ulid: '01hxyz000000000player01',
      username: 'me',
      avatar: null,
      avatarColor: null,
      score: 50,
      isCurrentTurn: true,
      isMe: true,
      hasLeft: false,
    },
    {
      ulid: '01hxyz00000000opponent',
      username: 'opponent',
      avatar: null,
      avatarColor: null,
      score: 45,
      isCurrentTurn: false,
      isMe: false,
      hasLeft: false,
    },
  ],
  myScore: 50,
  isMyTurn: true,
  winnerUlid: null,
  updatedAt: new Date().toISOString(),
  lastMoveDescription: 'Played HELLO for 12 points',
  turnExpiresAt: null,
  pendingInvitation: null,
  isPublic: false,
  ...overrides,
});

export const mockTile = (overrides?: Partial<Tile>): Tile => ({
  letter: 'A',
  points: 1,
  isBlank: false,
  ...overrides,
});

export const mockPlacedTile = (
  overrides?: Partial<PlacedTile>
): PlacedTile => ({
  ...mockTile(),
  x: 7,
  y: 7,
  ...overrides,
});

export const mockPendingTile = (
  overrides?: Partial<PendingTile>
): PendingTile => ({
  ...mockPlacedTile(),
  rackIndex: 0,
  ...overrides,
});

export const mockPlayer = (overrides?: Partial<Player>): Player => ({
  ulid: '01hxyz000000000player01',
  username: 'player1',
  avatar: null,
  avatarColor: null,
  score: 0,
  rackCount: 7,
  isCurrentTurn: true,
  ...overrides,
});

export const mockGame = (overrides?: Partial<Game>): Game => ({
  ulid: '01hxyz000000000game0001',
  language: 'en',
  status: 'active',
  maxPlayers: 2,
  board: Array(15)
    .fill(null)
    .map(() => Array(15).fill(null)),
  boardTemplate: Array(15)
    .fill(null)
    .map(() => Array(15).fill(null)),
  players: [
    mockPlayer({ ulid: '01user', username: 'me', isCurrentTurn: true }),
    mockPlayer({
      ulid: '01opponent',
      username: 'opponent',
      isCurrentTurn: false,
    }),
  ],
  myRack: Array(7)
    .fill(null)
    .map((_, i) => mockTile({ letter: String.fromCharCode(65 + i) })),
  tilesRemaining: 80,
  currentTurnUserUlid: '01user',
  winnerUlid: null,
  isLastMove: false,
  lastMove: null,
  turnExpiresAt: null,
  pendingInvitation: null,
  pendingInvitations: [],
  isPublic: false,
  canJoin: false,
  ...overrides,
});

export const mockTileValidationStatus = (
  overrides?: Partial<TileValidationStatus>
): TileValidationStatus => ({
  x: 7,
  y: 7,
  valid: true,
  ...overrides,
});

export const mockWordValidationResult = (
  overrides?: Partial<WordValidationResult>
): WordValidationResult => ({
  word: 'TEST',
  valid: true,
  tiles: [
    { x: 7, y: 7 },
    { x: 8, y: 7 },
    { x: 9, y: 7 },
    { x: 10, y: 7 },
  ],
  ...overrides,
});

export const mockValidationResponse = (
  overrides?: Partial<ValidationResponse>
): ValidationResponse => ({
  placement_valid: true,
  placement_errors: [],
  words: [mockWordValidationResult()],
  tile_status: [
    mockTileValidationStatus({ x: 7, y: 7 }),
    mockTileValidationStatus({ x: 8, y: 7 }),
    mockTileValidationStatus({ x: 9, y: 7 }),
    mockTileValidationStatus({ x: 10, y: 7 }),
  ],
  potential_score: 10,
  ...overrides,
});

// Re-export everything from testing library
export * from '@testing-library/react-native';
