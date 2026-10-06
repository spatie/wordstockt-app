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
}

const BOARD_BORDER = 1;
const GRID_PADDING = 8;
const BUBBLE_MARGIN = 4;

/**
 * Animated score bubble that appears at the top-left of the first pending tile.
 * Shows the potential score for the current move with fade animations.
 */
export function ScoreBubble({
  score,
  x,
  y,
  cellSize,
  boardSize,
}: ScoreBubbleProps) {
  const styles = useThemedStyles(createStyles);
  const { isVisible, opacity, displayScore } = useScoreBubble({ score });
  const [bubbleSize, setBubbleSize] = useState({ width: 40, height: 24 });
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBubbleSize((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height }
    );
  }, []);

  if (!isVisible || cellSize <= 0) {
    return null;
  }

  const contentSize = boardSize - BOARD_BORDER * 2;
  const left = Math.max(
    BUBBLE_MARGIN,
    Math.min(
      GRID_PADDING + x * cellSize - BUBBLE_MARGIN,
      contentSize - bubbleSize.width - BUBBLE_MARGIN
    )
  );
  const top = Math.max(
    BUBBLE_MARGIN,
    Math.min(
      GRID_PADDING + y * cellSize - BUBBLE_MARGIN,
      contentSize - bubbleSize.height - BUBBLE_MARGIN
    )
  );

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[
        styles.bubble,
        {
          left,
          top,
          opacity,
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
