import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../config/theme';
import { SPACING, RADIUS } from '../../config/constants';
import { useAuthStore } from '../../stores/authStore';
import { useResendVerification } from '../../api/queries/useAuth';
import {
  isInGracePeriod,
  getDaysRemainingInGracePeriod,
} from '../../utils/emailVerification';

export function VerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const { mutate: resend, isPending } = useResendVerification();
  const insets = useSafeAreaInsets();

  if (!user || !isInGracePeriod(user)) {
    return null;
  }

  const daysRemaining = getDaysRemainingInGracePeriod(user);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.content}>
        <Text style={styles.text}>
          Please verify your email. {daysRemaining} day
          {daysRemaining !== 1 ? 's' : ''} remaining.
        </Text>
        <Pressable
          onPress={() => resend()}
          disabled={isPending}
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed && !isPending ? 0.7 : 1 },
          ]}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.buttonText}>Resend</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: '#000',
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginLeft: SPACING.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
});
