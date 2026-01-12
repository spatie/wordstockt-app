import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useResendVerification,
  useLogout,
} from '../../src/api/queries/useAuth';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/config/theme';
import { SPACING, RADIUS, DIMENSIONS } from '../../src/config/constants';

const LOGO_SIZE = 140;

function MainLogo() {
  return (
    <View style={styles.mainLogoContainer}>
      <View style={styles.mainLogoWrapper}>
        <Image
          source={require('../../assets/logo-source.png')}
          style={styles.mainLogoImage}
        />
        <LinearGradient
          colors={[colors.background, 'transparent']}
          style={styles.fadeTop}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.fadeBottom}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={[colors.background, 'transparent']}
          style={styles.fadeLeft}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.fadeRight}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </View>
    </View>
  );
}

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
      <View style={styles.content}>
        <MainLogo />

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

        <TouchableOpacity
          style={[styles.button, isResending && styles.buttonDisabled]}
          onPress={() => resend()}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Resend Verification Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => logout()}
          disabled={isLoggingOut}
        >
          <Text style={styles.secondaryButtonText}>
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </Text>
        </TouchableOpacity>
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
  mainLogoContainer: {
    marginTop: 20,
    marginBottom: SPACING.xl,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLogoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE * 0.22,
    overflow: 'hidden',
    position: 'relative',
  },
  mainLogoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 25,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 25,
  },
  fadeLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 25,
  },
  fadeRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 25,
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
    backgroundColor: colors.primary,
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
