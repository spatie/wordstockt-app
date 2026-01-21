import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../../config/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TILE_LETTERS = ['W', 'O', 'R', 'D', 'S', 'T', 'C', 'K', 'A', 'E', 'I', 'N', 'L', 'P', 'M'];
const TILE_COLORS = [colors.primary, '#E85D4C', '#F5A623']; // blue, red, orange like the logo

function FloatingTile({ delay, startX, startY, size, duration, letter, color, rotationRange, scaleRange, fadeDuration }: {
  delay: number;
  startX: number;
  startY: number;
  size: number;
  duration: number;
  letter: string;
  color: string;
  rotationRange: number;
  scaleRange: [number, number];
  fadeDuration: number;
}) {
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: duration * 1.5, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    fade.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: fadeDuration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -100]) },
      { translateX: interpolate(progress.value, [0, 0.5, 1], [0, 20, 0]) },
      { rotate: `${interpolate(rotation.value, [0, 0.5, 1], [-rotationRange, rotationRange, -rotationRange])}deg` },
      { scale: interpolate(scale.value, [0, 0.5, 1], [scaleRange[0], scaleRange[1], scaleRange[0]]) },
    ],
    opacity: interpolate(fade.value, [0, 0.3, 0.7, 1], [0.1, 0.3, 0.3, 0.1]),
  }));

  return (
    <Animated.View
      style={[
        styles.floatingTile,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size * 0.2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.floatingTileLetter, { fontSize: size * 0.55 }]}>{letter}</Text>
    </Animated.View>
  );
}

export function FloatingTiles() {
  const tiles = [
    { delay: 0, startX: SCREEN_WIDTH * 0.02, startY: SCREEN_HEIGHT * 0.2, size: 28, duration: 12000, rotationRange: 15, scaleRange: [0.9, 1.1] as [number, number], fadeDuration: 8000 },
    { delay: 1500, startX: SCREEN_WIDTH * 0.85, startY: SCREEN_HEIGHT * 0.15, size: 24, duration: 14000, rotationRange: 20, scaleRange: [0.85, 1.15] as [number, number], fadeDuration: 6500 },
    { delay: 3000, startX: SCREEN_WIDTH * 0.1, startY: SCREEN_HEIGHT * 0.5, size: 32, duration: 11000, rotationRange: 12, scaleRange: [0.95, 1.1] as [number, number], fadeDuration: 9500 },
    { delay: 500, startX: SCREEN_WIDTH * 0.8, startY: SCREEN_HEIGHT * 0.4, size: 26, duration: 13000, rotationRange: 18, scaleRange: [0.9, 1.12] as [number, number], fadeDuration: 7200 },
    { delay: 2000, startX: SCREEN_WIDTH * 0.5, startY: SCREEN_HEIGHT * 0.7, size: 30, duration: 10000, rotationRange: 25, scaleRange: [0.88, 1.08] as [number, number], fadeDuration: 5800 },
    { delay: 4000, startX: SCREEN_WIDTH * 0.05, startY: SCREEN_HEIGHT * 0.75, size: 24, duration: 15000, rotationRange: 10, scaleRange: [0.92, 1.1] as [number, number], fadeDuration: 10500 },
    { delay: 2500, startX: SCREEN_WIDTH * 0.9, startY: SCREEN_HEIGHT * 0.6, size: 28, duration: 12500, rotationRange: 22, scaleRange: [0.85, 1.15] as [number, number], fadeDuration: 7800 },
    { delay: 1000, startX: SCREEN_WIDTH * 0.35, startY: SCREEN_HEIGHT * 0.1, size: 22, duration: 13500, rotationRange: 16, scaleRange: [0.9, 1.1] as [number, number], fadeDuration: 6200 },
    { delay: 3500, startX: SCREEN_WIDTH * 0.65, startY: SCREEN_HEIGHT * 0.8, size: 26, duration: 11500, rotationRange: 14, scaleRange: [0.88, 1.12] as [number, number], fadeDuration: 8800 },
    { delay: 800, startX: SCREEN_WIDTH * -0.02, startY: SCREEN_HEIGHT * 0.38, size: 30, duration: 14500, rotationRange: 20, scaleRange: [0.92, 1.08] as [number, number], fadeDuration: 11000 },
    { delay: 4500, startX: SCREEN_WIDTH * 0.92, startY: SCREEN_HEIGHT * 0.28, size: 24, duration: 10500, rotationRange: 18, scaleRange: [0.9, 1.15] as [number, number], fadeDuration: 5500 },
    { delay: 1800, startX: SCREEN_WIDTH * 0.45, startY: SCREEN_HEIGHT * 0.85, size: 28, duration: 12000, rotationRange: 12, scaleRange: [0.85, 1.1] as [number, number], fadeDuration: 9000 },
    { delay: 2800, startX: SCREEN_WIDTH * 0.75, startY: SCREEN_HEIGHT * 0.05, size: 26, duration: 13000, rotationRange: 24, scaleRange: [0.9, 1.12] as [number, number], fadeDuration: 7500 },
    { delay: 600, startX: SCREEN_WIDTH * 0.2, startY: SCREEN_HEIGHT * 0.65, size: 32, duration: 11000, rotationRange: 15, scaleRange: [0.88, 1.08] as [number, number], fadeDuration: 6800 },
    { delay: 3800, startX: SCREEN_WIDTH * 0.55, startY: SCREEN_HEIGHT * 0.32, size: 24, duration: 14000, rotationRange: 20, scaleRange: [0.92, 1.15] as [number, number], fadeDuration: 8500 },
    { delay: 1200, startX: SCREEN_WIDTH * 0.03, startY: SCREEN_HEIGHT * 0.88, size: 28, duration: 12500, rotationRange: 16, scaleRange: [0.85, 1.1] as [number, number], fadeDuration: 10000 },
    { delay: 2200, startX: SCREEN_WIDTH * 0.88, startY: SCREEN_HEIGHT * 0.72, size: 26, duration: 13500, rotationRange: 22, scaleRange: [0.9, 1.12] as [number, number], fadeDuration: 6000 },
    { delay: 4200, startX: SCREEN_WIDTH * 0.28, startY: SCREEN_HEIGHT * 0.22, size: 30, duration: 11500, rotationRange: 14, scaleRange: [0.88, 1.08] as [number, number], fadeDuration: 9200 },
    { delay: 700, startX: SCREEN_WIDTH * 0.7, startY: SCREEN_HEIGHT * 0.55, size: 24, duration: 14500, rotationRange: 18, scaleRange: [0.92, 1.1] as [number, number], fadeDuration: 7000 },
    { delay: 3200, startX: SCREEN_WIDTH * 0.15, startY: SCREEN_HEIGHT * 0.42, size: 28, duration: 10500, rotationRange: 20, scaleRange: [0.9, 1.15] as [number, number], fadeDuration: 8200 },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {tiles.map((t, i) => (
        <FloatingTile
          key={i}
          {...t}
          letter={TILE_LETTERS[i % TILE_LETTERS.length]}
          color={TILE_COLORS[i % TILE_COLORS.length]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingTile: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingTileLetter: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
