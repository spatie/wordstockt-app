import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_SIZE = SCREEN_WIDTH * 0.4;

interface AnimatedSplashProps {
  onAnimationComplete: () => void;
  isReady: boolean;
}

export function AnimatedSplash({
  onAnimationComplete,
  isReady,
}: AnimatedSplashProps) {
  const logoScale = useSharedValue(1);
  const logoOpacity = useSharedValue(1);
  const containerOpacity = useSharedValue(1);

  const finishAnimation = useCallback(() => {
    onAnimationComplete();
  }, [onAnimationComplete]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const HOLD_DELAY = 100;
    const POP_DURATION = 150;
    const FADE_DURATION = 300;
    const CONTAINER_FADE = 200;

    logoScale.value = withDelay(
      HOLD_DELAY,
      withSequence(
        withSpring(1.08, { damping: 12, stiffness: 400 }),
        withTiming(1.2, {
          duration: FADE_DURATION,
          easing: Easing.out(Easing.ease),
        })
      )
    );

    logoOpacity.value = withDelay(
      HOLD_DELAY + POP_DURATION,
      withTiming(0, {
        duration: FADE_DURATION,
        easing: Easing.out(Easing.ease),
      })
    );

    containerOpacity.value = withDelay(
      HOLD_DELAY + POP_DURATION + FADE_DURATION - 100,
      withTiming(0, { duration: CONTAINER_FADE }, (finished) => {
        if (finished) {
          runOnJS(finishAnimation)();
        }
      })
    );
  }, [isReady, logoScale, logoOpacity, containerOpacity, finishAnimation]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <Animated.View style={logoAnimatedStyle}>
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
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
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
