import type { ThemeColors } from '../../config/theme';
import { useThemedStyles } from '../../hooks/useThemeColors';
import React, { useCallback, useState } from 'react';
import { Text, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { useScoreBubble } from '../../hooks/useScoreBubble';
import { VALIDATION_COLORS } from '../../config/theme';

interface ScoreBubbleProps {
  score: number | null | undefined;
  x: number;
  y: number;
  cellSize: number;
  boardSize: number;
  occupiedTiles: readonly { x: number; y: number }[];
  pendingTiles: readonly { x: number; y: number }[];
}

const BOARD_BORDER = 1;
const GRID_PADDING = 8;
const BUBBLE_MARGIN = 4;
const TILE_OVERLAP = 3;

type Position = { x: number; y: number };

function overlapSize(
  left: number,
  top: number,
  width: number,
  height: number,
  tileLeft: number,
  tileTop: number,
  cellSize: number
) {
  return {
    width: Math.max(
      0,
      Math.min(left + width, tileLeft + cellSize) - Math.max(left, tileLeft)
    ),
    height: Math.max(
      0,
      Math.min(top + height, tileTop + cellSize) - Math.max(top, tileTop)
    ),
  };
}

function findBubblePosition(
  tileX: number,
  tileY: number,
  cellSize: number,
  boardSize: number,
  bubbleSize: { width: number; height: number },
  occupiedTiles: readonly Position[],
  pendingTiles: readonly Position[]
) {
  const contentSize = boardSize - BOARD_BORDER * 2;
  const gridStart = GRID_PADDING;
  const moveTiles =
    pendingTiles.length > 0
      ? [...pendingTiles].sort(
          (a, b) =>
            Math.abs(a.x - tileX) +
              Math.abs(a.y - tileY) -
              Math.abs(b.x - tileX) -
              Math.abs(b.y - tileY) ||
            a.y - b.y ||
            a.x - b.x
        )
      : [{ x: tileX, y: tileY }];

  for (const tile of moveTiles) {
    const tileLeft = gridStart + tile.x * cellSize;
    const tileTop = gridStart + tile.y * cellSize;
    const horizontal = [
      tileLeft + (cellSize - bubbleSize.width) / 2,
      tileLeft,
      tileLeft + cellSize - bubbleSize.width,
    ];
    const vertical = [
      tileTop + (cellSize - bubbleSize.height) / 2,
      tileTop,
      tileTop + cellSize - bubbleSize.height,
    ];
    const candidates = [
      ...horizontal.map((left) => ({
        left,
        top: tileTop - bubbleSize.height + TILE_OVERLAP,
      })),
      ...vertical.map((top) => ({
        left: tileLeft - bubbleSize.width + TILE_OVERLAP,
        top,
      })),
      ...vertical.map((top) => ({
        left: tileLeft + cellSize - TILE_OVERLAP,
        top,
      })),
      ...horizontal.map((left) => ({
        left,
        top: tileTop + cellSize - TILE_OVERLAP,
      })),
    ];

    for (const { left, top } of candidates) {
      if (
        left < BUBBLE_MARGIN ||
        top < BUBBLE_MARGIN ||
        left + bubbleSize.width > contentSize - BUBBLE_MARGIN ||
        top + bubbleSize.height > contentSize - BUBBLE_MARGIN
      ) {
        continue;
      }

      const overlapsTile = occupiedTiles.some(({ x, y }) => {
        const overlap = overlapSize(
          left,
          top,
          bubbleSize.width,
          bubbleSize.height,
          gridStart + x * cellSize,
          gridStart + y * cellSize,
          cellSize
        );
        if (overlap.width === 0 || overlap.height === 0) return false;

        const isPending = moveTiles.some(
          (tile) => tile.x === x && tile.y === y
        );
        return (
          !isPending ||
          (overlap.width > TILE_OVERLAP + 0.01 &&
            overlap.height > TILE_OVERLAP + 0.01)
        );
      });

      if (!overlapsTile) return { left, top };
    }
  }

  return null;
}

/**
 * Animated score bubble that appears near the first pending tile.
 * Shows the potential score for the current move with fade animations.
 */
export function ScoreBubble({
  score,
  x,
  y,
  cellSize,
  boardSize,
  occupiedTiles,
  pendingTiles,
}: ScoreBubbleProps) {
  const styles = useThemedStyles(createStyles);
  const { isVisible, opacity, displayScore } = useScoreBubble({ score });
  const [bubbleSize, setBubbleSize] = useState<{
    score: number | null;
    width: number;
    height: number;
  } | null>(null);
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setBubbleSize((current) =>
        current?.score === displayScore &&
        current.width === width &&
        current.height === height
          ? current
          : { score: displayScore, width, height }
      );
    },
    [displayScore]
  );

  if (!isVisible || cellSize <= 0) {
    return null;
  }

  const position =
    bubbleSize?.score === displayScore
      ? findBubblePosition(
          x,
          y,
          cellSize,
          boardSize,
          bubbleSize,
          occupiedTiles,
          pendingTiles
        )
      : null;

  return (
    <Animated.View
      key={displayScore}
      onLayout={handleLayout}
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          left: position?.left ?? 0,
          top: position?.top ?? 0,
          opacity: position ? opacity : 0,
        },
      ]}
    >
      <Text style={styles.text}>{displayScore}</Text>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bubble: {
      position: 'absolute',
      backgroundColor: VALIDATION_COLORS.valid,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      minWidth: 22,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 4,
    },
    text: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
  });
