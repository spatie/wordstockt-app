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
import { TILE_COLORS, TILE_LETTERS, tiles } from '@/config/tileConfig';

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
}) {
  // Consolidated: 2 shared values instead of 4
  const moveProgress = useSharedValue(0); // for translateX, translateY
  const styleProgress = useSharedValue(0); // for rotation, scale, opacity

  useEffect(() => {
    // Movement animation using base duration
    moveProgress.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
          -1,
          true
        )
      )
    );
    // Style animation using duration * 1.1 as middle ground between 0.8 and 1.5
    styleProgress.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: duration * 1.1,
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
      { translateY: interpolate(moveProgress.get(), [0, 1], [0, -100]) },
      { translateX: interpolate(moveProgress.get(), [0, 0.5, 1], [0, 20, 0]) },
      {
        rotate: `${interpolate(styleProgress.get(), [0, 0.5, 1], [-rotationRange, rotationRange, -rotationRange])}deg`,
      },
      {
        scale: interpolate(
          styleProgress.get(),
          [0, 0.5, 1],
          [scaleRange[0], scaleRange[1], scaleRange[0]]
        ),
      },
    ],
    opacity: interpolate(
      styleProgress.get(),
      [0, 0.3, 0.7, 1],
      [0.1, 0.3, 0.3, 0.1]
    ),
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
