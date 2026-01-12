import { create } from 'zustand';
import type { SquareType } from '../types/game';
import { BOARD_SIZE } from '../config/constants';

const CENTER = 7;

const SQUARE_TYPE_LIMITS: Record<BonusSquareType, number> = {
  '2L': 28,
  '3L': 20,
  '2W': 20,
  '3W': 12,
};

type BonusSquareType = '2L' | '3L' | '2W' | '3W';

const CYCLE_ORDER: (BonusSquareType | null)[] = [null, '2L', '3L', '2W', '3W'];

interface BoardMakerState {
  template: SquareType[][];
  symmetryEnabled: boolean;
  counts: Record<BonusSquareType, number>;
}

interface BoardMakerActions {
  initialize: () => void;
  cycleCell: (x: number, y: number) => void;
  setSymmetry: (enabled: boolean) => void;
  randomize: () => void;
  clear: () => void;
  getTemplate: () => SquareType[][];
  getCounts: () => Record<BonusSquareType, number>;
  getLimits: () => Record<BonusSquareType, number>;
}

function createEmptyTemplate(): SquareType[][] {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) =>
      x === CENTER && y === CENTER ? 'STAR' : null
    )
  );
}

function getSymmetricPositions(
  x: number,
  y: number
): { x: number; y: number }[] {
  const positions = [
    { x, y },
    { x: BOARD_SIZE - 1 - x, y },
    { x, y: BOARD_SIZE - 1 - y },
    { x: BOARD_SIZE - 1 - x, y: BOARD_SIZE - 1 - y },
  ];

  const uniquePositions: { x: number; y: number }[] = [];
  for (const pos of positions) {
    const exists = uniquePositions.some((p) => p.x === pos.x && p.y === pos.y);
    if (!exists) {
      uniquePositions.push(pos);
    }
  }

  return uniquePositions;
}

function isBonusSquareType(value: SquareType): value is BonusSquareType {
  return value === '2L' || value === '3L' || value === '2W' || value === '3W';
}

function getNextSquareType(
  current: SquareType,
  counts: Record<BonusSquareType, number>
): BonusSquareType | null {
  const currentIndex =
    current !== null && isBonusSquareType(current)
      ? CYCLE_ORDER.indexOf(current)
      : 0;

  for (let i = 1; i <= CYCLE_ORDER.length; i++) {
    const nextIndex = (currentIndex + i) % CYCLE_ORDER.length;
    const next = CYCLE_ORDER[nextIndex];

    if (next === null || next === undefined) {
      return null;
    }

    if (counts[next] < SQUARE_TYPE_LIMITS[next]) {
      return next;
    }
  }

  return null;
}

function canPlaceSquareType(
  squareType: BonusSquareType,
  count: number,
  positionsCount: number
): boolean {
  return count + positionsCount <= SQUARE_TYPE_LIMITS[squareType];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

export const useBoardMakerStore = create<BoardMakerState & BoardMakerActions>(
  (set, get) => ({
    template: createEmptyTemplate(),
    symmetryEnabled: true,
    counts: { '2L': 0, '3L': 0, '2W': 0, '3W': 0 },

    initialize: () =>
      set({
        template: createEmptyTemplate(),
        symmetryEnabled: true,
        counts: { '2L': 0, '3L': 0, '2W': 0, '3W': 0 },
      }),

    cycleCell: (x, y) => {
      const { template, symmetryEnabled, counts } = get();

      const currentCell = template[y]?.[x];
      if (currentCell === 'STAR') {
        return;
      }

      const positions = symmetryEnabled
        ? getSymmetricPositions(x, y)
        : [{ x, y }];

      const validPositions = positions.filter(
        (pos) => template[pos.y]?.[pos.x] !== 'STAR'
      );

      if (validPositions.length === 0) {
        return;
      }

      const current = currentCell ?? null;
      const currentSquareType =
        current !== null && isBonusSquareType(current) ? current : null;

      const tempCounts = { ...counts };
      if (currentSquareType) {
        tempCounts[currentSquareType] -= validPositions.length;
      }

      let nextSquareType = getNextSquareType(current, tempCounts);

      if (
        nextSquareType &&
        !canPlaceSquareType(
          nextSquareType,
          tempCounts[nextSquareType],
          validPositions.length
        )
      ) {
        const startIdx = CYCLE_ORDER.indexOf(nextSquareType);
        for (let i = startIdx + 1; i < CYCLE_ORDER.length; i++) {
          const candidate = CYCLE_ORDER[i];
          if (candidate === null || candidate === undefined) {
            nextSquareType = null;
            break;
          }
          if (
            canPlaceSquareType(
              candidate,
              tempCounts[candidate],
              validPositions.length
            )
          ) {
            nextSquareType = candidate;
            break;
          }
        }
        if (
          nextSquareType &&
          !canPlaceSquareType(
            nextSquareType,
            tempCounts[nextSquareType],
            validPositions.length
          )
        ) {
          nextSquareType = null;
        }
      }

      const newTemplate = template.map((row) => [...row]);
      const newCounts = { ...counts };

      if (currentSquareType) {
        newCounts[currentSquareType] -= validPositions.length;
      }

      for (const pos of validPositions) {
        const row = newTemplate[pos.y];
        if (row) {
          row[pos.x] = nextSquareType;
        }
      }

      if (nextSquareType) {
        newCounts[nextSquareType] += validPositions.length;
      }

      set({ template: newTemplate, counts: newCounts });
    },

    setSymmetry: (enabled) => set({ symmetryEnabled: enabled }),

    randomize: () => {
      const { symmetryEnabled } = get();
      const newTemplate = createEmptyTemplate();
      const newCounts: Record<BonusSquareType, number> = {
        '2L': 0,
        '3L': 0,
        '2W': 0,
        '3W': 0,
      };

      const availablePositions: { x: number; y: number }[] = [];
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          if (x !== CENTER || y !== CENTER) {
            availablePositions.push({ x, y });
          }
        }
      }

      const squareTypes: BonusSquareType[] = ['3W', '2W', '3L', '2L'];

      for (const squareType of squareTypes) {
        const limit = SQUARE_TYPE_LIMITS[squareType];
        const shuffledPositions = shuffleArray(availablePositions);

        for (const pos of shuffledPositions) {
          if (newCounts[squareType] >= limit) {
            break;
          }

          const cellValue = newTemplate[pos.y]?.[pos.x];
          if (cellValue !== null) {
            continue;
          }

          const positions = symmetryEnabled
            ? getSymmetricPositions(pos.x, pos.y)
            : [pos];

          const validPositions = positions.filter((p) => {
            const cell = newTemplate[p.y]?.[p.x];
            return cell === null && (p.x !== CENTER || p.y !== CENTER);
          });

          if (validPositions.length === 0) {
            continue;
          }

          if (newCounts[squareType] + validPositions.length > limit) {
            continue;
          }

          for (const p of validPositions) {
            const row = newTemplate[p.y];
            if (row) {
              row[p.x] = squareType;
              newCounts[squareType]++;
            }
          }
        }
      }

      set({ template: newTemplate, counts: newCounts });
    },

    clear: () =>
      set({
        template: createEmptyTemplate(),
        counts: { '2L': 0, '3L': 0, '2W': 0, '3W': 0 },
      }),

    getTemplate: () => get().template,

    getCounts: () => get().counts,

    getLimits: () => SQUARE_TYPE_LIMITS,
  })
);
