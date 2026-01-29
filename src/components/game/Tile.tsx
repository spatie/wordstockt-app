import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolateColor,
} from 'react-native-reanimated';
import { VALIDATION_COLORS, colors } from '../../config/theme';
import { TILE_SIZE } from '../../config/constants';
import type { TileValidationState } from '../../types';

// Animation duration for color transitions
const COLOR_ANIMATION_DURATION = 100;
// Delay before starting color animation after tile settles
const COLOR_ANIMATION_DELAY = 300;

// Fixed sizes for TILE_SIZE (52px) - all tiles render at this size and scale
// These ratios match the original tileSizing.ts calculations
const LETTER_SIZE_RATIO = 0.65;
const POINTS_SIZE_RATIO = 0.38;
const LETTER_FONT_SIZE = Math.round(TILE_SIZE * LETTER_SIZE_RATIO); // ~34px
const POINTS_FONT_SIZE = Math.round(TILE_SIZE * POINTS_SIZE_RATIO); // ~20px
const BORDER_WIDTH = 2;
const BORDER_RADIUS = 5;

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
}

/**
 * Unified Tile component - always renders at TILE_SIZE (52px).
 *
 * Parents are responsible for scaling to display size using CSS transform.
 * This ensures all tiles look identical regardless of display size.
 *
 * Usage:
 * - Rack tiles: Wrap in TILE_SIZE container (no scaling needed)
 * - Board tiles: Wrap in cellSize container with scale={cellSize/TILE_SIZE}
 * - Floating tiles: Animate scale from 1 to cellSize/TILE_SIZE
 */
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
}: TileProps) {
  // Animated color transition
  const getColorValue = (state: TileValidationState) =>
    state === 'valid'
      ? 1
      : state === 'invalid' || state === 'placement_error'
        ? -1
        : 0;

  const colorProgress = useSharedValue(0);
  const pulseProgress = useSharedValue(0);
  const prevValidationState = useRef<TileValidationState>(null);

  useEffect(() => {
    const targetValue = getColorValue(validationState);
    if (validationState !== prevValidationState.current) {
      const wasNeutral = getColorValue(prevValidationState.current) === 0;
      prevValidationState.current = validationState;

      if (wasNeutral && targetValue !== 0) {
        const timer = setTimeout(() => {
          colorProgress.set(
            withTiming(targetValue, {
              duration: COLOR_ANIMATION_DURATION,
            })
          );
        }, COLOR_ANIMATION_DELAY);
        return () => clearTimeout(timer);
      }

      colorProgress.set(
        withTiming(targetValue, {
          duration: COLOR_ANIMATION_DURATION,
        })
      );
    }
  }, [validationState, colorProgress]);

  // Pulse animation for pending tiles with validation state
  const hasHadValidationState = useRef(false);
  useEffect(() => {
    if (isPending && validationState !== null) {
      const isFirstValidation = !hasHadValidationState.current;
      hasHadValidationState.current = true;

      if (isFirstValidation) {
        const timer = setTimeout(() => {
          pulseProgress.set(
            withRepeat(withTiming(1, { duration: 1000 }), -1, true)
          );
        }, COLOR_ANIMATION_DELAY);
        return () => clearTimeout(timer);
      }

      pulseProgress.set(
        withRepeat(withTiming(1, { duration: 1000 }), -1, true)
      );
    } else {
      pulseProgress.set(0);
    }
  }, [isPending, validationState, pulseProgress]);

  // Animated text color
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

  // Animated background for pending tiles
  const animatedPendingBackgroundStyle = useAnimatedStyle(() => {
    'worklet';
    const baseColor = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      ['#FFE0E0', '#FFFFF0', '#E0FFE0']
    );
    const pulseColor = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      ['#FFC0C0', '#FFFFF0', '#90EE90']
    );
    const backgroundColor = interpolateColor(
      pulseProgress.value,
      [0, 1],
      [baseColor, pulseColor]
    );

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
    const borderBottomColor = interpolateColor(
      pulseProgress.value,
      [0, 1],
      [baseBorderDark, pulseBorderDark]
    );

    return {
      backgroundColor,
      borderTopColor,
      borderLeftColor: borderTopColor,
      borderBottomColor,
      borderRightColor: borderBottomColor,
    };
  });

  // Animated border for blank tiles
  const animatedBorderStyle = useAnimatedStyle(() => {
    'worklet';
    const borderColor = interpolateColor(
      colorProgress.value,
      [-1, 0, 1],
      [VALIDATION_COLORS.invalid, '#555555', VALIDATION_COLORS.valid]
    );
    return { borderColor };
  });

  if (!letter) return null;

  const displayLetter = letter === '*' ? '' : letter;
  const showAnimatedBorder = isBlank && isPending;

  const tileStyles = [
    styles.tile,
    isPending && styles.pendingTile,
    isSelected && styles.selectedTile,
    isBlank && isPending && styles.blankTile,
    disabled && styles.disabledTile,
  ];

  const content = letter !== '*' && (
    <>
      <Animated.Text
        style={[
          styles.letter,
          animatedTextStyle,
          letter === 'Q' && styles.letterQ,
          disabled && styles.disabledText,
        ]}
      >
        {displayLetter}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.points,
          points >= 10 && styles.pointsDouble,
          animatedTextStyle,
          disabled && styles.disabledText,
        ]}
      >
        {points}
      </Animated.Text>
    </>
  );

  const getAnimatedStyles = () => {
    if (isPending) {
      if (showAnimatedBorder) {
        return [
          tileStyles,
          animatedPendingBackgroundStyle,
          animatedBorderStyle,
        ];
      }
      return [tileStyles, animatedPendingBackgroundStyle];
    }
    if (showAnimatedBorder) {
      return [tileStyles, animatedBorderStyle];
    }
    return tileStyles;
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.container,
          { opacity: pressed && !disabled ? 0.7 : 1 },
        ]}
      >
        <Animated.View style={getAnimatedStyles()}>{content}</Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[getAnimatedStyles(), styles.container]}>
      {content}
    </Animated.View>
  );
}

/**
 * Wrapper component that scales a Tile to a target display size.
 * Use this for board cells where tiles need to display smaller than TILE_SIZE.
 */
interface ScaledTileProps extends TileProps {
  displaySize: number;
}

export function ScaledTile({ displaySize, ...tileProps }: ScaledTileProps) {
  const scale = displaySize / TILE_SIZE;

  return (
    <View
      style={[
        styles.scaledContainer,
        { width: displaySize, height: displaySize },
      ]}
    >
      <View style={[styles.scaleWrapper, { transform: [{ scale }] }]}>
        <Tile {...tileProps} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: colors.tileClassicBackground,
    borderRadius: BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
    borderBottomWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
    borderTopColor: '#F5F3EF',
    borderLeftColor: '#F5F3EF',
    borderBottomColor: '#B8B4AA',
    borderRightColor: '#B8B4AA',
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
    fontSize: LETTER_FONT_SIZE,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: '15%',
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      default: {},
    }),
  },
  letterQ: {
    marginRight: '30%',
  },
  points: {
    position: 'absolute',
    bottom: '-4%',
    right: 0,
    fontSize: POINTS_FONT_SIZE,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-condensed',
      default: 'System',
    }),
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
      default: {},
    }),
  },
  pointsDouble: {
    fontSize: POINTS_FONT_SIZE * 0.7,
  },
  disabledText: {
    color: '#666',
  },
  blankTile: {
    borderWidth: 5,
    borderColor: '#555555',
    borderStyle: 'dotted',
  },
  scaledContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleWrapper: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
});
