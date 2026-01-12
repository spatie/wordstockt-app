import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../config/theme';

export function LogoutOverlay() {
  const isLoggingOut = useAuthStore((s) => s.isLoggingOut);

  if (!isLoggingOut) {
    return null;
  }

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>Logging out...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
