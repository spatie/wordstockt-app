import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolateColor,
} from 'react-native-reanimated';
import { VALIDATION_COLORS, colors } from '../../config/theme';
import { calculateTileFontSizes } from '../../config/tileSizing';
import type { TileValidationState } from '../../types';

// Animation duration for color transitions
const COLOR_ANIMATION_DURATION = 500;

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
  // Animated color transition
  // Map validation state to numeric value: 0 = default, 1 = valid, -1 = invalid
  const getColorValue = (state: TileValidationState) =>
    state === 'valid' ? 1 : state === 'invalid' ? -1 : 0;

  // Initialize with current state (no animation on first render)
  const colorProgress = useSharedValue(getColorValue(validationState));
  const pulseProgress = useSharedValue(0);
  const prevValidationState = useRef<TileValidationState>(validationState);

  useEffect(() => {
    if (validationState !== prevValidationState.current) {
      prevValidationState.current = validationState;
      colorProgress.value = withTiming(getColorValue(validationState), {
        duration: COLOR_ANIMATION_DURATION,
      });
    }
  }, [validationState, colorProgress]);

  // Start pulse animation when pending with validation state
  useEffect(() => {
    if (isPending && validationState !== null) {
      pulseProgress.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1, // Repeat indefinitely
        true // Reverse on each repeat
      );
    } else {
      pulseProgress.value = 0;
    }
  }, [isPending, validationState, pulseProgress]);

  // Animated style for text color
  const animatedTextStyle = useAnimatedStyle(() => {
    'worklet';
    const color = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      [
        VALIDATION_COLORS.invalid,
        VALIDATION_COLORS.default,
        VALIDATION_COLORS.valid,
      ]
    );
    return { color };
  });

  // Animated style for pending tile background (red/green tint with pulse)
  // Pending tiles are brighter/whiter than played tiles to stand out
  const animatedPendingBackgroundStyle = useAnimatedStyle(() => {
    'worklet';
    // Base colors (brighter)
    const baseColor = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      [
        '#FFE0E0', // Bright white-pink for invalid
        '#FFFFF0', // Bright ivory/white for neutral
        '#E0FFE0', // Bright white-green for valid
      ]
    );
    // More saturated colors for pulse peak
    const pulseColor = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      [
        '#FFC0C0', // Softer pink for invalid
        '#FFFFF0', // Same for neutral (no pulse)
        '#90EE90', // More saturated green for valid
      ]
    );
    // Interpolate between base and pulse colors
    const backgroundColor = interpolateColor(
      pulseProgress.value,
      [0, 1],
      [baseColor, pulseColor]
    );

    // Also animate border colors to match (lighter for top/left, darker for bottom/right)
    const baseBorderLight = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      ['#FFE8E8', '#FFFFF8', '#E8FFE8']
    );
    const baseBorderDark = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      ['#E8B8B8', '#E0E0D0', '#B8E8B8']
    );
    const pulseBorderLight = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      ['#FFD0D0', '#FFFFF8', '#B0F0B0']
    );
    const pulseBorderDark = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      ['#E0A8A8', '#E0E0D0', '#80C080']
    );

    const borderTopColor = interpolateColor(
      pulseProgress.value,
      [0, 1],
      [baseBorderLight, pulseBorderLight]
    );
    const borderLeftColor = borderTopColor;
    const borderBottomColor = interpolateColor(
      pulseProgress.value,
      [0, 1],
      [baseBorderDark, pulseBorderDark]
    );
    const borderRightColor = borderBottomColor;

    return {
      backgroundColor,
      borderTopColor,
      borderLeftColor,
      borderBottomColor,
      borderRightColor,
    };
  });

  // Animated style for border color (blank tiles)
  const animatedBorderStyle = useAnimatedStyle(() => {
    'worklet';
    const borderColor = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      [VALIDATION_COLORS.invalid, '#555555', VALIDATION_COLORS.valid]
    );
    return { borderColor };
  });

  // Don't render empty tiles (but blank tiles with '*' should render)
  if (!letter) return null;

  // Calculate font sizes based on cell size using unified sizing system
  const getDynamicSizes = () => {
    if (size === 'board' && cellSize) {
      const { letterSize, pointsSize } = calculateTileFontSizes(cellSize);
      return { fontSize: letterSize, pointsSize };
    }

    // Fallback sizes for non-board tiles
    const sizeStyles = {
      board: { fontSize: 18, pointsSize: 8 },
      small: { fontSize: 26, pointsSize: 10 },
      normal: { fontSize: 32, pointsSize: 11 },
      large: { fontSize: 38, pointsSize: 12 },
    };

    return sizeStyles[size];
  };

  const { fontSize, pointsSize } = getDynamicSizes();

  // Use thinner borders for small board tiles (cellSize < 50)
  const isSmallTile = cellSize && cellSize < 50;
  const borderWidth = isSmallTile ? 1 : 2;

  // For blank tiles in the rack (letter is '*'), show empty or the asterisk
  // For blank tiles on board with chosen letter, show the letter with indicator
  const displayLetter = letter === '*' ? '' : letter;

  // For blank tiles, also animate the border color
  const showAnimatedBorder = isBlank && isPending;

  // Base tile styles (background is animated separately via animatedTileStyle)
  const tileStyles = [
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
    disabled && styles.disabledTile,
  ];

  // Content (letter and points)
  const content = letter !== '*' && (
    <>
      <Animated.Text
        style={[
          styles.letter,
          { fontSize },
          animatedTextStyle,
          letter === 'Q' && { marginRight: '30%' },
          disabled && styles.disabledText,
        ]}
      >
        {displayLetter}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.points,
          { fontSize: points >= 10 ? pointsSize * 0.7 : pointsSize },
          animatedTextStyle,
          disabled && styles.disabledText,
        ]}
      >
        {points}
      </Animated.Text>
    </>
  );

  // Build animated styles based on tile state
  const getAnimatedStyles = () => {
    if (isPending) {
      // Pending tiles get animated background (red/green/transparent)
      if (showAnimatedBorder) {
        return [
          tileStyles,
          animatedPendingBackgroundStyle,
          animatedBorderStyle,
        ];
      }
      return [tileStyles, animatedPendingBackgroundStyle];
    }
    // Non-pending tiles use static background
    if (showAnimatedBorder) {
      return [tileStyles, animatedBorderStyle];
    }
    return tileStyles;
  };
  const animatedStyles = getAnimatedStyles();

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={styles.tileWrapper}
      >
        <Animated.View style={animatedStyles}>{content}</Animated.View>
      </TouchableOpacity>
    );
  }

  // For non-pressable tiles, apply wrapper size after tile styles so it wins
  return (
    <Animated.View style={[animatedStyles, styles.tileWrapper]}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tileWrapper: {
    width: '99%',
    height: '99%',
  },
  tile: {
    // Size is handled by tileWrapper
    width: '100%',
    height: '100%',
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
    // Note: color is set via animatedTextStyle for smooth transitions
    textAlign: 'center',
    marginRight: '15%',
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
    bottom: '-4%',
    right: 0,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-condensed',
      default: 'System',
    }),
    // Note: color is set via animatedTextStyle for smooth transitions
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
