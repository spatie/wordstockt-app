import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors } from '../../config/theme';

import type { PressableProps } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(
  Pressable
) as React.ComponentType<PressableProps & { children?: React.ReactNode }>;

const SPINNER_DELAY = 200;

interface AnimatedSaveButtonProps {
  onPress: () => Promise<void>;
  onSuccess?: () => void;
  label: string;
  successLabel: string;
  disabled?: boolean;
  successDuration?: number;
}

export function AnimatedSaveButton({
  onPress,
  onSuccess,
  label,
  successLabel,
  disabled = false,
  successDuration = 2000,
}: AnimatedSaveButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const spinnerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colorProgress = useSharedValue(0);
  const labelOpacity = useSharedValue(1);
  const successOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const pressedOpacity = useSharedValue(1);

  const resetToIdle = useCallback(() => {
    setShowSuccess(false);
  }, []);

  const handlePress = useCallback(async () => {
    if (disabled || isPending || showSuccess) return;

    setIsPending(true);

    // Only show spinner after delay (avoids flash for fast requests)
    spinnerTimeoutRef.current = setTimeout(() => {
      setShowSpinner(true);
    }, SPINNER_DELAY);

    try {
      await onPress();

      // Clear spinner timeout and hide spinner
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
        spinnerTimeoutRef.current = null;
      }
      setShowSpinner(false);
      setIsPending(false);
      setShowSuccess(true);

      // Animate to success state
      colorProgress.set(withTiming(1, { duration: 300 }));
      labelOpacity.set(withTiming(0, { duration: 200 }));
      successOpacity.set(withTiming(1, { duration: 200 }));
      scale.set(
        withSequence(
          withSpring(1.02, { damping: 15, stiffness: 300 }),
          withSpring(1, { damping: 15, stiffness: 300 })
        )
      );

      // Call onSuccess callback after a short delay (if provided)
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 800);
      }

      // Revert after duration
      setTimeout(() => {
        colorProgress.set(withTiming(0, { duration: 300 }));
        labelOpacity.set(withTiming(1, { duration: 200 }));
        successOpacity.set(
          withTiming(0, { duration: 200 }, () => {
            scheduleOnRN(resetToIdle);
          })
        );
      }, successDuration);
    } catch {
      if (spinnerTimeoutRef.current) {
        clearTimeout(spinnerTimeoutRef.current);
        spinnerTimeoutRef.current = null;
      }
      setShowSpinner(false);
      setIsPending(false);
    }
  }, [
    onPress,
    onSuccess,
    disabled,
    isPending,
    showSuccess,
    colorProgress,
    labelOpacity,
    successOpacity,
    scale,
    successDuration,
    resetToIdle,
  ]);

  const handlePressIn = useCallback(() => {
    pressedOpacity.set(withTiming(0.7, { duration: 100 }));
  }, [pressedOpacity]);

  const handlePressOut = useCallback(() => {
    pressedOpacity.set(withTiming(1, { duration: 100 }));
  }, [pressedOpacity]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      [colors.primary, colors.gameWon]
    ),
    transform: [{ scale: scale.value }],
    opacity: pressedOpacity.value,
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const successAnimatedStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));

  const isDisabled = disabled || isPending || showSuccess;

  return (
    <AnimatedPressable
      style={[
        styles.button,
        buttonAnimatedStyle,
        isDisabled && !showSuccess && styles.buttonDisabled,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
    >
      {showSpinner ? (
        <ActivityIndicator color="#FFF" size="small" />
      ) : (
        <>
          <Animated.Text style={[styles.buttonText, labelAnimatedStyle]}>
            {label}
          </Animated.Text>
          <Animated.Text
            style={[
              styles.buttonText,
              styles.successText,
              successAnimatedStyle,
            ]}
          >
            {successLabel}
          </Animated.Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  successText: {
    position: 'absolute',
  },
});
