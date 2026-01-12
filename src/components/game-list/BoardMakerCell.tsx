import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import type { SquareType } from '../../types/game';
import {
  colors,
  MULTIPLIER_COLORS,
  MULTIPLIER_LABELS,
} from '../../config/theme';

interface BoardMakerCellProps {
  squareType: SquareType;
  size: number;
  onPress: () => void;
  disabled?: boolean;
  animatedOpacity?: Animated.Value;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export const BoardMakerCell = memo(function BoardMakerCell({
  squareType,
  size,
  onPress,
  disabled = false,
  animatedOpacity,
}: BoardMakerCellProps) {
  const backgroundColor = squareType
    ? MULTIPLIER_COLORS[squareType]
    : colors.cellBackground;

  const fontSize = size * 0.28;

  const shouldAnimate = animatedOpacity && squareType && squareType !== 'STAR';

  const cellStyle = [
    styles.cell,
    {
      width: size,
      height: size,
      backgroundColor,
    },
    shouldAnimate ? { opacity: animatedOpacity } : undefined,
  ];

  if (shouldAnimate) {
    return (
      <AnimatedTouchableOpacity
        style={cellStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {squareType && (
          <Text style={[styles.label, { fontSize }]} numberOfLines={1}>
            {MULTIPLIER_LABELS[squareType]}
          </Text>
        )}
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {squareType && (
        <Text style={[styles.label, { fontSize }]} numberOfLines={1}>
          {MULTIPLIER_LABELS[squareType]}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
