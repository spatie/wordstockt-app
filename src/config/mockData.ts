import type { Game, SquareType } from '../types';

// Standard Scrabble board template with multipliers
const createBoardTemplate = (): SquareType[][] => {
  const template: SquareType[][] = Array(15)
    .fill(null)
    .map(() => Array(15).fill(null));

  // Triple Word scores
  const tw: [number, number][] = [
    [0, 0],
    [0, 7],
    [0, 14],
    [7, 0],
    [7, 14],
    [14, 0],
    [14, 7],
    [14, 14],
  ];
  tw.forEach(([y, x]) => {
    template[y]![x] = '3W';
  });

  // Double Letter scores
  const dl: [number, number][] = [
    [0, 3],
    [0, 11],
    [2, 6],
    [2, 8],
    [3, 0],
    [3, 7],
    [3, 14],
    [6, 2],
    [6, 6],
    [6, 8],
    [6, 12],
    [7, 3],
    [7, 11],
    [8, 2],
    [8, 6],
    [8, 8],
    [8, 12],
    [11, 0],
    [11, 7],
    [11, 14],
    [12, 6],
    [12, 8],
    [14, 3],
    [14, 11],
  ];
  dl.forEach(([y, x]) => {
    template[y]![x] = '2L';
  });

  // Triple Letter scores
  const tl: [number, number][] = [
    [1, 5],
    [1, 9],
    [5, 1],
    [5, 5],
    [5, 9],
    [5, 13],
    [9, 1],
    [9, 5],
    [9, 9],
    [9, 13],
    [13, 5],
    [13, 9],
  ];
  tl.forEach(([y, x]) => {
    template[y]![x] = '3L';
  });

  // Double Word scores
  const dw: [number, number][] = [
    [1, 1],
    [1, 13],
    [2, 2],
    [2, 12],
    [3, 3],
    [3, 11],
    [4, 4],
    [4, 10],
    [10, 4],
    [10, 10],
    [11, 3],
    [11, 11],
    [12, 2],
    [12, 12],
    [13, 1],
    [13, 13],
  ];
  dw.forEach(([y, x]) => {
    template[y]![x] = '2W';
  });

  // Center star
  template[7]![7] = 'STAR';

  return template;
};

// Create empty board
const createEmptyBoard = () =>
  Array(15)
    .fill(null)
    .map(() => Array(15).fill(null));

// Board with a couple of placed words (QUARTZ + ZEBRA crossing)
const createMockBoard = () => {
  const board = createEmptyBoard();
  // Add some placed tiles - QUARTZ word
  board[7]![3] = { letter: 'Q', points: 10, isBlank: false };
  board[7]![4] = { letter: 'U', points: 1, isBlank: false };
  board[7]![5] = { letter: 'A', points: 1, isBlank: false };
  board[7]![6] = { letter: 'R', points: 1, isBlank: false };
  board[7]![7] = { letter: 'T', points: 1, isBlank: false };
  board[7]![8] = { letter: 'Z', points: 10, isBlank: false };
  // ZEBRA crossing
  board[7]![9] = { letter: 'E', points: 1, isBlank: false };
  board[7]![10] = { letter: 'B', points: 3, isBlank: false };
  board[7]![11] = { letter: 'R', points: 1, isBlank: false };
  board[8]![9] = { letter: 'A', points: 1, isBlank: false };
  return board;
};

/**
 * Returns a fresh, fully independent mock game.
 *
 * Each call builds new board/rack/player arrays so callers can mutate the
 * result without affecting any other consumer. Prefer this over a shared
 * module-level object to avoid cross-render/cross-game state leakage.
 */
export const createMockGame = (): Game => ({
  ulid: '01hxyz123456789abcdefgh',
  language: 'en',
  status: 'active',
  maxPlayers: 2,
  board: createMockBoard(),
  boardTemplate: createBoardTemplate(),
  players: [
    {
      ulid: '01hxyz000000000player01',
      username: 'Player',
      avatar: null,
      avatarColor: null,
      score: 18,
      rackCount: 5,
      isCurrentTurn: true,
    },
    {
      ulid: '01hxyz000000000player02',
      username: 'Opponent',
      avatar: null,
      avatarColor: null,
      score: 24,
      rackCount: 7,
      isCurrentTurn: false,
    },
  ],
  myRack: [
    { letter: 'A', points: 1, isBlank: false },
    { letter: 'S', points: 1, isBlank: false },
    { letter: 'T', points: 1, isBlank: false },
    { letter: 'L', points: 1, isBlank: false },
    { letter: 'N', points: 1, isBlank: false },
    { letter: '', points: 0, isBlank: false }, // Empty slot placeholder
    { letter: '', points: 0, isBlank: false }, // Empty slot placeholder
  ],
  tilesRemaining: 56,
  currentTurnUserUlid: '01hxyz000000000player01',
  winnerUlid: null,
  isLastMove: false,
  lastMove: null,
  turnExpiresAt: null,
  pendingInvitation: null,
  pendingInvitations: [],
  isPublic: false,
  canJoin: false,
});

/**
 * Shared mock game instance.
 *
 * Kept for backward compatibility with existing imports
 * (`app/(main)/game/[id]/index.tsx`). New code should call `createMockGame()`
 * to get an isolated copy. This instance is built fresh at module load.
 */
export const mockGame: Game = createMockGame();
