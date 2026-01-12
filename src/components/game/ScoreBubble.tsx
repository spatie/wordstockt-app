import React from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { useScoreBubble } from '../../hooks/useScoreBubble';
import { VALIDATION_COLORS } from '../../config/theme';

interface ScoreBubbleProps {
  score: number | null | undefined;
  x: number;
  y: number;
  cellSize: number;
}

/**
 * Animated score bubble that appears at the top-left of the first pending tile.
 * Shows the potential score for the current move with fade animations.
 */
export function ScoreBubble({ score, x, y, cellSize }: ScoreBubbleProps) {
  const { isVisible, opacity, displayScore } = useScoreBubble({ score });

  if (!isVisible || cellSize <= 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          left: x * cellSize,
          top: y * cellSize,
          opacity,
        },
      ]}
    >
      <Text style={styles.text}>{displayScore}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
