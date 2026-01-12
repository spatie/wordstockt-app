import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../config/theme';
import { RADIUS, SPACING } from '../../config/constants';

type OverlayOpacity = 0.5 | 0.7;

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  overlayOpacity?: OverlayOpacity;
  backdropBlur?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  centered?: boolean;
  testID?: string;
}

/**
 * Base modal component with consistent styling across the app.
 *
 * Usage:
 * ```tsx
 * <BaseModal visible={visible} onClose={onClose}>
 *   <Text>Modal content</Text>
 * </BaseModal>
 * ```
 */
export function BaseModal({
  visible,
  onClose,
  children,
  overlayOpacity = 0.5,
  backdropBlur = false,
  contentStyle,
  centered = true,
  testID,
}: BaseModalProps) {
  // Animate blur on web
  const blurAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && backdropBlur && Platform.OS === 'web') {
      blurAnim.setValue(0);
      Animated.timing(blurAnim, {
        toValue: 8,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, backdropBlur, blurAnim]);

  const overlayStyle = [
    styles.overlay,
    {
      backgroundColor: backdropBlur
        ? `rgba(0, 0, 0, ${overlayOpacity * 0.5})`
        : `rgba(0, 0, 0, ${overlayOpacity})`,
      justifyContent: centered ? 'center' : 'flex-start',
    },
  ];

  const modalContent = (
    <Pressable style={[styles.content, contentStyle]} onPress={() => {}}>
      {children}
    </Pressable>
  );

  // Web: create animated blur style
  const webBlurStyle =
    Platform.OS === 'web' && backdropBlur
      ? {
          backdropFilter: blurAnim.interpolate({
            inputRange: [0, 8],
            outputRange: ['blur(0px)', 'blur(8px)'],
          }),
          WebkitBackdropFilter: blurAnim.interpolate({
            inputRange: [0, 8],
            outputRange: ['blur(0px)', 'blur(8px)'],
          }),
        }
      : undefined;

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      {/* Native: use BlurView for blur effect */}
      {backdropBlur && Platform.OS !== 'web' ? (
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable
            style={overlayStyle as StyleProp<ViewStyle>}
            onPress={onClose}
          >
            {modalContent}
          </Pressable>
        </BlurView>
      ) : backdropBlur && Platform.OS === 'web' ? (
        <AnimatedPressable
          style={[overlayStyle as StyleProp<ViewStyle>, webBlurStyle]}
          onPress={onClose}
        >
          {modalContent}
        </AnimatedPressable>
      ) : (
        <Pressable
          style={overlayStyle as StyleProp<ViewStyle>}
          onPress={onClose}
        >
          {modalContent}
        </Pressable>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  content: {
    backgroundColor: colors.backgroundLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    width: '100%',
    maxWidth: 400,
  },
});
