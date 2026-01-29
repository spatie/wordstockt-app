import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '@/config/theme';
import { tiles } from '@/config/tileConfig';

const TILE_LETTERS = [
  'W',
  'O',
  'R',
  'D',
  'S',
  'T',
  'C',
  'K',
  'A',
  'E',
  'I',
  'N',
  'L',
  'P',
  'M',
];
const TILE_COLORS = [colors.primary, '#E85D4C', '#F5A623']; // blue, red, orange like the logo

function FloatingTile({
  delay,
  startX,
  startY,
  size,
  duration,
  letter,
  color,
  rotationRange,
  scaleRange,
  fadeDuration,
}: {
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
    progress.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        )
      )
    );
    rotation.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: duration * 1.5,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        )
      )
    );
    scale.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: duration * 0.8,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        )
      )
    );
    fade.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: fadeDuration,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        )
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -100]) },
      { translateX: interpolate(progress.value, [0, 0.5, 1], [0, 20, 0]) },
      {
        rotate: `${interpolate(rotation.value, [0, 0.5, 1], [-rotationRange, rotationRange, -rotationRange])}deg`,
      },
      {
        scale: interpolate(
          scale.value,
          [0, 0.5, 1],
          [scaleRange[0], scaleRange[1], scaleRange[0]]
        ),
      },
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
      <Text style={[styles.floatingTileLetter, { fontSize: size * 0.55 }]}>
        {letter}
      </Text>
    </Animated.View>
  );
}

export function FloatingTiles() {
  return (
    <View style={styles.container} pointerEvents="none">
      {tiles.map((t, i) => (
        <FloatingTile
          key={i}
          {...t}
          letter={TILE_LETTERS[i % TILE_LETTERS.length]!}
          color={TILE_COLORS[i % TILE_COLORS.length]!}
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
