import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ScoreBubble } from '../ScoreBubble';

jest.mock('../../../hooks/useScoreBubble', () => ({
  useScoreBubble: ({ score }: { score: number }) => ({
    isVisible: true,
    opacity: 1,
    displayScore: score,
  }),
}));

const cellSize = 24;
const boardSize = 378;

function bubblePosition() {
  return StyleSheet.flatten(screen.getByText('34').parent?.props.style);
}

function expectClearOfTiles(
  occupiedTiles: { x: number; y: number }[],
  pendingTiles: { x: number; y: number }[],
  width: number,
  height: number
) {
  const { left, top } = bubblePosition();
  expect(left).toBeGreaterThanOrEqual(4);
  expect(top).toBeGreaterThanOrEqual(4);
  expect(left + width).toBeLessThanOrEqual(boardSize - 6);
  expect(top + height).toBeLessThanOrEqual(boardSize - 6);

  for (const { x, y } of occupiedTiles) {
    const tileLeft = 8 + x * cellSize;
    const tileTop = 8 + y * cellSize;
    const overlapWidth = Math.max(
      0,
      Math.min(left + width, tileLeft + cellSize) - Math.max(left, tileLeft)
    );
    const overlapHeight = Math.max(
      0,
      Math.min(top + height, tileTop + cellSize) - Math.max(top, tileTop)
    );
    const isPending = pendingTiles.some((tile) => tile.x === x && tile.y === y);
    if (isPending) {
      expect(overlapWidth <= 3.01 || overlapHeight <= 3.01).toBe(true);
    } else {
      expect(overlapWidth === 0 || overlapHeight === 0).toBe(true);
    }
  }
}

function expectOverlapsMove(
  pendingTiles: { x: number; y: number }[],
  width: number,
  height: number
) {
  const { left, top } = bubblePosition();
  const overlaps = pendingTiles.some(({ x, y }) => {
    const tileLeft = 8 + x * cellSize;
    const tileTop = 8 + y * cellSize;
    const overlapWidth = Math.max(
      0,
      Math.min(left + width, tileLeft + cellSize) - Math.max(left, tileLeft)
    );
    const overlapHeight = Math.max(
      0,
      Math.min(top + height, tileTop + cellSize) - Math.max(top, tileTop)
    );
    return overlapWidth > 0 && overlapHeight > 0;
  });
  expect(overlaps).toBe(true);
}

it('keeps the score clear of a word near the left edge', async () => {
  const pendingTiles = [0, 1, 2, 3, 4].map((x) => ({ x, y: 3 }));
  const occupiedTiles = [
    ...pendingTiles,
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 1, y: 4 },
    { x: 3, y: 4 },
    { x: 1, y: 5 },
    { x: 3, y: 5 },
  ];
  await render(
    <ScoreBubble
      score={34}
      x={0}
      y={3}
      cellSize={cellSize}
      boardSize={boardSize}
      occupiedTiles={occupiedTiles}
      pendingTiles={pendingTiles}
    />
  );

  await fireEvent(screen.getByText('34').parent!, 'layout', {
    nativeEvent: { layout: { width: 40, height: 24 } },
  });

  expectClearOfTiles(occupiedTiles, pendingTiles, 40, 24);
  expectOverlapsMove(pendingTiles, 40, 24);
});

it('uses the measured width when avoiding nearby placed tiles', async () => {
  const occupiedTiles = [
    { x: 3, y: 9 },
    { x: 4, y: 9 },
    { x: 4, y: 8 },
  ];
  await render(
    <ScoreBubble
      score={34}
      x={3}
      y={9}
      cellSize={cellSize}
      boardSize={boardSize}
      occupiedTiles={occupiedTiles}
      pendingTiles={occupiedTiles.slice(0, 2)}
    />
  );

  await fireEvent(screen.getByText('34').parent!, 'layout', {
    nativeEvent: { layout: { width: 55, height: 25 } },
  });

  expectClearOfTiles(occupiedTiles, occupiedTiles.slice(0, 2), 55, 25);
  expectOverlapsMove(occupiedTiles.slice(0, 2), 55, 25);
});

it.each([
  [0, 0],
  [7, 0],
  [14, 0],
  [0, 7],
  [14, 7],
  [0, 14],
  [7, 14],
  [14, 14],
])('slightly overlaps a tile at board position (%i, %i)', async (x, y) => {
  const occupiedTiles = [{ x, y }];
  await render(
    <ScoreBubble
      score={34}
      x={x}
      y={y}
      cellSize={cellSize}
      boardSize={boardSize}
      occupiedTiles={occupiedTiles}
      pendingTiles={occupiedTiles}
    />
  );

  await fireEvent(screen.getByText('34').parent!, 'layout', {
    nativeEvent: { layout: { width: 55, height: 25 } },
  });

  expectClearOfTiles(occupiedTiles, occupiedTiles, 55, 25);
  expectOverlapsMove(occupiedTiles, 55, 25);
});
