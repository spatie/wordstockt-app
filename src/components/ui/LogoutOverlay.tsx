import type { ThemeColors } from '../../config/theme';
import { useThemeColors, useThemedStyles } from '../../hooks/useThemeColors';
import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';

export function LogoutOverlay() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const isLoggingOut = useAuthStore((s) => s.isLoggingOut);

  // Stay mounted so the overlay fades out instead of disappearing
  return (
    <Modal transparent visible={isLoggingOut} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>Logging out...</Text>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      alignItems: 'center',
      gap: 16,
    },
    text: {
      color: colors.textPrimary,
      fontSize: 16,
    },
  });
