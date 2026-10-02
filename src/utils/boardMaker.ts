import { BOARD_SIZE } from '../config/constants';
import type { SquareType } from '../types/game';

export type BonusSquareType = '2L' | '3L' | '2W' | '3W';

export const BOARD_MAKER_LIMITS: Record<BonusSquareType, number> = {
  '2L': 28,
  '3L': 20,
  '2W': 20,
  '3W': 12,
};

const CENTER = Math.floor(BOARD_SIZE / 2);
const CYCLE_ORDER: (BonusSquareType | null)[] = [null, '2L', '3L', '2W', '3W'];

function isBonusSquareType(value: SquareType): value is BonusSquareType {
  return value === '2L' || value === '3L' || value === '2W' || value === '3W';
}

export function copyBoardTemplate(template: SquareType[][]): SquareType[][] {
  return template.map((row) => [...row]);
}

export function createEmptyBoardTemplate(): SquareType[][] {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) =>
      x === CENTER && y === CENTER ? 'STAR' : null
    )
  );
}

export function getBoardTemplateCounts(
  template: SquareType[][]
): Record<BonusSquareType, number> {
  const counts = { '2L': 0, '3L': 0, '2W': 0, '3W': 0 };

  for (const row of template) {
    for (const cell of row) {
      if (isBonusSquareType(cell)) {
        counts[cell]++;
      }
    }
  }

  return counts;
}

function getSymmetricPositions(x: number, y: number) {
  const oppositeX = BOARD_SIZE - 1 - x;
  const oppositeY = BOARD_SIZE - 1 - y;
  const positions = [
    { x, y },
    { x: oppositeX, y },
    { x, y: oppositeY },
    { x: oppositeX, y: oppositeY },
  ];

  return positions.filter(
    (position, index) =>
      positions.findIndex(
        (candidate) => candidate.x === position.x && candidate.y === position.y
      ) === index
  );
}

export function cycleBoardCell(
  template: SquareType[][],
  x: number,
  y: number,
  symmetryEnabled: boolean
): SquareType[][] {
  const current = template[y]?.[x];
  if (current === undefined || current === 'STAR') {
    return template;
  }

  const positions = (
    symmetryEnabled ? getSymmetricPositions(x, y) : [{ x, y }]
  ).filter((position) => template[position.y]?.[position.x] !== 'STAR');
  const counts = getBoardTemplateCounts(template);
  const currentIndex = CYCLE_ORDER.indexOf(current);

  for (let step = 1; step <= CYCLE_ORDER.length; step++) {
    const candidate = CYCLE_ORDER[(currentIndex + step) % CYCLE_ORDER.length];
    if (candidate === undefined) continue;

    if (candidate !== null) {
      const alreadyCandidate = positions.filter(
        (position) => template[position.y]?.[position.x] === candidate
      ).length;
      const nextCount = counts[candidate] - alreadyCandidate + positions.length;
      if (nextCount > BOARD_MAKER_LIMITS[candidate]) continue;
    }

    const nextTemplate = copyBoardTemplate(template);
    for (const position of positions) {
      nextTemplate[position.y]![position.x] = candidate;
    }
    return nextTemplate;
  }

  return template;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export function randomizeBoardTemplate(
  symmetryEnabled: boolean
): SquareType[][] {
  const template = createEmptyBoardTemplate();
  const counts = getBoardTemplateCounts(template);
  const availablePositions = Array.from(
    { length: BOARD_SIZE * BOARD_SIZE },
    (_, index) => ({ x: index % BOARD_SIZE, y: Math.floor(index / BOARD_SIZE) })
  ).filter((position) => position.x !== CENTER || position.y !== CENTER);

  for (const squareType of ['3W', '2W', '3L', '2L'] as const) {
    for (const position of shuffleArray(availablePositions)) {
      if (counts[squareType] >= BOARD_MAKER_LIMITS[squareType]) break;
      if (template[position.y]?.[position.x] !== null) continue;

      const positions = (
        symmetryEnabled
          ? getSymmetricPositions(position.x, position.y)
          : [position]
      ).filter((cell) => template[cell.y]?.[cell.x] === null);

      if (
        counts[squareType] + positions.length >
        BOARD_MAKER_LIMITS[squareType]
      ) {
        continue;
      }

      for (const cell of positions) {
        template[cell.y]![cell.x] = squareType;
        counts[squareType]++;
      }
    }
  }

  return template;
}
