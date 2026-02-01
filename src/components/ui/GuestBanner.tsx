import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../config/theme';
import { SPACING, RADIUS } from '../../config/constants';
import { useAuthStore } from '../../stores/authStore';
import { ROUTES } from '../../config/routes';

export function GuestBanner() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isGuest || isDismissed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="person-outline" size={16} color={colors.primary} />
      </View>
      <Text style={styles.text}>Playing as guest</Text>
      <Pressable
        onPress={() => router.push(ROUTES.CONVERT_ACCOUNT)}
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={styles.buttonText}>Create Account</Text>
      </Pressable>
      <Pressable
        onPress={() => setIsDismissed(true)}
        style={({ pressed }) => [
          styles.dismissButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  text: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.sm,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  dismissButton: {
    padding: 4,
  },
});
