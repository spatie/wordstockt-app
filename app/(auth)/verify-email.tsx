import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useResendVerification,
  useLogout,
} from '../../src/api/queries/useAuth';
import { useAuthStore } from '../../src/stores/authStore';
import { MainLogo } from '../../src/components/ui/MainLogo';
import { FloatingTiles } from '../../src/components/ui/FloatingTiles';
import { colors } from '../../src/config/theme';
import { SPACING, RADIUS, DIMENSIONS } from '../../src/config/constants';

export default function VerifyEmailScreen() {
  const user = useAuthStore((s) => s.user);
  const {
    mutate: resend,
    isPending: isResending,
    isSuccess,
  } = useResendVerification();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D1B2A', '#152238', '#0D1B2A']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <FloatingTiles />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <MainLogo />
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉️</Text>
        </View>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          Your verification grace period has expired. Please verify your email
          address to continue using WordStockt.
        </Text>

        {user?.email && <Text style={styles.email}>{user.email}</Text>}

        {isSuccess && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              Verification email sent! Check your inbox.
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            isResending && styles.buttonDisabled,
            { opacity: pressed && !isResending ? 0.7 : 1 },
          ]}
          onPress={() => resend()}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Resend Verification Email</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { opacity: pressed && !isLoggingOut ? 0.7 : 1 },
          ]}
          onPress={() => logout()}
          disabled={isLoggingOut}
        >
          <Text style={styles.secondaryButtonText}>
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 20,
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: SPACING.xl,
  },
  successBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  successText: {
    color: '#22C55E',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: 'rgba(74, 144, 217, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 217, 0.5)',
    borderRadius: 30,
    height: DIMENSIONS.inputHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButton: {
    padding: SPACING.md,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
