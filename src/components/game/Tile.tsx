import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { VALIDATION_COLORS, colors } from '../../config/theme';
import type { TileValidationState } from '../../types';

interface TileProps {
  letter: string;
  points: number;
  isPending?: boolean;
  isPlaced?: boolean;
  isSelected?: boolean;
  isBlank?: boolean;
  validationState?: TileValidationState;
  onPress?: () => void;
  disabled?: boolean;
  size?: 'board' | 'small' | 'normal' | 'large';
  cellSize?: number;
}

export function Tile({
  letter,
  points,
  isPending = false,
  isPlaced = false,
  isSelected = false,
  isBlank = false,
  validationState = null,
  onPress,
  disabled = false,
  size = 'normal',
  cellSize,
}: TileProps) {
  const Container = onPress ? TouchableOpacity : View;

  // Don't render empty tiles (but blank tiles with '*' should render)
  if (!letter) return null;

  // For board tiles, use dynamic sizing based on cell size
  const getDynamicSizes = () => {
    if (size === 'board' && cellSize) {
      return {
        fontSize: Math.max(12, Math.round(cellSize * 0.55)),
        pointsSize: Math.max(6, Math.round(cellSize * 0.15)),
      };
    }

    const sizeStyles = {
      board: { fontSize: 16, pointsSize: 6 },
      small: { fontSize: 22, pointsSize: 8 },
      normal: { fontSize: 28, pointsSize: 9 },
      large: { fontSize: 34, pointsSize: 10 },
    };

    return sizeStyles[size];
  };

  const { fontSize, pointsSize } = getDynamicSizes();

  // Use thinner borders for small board tiles (cellSize < 50)
  const isSmallTile = cellSize && cellSize < 50;
  const borderWidth = isSmallTile ? 1 : 2;

  // Determine text color based on validation state
  const textColor = validationState
    ? VALIDATION_COLORS[validationState]
    : VALIDATION_COLORS.default;

  // For blank tiles in the rack (letter is '*'), show empty or the asterisk
  // For blank tiles on board with chosen letter, show the letter with indicator
  const displayLetter = letter === '*' ? '' : letter;

  // For blank tiles, show colored border when there's validation
  const showColoredBorder = isBlank && isPending && validationState;

  return (
    <Container
      style={[
        styles.tile,
        {
          borderTopWidth: borderWidth,
          borderLeftWidth: borderWidth,
          borderBottomWidth: borderWidth,
          borderRightWidth: borderWidth,
        },
        isPending && styles.pendingTile,
        isSelected && styles.selectedTile,
        isBlank && isPending && styles.blankTile,
        showColoredBorder && { borderColor: textColor },
        disabled && styles.disabledTile,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Only show letter and points if not an unassigned blank */}
      {letter !== '*' && (
        <>
          <Text
            style={[
              styles.letter,
              { fontSize, color: textColor },
              letter === 'Q' && { marginRight: '12%', marginBottom: '8%' },
              disabled && styles.disabledText,
            ]}
          >
            {displayLetter}
          </Text>
          <Text
            style={[
              styles.points,
              { fontSize: pointsSize, color: textColor },
              letter === 'Q' && { right: '1%' },
              disabled && styles.disabledText,
            ]}
          >
            {points}
          </Text>
        </>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '92%',
    height: '92%',
    backgroundColor: colors.tileClassicBackground,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    // 3D embossed effect - light top/left, dark bottom/right
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: '#F5F3EF',
    borderLeftColor: '#F5F3EF',
    borderBottomColor: '#B8B4AA',
    borderRightColor: '#B8B4AA',
    // Enhanced shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  pendingTile: {
    backgroundColor: 'rgba(232, 228, 220, 0.5)',
    shadowColor: colors.tileShadow,
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  selectedTile: {
    backgroundColor: colors.tileClassicSelected,
  },
  disabledTile: {
    opacity: 0.5,
  },
  letter: {
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    // Ensure proper centering on Android
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      default: {},
    }),
  },
  points: {
    position: 'absolute',
    bottom: '4%',
    right: '5%',
    fontWeight: '800',
    color: '#1A1A1A',
    // Ensure proper centering on Android
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
      default: {},
    }),
  },
  disabledText: {
    color: '#666',
  },
  blankTile: {
    borderWidth: 5,
    borderColor: '#555555',
    borderStyle: 'dotted',
  },
});
