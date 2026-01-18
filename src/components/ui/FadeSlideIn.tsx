import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface FadeSlideInProps {
  children: React.ReactNode;
  delay?: number;
  visible: boolean;
  fullWidth?: boolean;
}

export function FadeSlideIn({
  children,
  delay = 0,
  visible,
  fullWidth = false,
}: FadeSlideInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(16);

      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.spring(opacity, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [delay, opacity, translateY, visible]);

  return (
    <Animated.View
      style={[
        { opacity, transform: [{ translateY }], alignItems: 'center' },
        fullWidth && { width: '100%' },
      ]}
    >
      {children}
    </Animated.View>
  );
}
