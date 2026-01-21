import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../config/theme';

const SPINNER_SIZE = 40;
const SPINNER_THICKNESS = 4;

interface AnimatedSplashProps {
  onAnimationComplete: () => void;
  isReady: boolean;
}

export function AnimatedSplash({
  onAnimationComplete,
  isReady,
}: AnimatedSplashProps) {
  const rotation = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const finishAnimation = useCallback(() => {
    onAnimationComplete();
  }, [onAnimationComplete]);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    containerOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(finishAnimation)();
      }
    });
  }, [isReady, containerOpacity, finishAnimation]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <Animated.View style={[styles.spinner, spinnerStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: SPINNER_THICKNESS,
    borderColor: colors.backgroundLight,
    borderTopColor: colors.primary,
  },
});
