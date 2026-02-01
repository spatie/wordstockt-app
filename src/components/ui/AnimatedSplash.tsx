import React, { useEffect, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
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
    rotation.set(
      withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [rotation]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    containerOpacity.set(
      withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          scheduleOnRN(finishAnimation);
        }
      })
    );
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
