import type { ThemeColors } from '../../config/theme';
import {
  useMultiplierColors,
  useThemeColors,
  useThemedStyles,
} from '../../hooks/useThemeColors';
import React, { memo } from 'react';
import { StyleSheet, Pressable, Text } from 'react-native';
import type { SquareType } from '../../types/game';
import { MULTIPLIER_LABELS } from '../../config/theme';

interface BoardMakerCellProps {
  squareType: SquareType;
  size: number;
  onPress: () => void;
  disabled?: boolean;
}

export const BoardMakerCell = memo(function BoardMakerCell({
  squareType,
  size,
  onPress,
  disabled = false,
}: BoardMakerCellProps) {
  const colors = useThemeColors();
  const multiplierColors = useMultiplierColors();
  const styles = useThemedStyles(createStyles);
  const backgroundColor = squareType
    ? multiplierColors[squareType]
    : colors.cellBackground;

  const fontSize = size * 0.28;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor,
        },
        { opacity: pressed && !disabled ? 0.7 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {squareType && (
        <Text style={[styles.label, { fontSize }]} numberOfLines={1}>
          {MULTIPLIER_LABELS[squareType]}
        </Text>
      )}
    </Pressable>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
