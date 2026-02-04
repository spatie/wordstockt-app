import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withDelay,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const SPINNER_DELAY_MS = 600;
const FADE_IN_DURATION = 200;
const FADE_OUT_DURATION = 150;

// Logo colors: red corners, blue edges, orange center
const LOGO_COLORS = {
  red: '#E74C3C',
  blue: '#4A90D9',
  orange: '#F5A623',
};

// Grid positions and their colors (3x3)
const GRID_CELLS = [
  { row: 0, col: 0, color: LOGO_COLORS.red }, // top-left corner
  { row: 0, col: 1, color: LOGO_COLORS.blue }, // top edge
  { row: 0, col: 2, color: LOGO_COLORS.red }, // top-right corner
  { row: 1, col: 0, color: LOGO_COLORS.blue }, // left edge
  { row: 1, col: 1, color: LOGO_COLORS.orange }, // center
  { row: 1, col: 2, color: LOGO_COLORS.blue }, // right edge
  { row: 2, col: 0, color: LOGO_COLORS.red }, // bottom-left corner
  { row: 2, col: 1, color: LOGO_COLORS.blue }, // bottom edge
  { row: 2, col: 2, color: LOGO_COLORS.red }, // bottom-right corner
];

// Calculate delay based on distance from center (manhattan distance)
function getAnimationDelay(row: number, col: number): number {
  const centerRow = 1;
  const centerCol = 1;
  const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
  return distance * 100; // 0ms for center, 100ms for edges, 200ms for corners
}

interface PulseCellProps {
  color: string;
  delay: number;
}

function PulseCell({ color, delay }: PulseCellProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    const duration = 750;

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.cell, { backgroundColor: color }, animatedStyle]}
    />
  );
}

interface LoadingViewProps {
  visible?: boolean;
  onFadeOutComplete?: () => void;
}

export function LoadingView({
  visible = true,
  onFadeOutComplete,
}: LoadingViewProps) {
  const [showSpinner, setShowSpinner] = useState(false);
  const [shouldRender, setShouldRender] = useState(visible);
  const containerOpacity = useSharedValue(0);

  // Handle initial delay before showing spinner
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setShowSpinner(true);
        containerOpacity.value = withTiming(1, { duration: FADE_IN_DURATION });
      }, SPINNER_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [visible, containerOpacity]);

  // Handle fade out when visible becomes false
  useEffect(() => {
    if (!visible) {
      if (showSpinner) {
        // Spinner is showing - fade it out
        containerOpacity.value = withTiming(
          0,
          { duration: FADE_OUT_DURATION },
          (finished) => {
            if (finished) {
              runOnJS(setShouldRender)(false);
              if (onFadeOutComplete) {
                runOnJS(onFadeOutComplete)();
              }
            }
          }
        );
      } else if (shouldRender) {
        // Spinner never showed (fast load) - call callback immediately
        setShouldRender(false);
        onFadeOutComplete?.();
      }
    }
  }, [visible, showSpinner, shouldRender, containerOpacity, onFadeOutComplete]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  if (!shouldRender) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showSpinner && (
        <Animated.View style={[styles.logoGrid, animatedContainerStyle]}>
          {GRID_CELLS.map((cell, index) => (
            <PulseCell
              key={index}
              color={cell.color}
              delay={getAnimationDelay(cell.row, cell.col)}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const CELL_SIZE = 28;
const GAP_SIZE = 4;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGrid: {
    width: CELL_SIZE * 3 + GAP_SIZE * 2,
    height: CELL_SIZE * 3 + GAP_SIZE * 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP_SIZE,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 5,
  },
});
