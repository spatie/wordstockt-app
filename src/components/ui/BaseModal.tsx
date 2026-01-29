import React, { useEffect, useRef, useState } from 'react';
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
import { colors, shadows } from '../../config/theme';
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
  const [modalVisible, setModalVisible] = useState(visible);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Set initial values before showing modal to prevent flicker
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);

      if (backdropBlur && Platform.OS === 'web') {
        blurAnim.setValue(8);
      }

      setModalVisible(true);

      // Start animations immediately
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, backdropBlur, blurAnim, scaleAnim, opacityAnim, modalVisible]);

  // iOS: lighter bg when blur is enabled since BlurView provides real blur
  // Android: use full opacity since BlurView doesn't support blur
  const getBackgroundOpacity = () => {
    if (!backdropBlur) return overlayOpacity;
    if (Platform.OS === 'ios') return overlayOpacity * 0.5;
    return overlayOpacity; // Android: no blur support, use full opacity
  };

  const animatedContentStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  const modalContent = (
    <View
      style={[
        styles.overlay,
        { justifyContent: centered ? 'center' : 'flex-start' },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[styles.content, contentStyle, animatedContentStyle]}
      >
        {children}
      </Animated.View>
    </View>
  );

  // Web: create static blur style (no animation to avoid flicker)
  const webBlurStyle =
    Platform.OS === 'web' && backdropBlur
      ? {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }
      : undefined;

  const backdropStyle = [
    StyleSheet.absoluteFill,
    { backgroundColor: `rgba(0, 0, 0, ${getBackgroundOpacity()})` },
  ];

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      <Animated.View style={{ flex: 1, opacity: opacityAnim }}>
        {/* Backdrop - sibling to content, not parent */}
        {backdropBlur && Platform.OS !== 'web' ? (
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
            <Pressable style={backdropStyle} onPress={onClose} />
          </BlurView>
        ) : backdropBlur && Platform.OS === 'web' ? (
          <Pressable style={[backdropStyle, webBlurStyle]} onPress={onClose} />
        ) : (
          <Pressable style={backdropStyle} onPress={onClose} />
        )}
        {/* Content - positioned above backdrop */}
        {modalContent}
      </Animated.View>
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
    ...shadows.xl,
  },
});
