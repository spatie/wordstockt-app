import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useLogin, useGuestLogin } from '../../src/api/queries/useAuth';
import { getApiError } from '../../src/api/client';
import { FormInput } from '../../src/components/form/FormInput';
import { PasswordInput } from '../../src/components/form/PasswordInput';
import { MainLogo } from '../../src/components/ui/MainLogo';
import { FloatingTiles } from '../../src/components/ui/FloatingTiles';
import { colors } from '../../src/config/theme';
import {
  SPACING,
  RADIUS,
  DIMENSIONS,
  LAYOUT,
} from '../../src/config/constants';
import { ROUTES } from '../../src/config/routes';

function GlowingLogo() {
  return (
    <View style={styles.logoWrapper}>
      <MainLogo />
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const guestLogin = useGuestLogin();

  const handleLogin = async () => {
    login.mutate({ email, password });
  };

  const handleGuestLogin = () => {
    guestLogin.mutate();
  };

  const errorMessage = login.error
    ? getApiError(login.error).message
    : guestLogin.error
      ? getApiError(guestLogin.error).message
      : null;
  const canSubmit =
    email.length > 0 &&
    password.length > 0 &&
    !login.isPending &&
    !guestLogin.isPending;
  const isLoading = login.isPending || guestLogin.isPending;

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
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          extraScrollHeight={20}
        >
          <View style={styles.content}>
            <Animated.View
              entering={FadeIn.duration(600)}
              style={styles.logoContainer}
            >
              <GlowingLogo />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(150)}>
              <Text style={styles.title}>WordStockt</Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              style={styles.formContainer}
            >
              <View style={styles.inputWrapper}>
                <FormInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email or Username"
                  keyboardType="default"
                  autoCapitalize="none"
                  autoComplete="username"
                />
              </View>

              <View style={styles.inputWrapper}>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  autoComplete="password"
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.forgotPassword,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => router.push(ROUTES.FORGOT_PASSWORD)}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>

              {errorMessage && (
                <Animated.View
                  entering={FadeInDown.duration(200)}
                  style={styles.errorContainer}
                >
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </Animated.View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.loginButtonOuter,
                  (!canSubmit || isLoading) && styles.loginButtonDisabled,
                  { opacity: pressed && canSubmit && !isLoading ? 0.8 : 1 },
                ]}
                onPress={handleLogin}
                disabled={!canSubmit || isLoading}
              >
                <BlurView intensity={30} tint="dark" style={styles.loginButton}>
                  {login.isPending ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Log In</Text>
                  )}
                </BlurView>
              </Pressable>

              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>
                  Don&apos;t have an account?{' '}
                </Text>
                <Link href={ROUTES.REGISTER} asChild>
                  <Pressable
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text style={styles.signUpLink}>Sign Up</Text>
                  </Pressable>
                </Link>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(400).delay(350)}
              style={styles.guestSection}
            >
              <View style={styles.dividerContainer}>
                <LinearGradient
                  colors={['transparent', colors.border]}
                  style={styles.dividerGradient}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
                <Text style={styles.dividerText}>or</Text>
                <LinearGradient
                  colors={[colors.border, 'transparent']}
                  style={styles.dividerGradient}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.guestButtonOuter,
                  isLoading && styles.guestButtonDisabled,
                  { opacity: pressed && !isLoading ? 0.7 : 1 },
                ]}
                onPress={handleGuestLogin}
                disabled={isLoading}
              >
                <BlurView intensity={25} tint="dark" style={styles.guestButton}>
                  {guestLogin.isPending ? (
                    <ActivityIndicator color={colors.textSecondary} />
                  ) : (
                    <Text style={styles.guestButtonText}>Play as Guest</Text>
                  )}
                </BlurView>
              </Pressable>

              <Text style={styles.guestHelperText}>
                Try the game first - no account needed
              </Text>
            </Animated.View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 20,
    alignItems: 'center',
    maxWidth: LAYOUT.authFormMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    marginTop: 40,
    marginBottom: SPACING.xl,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputWrapper: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
    marginTop: -SPACING.sm,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButtonOuter: {
    width: '100%',
    borderRadius: 28,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 217, 0.5)',
    overflow: 'hidden',
  },
  loginButton: {
    height: DIMENSIONS.inputHeight,
    backgroundColor: 'rgba(74, 144, 217, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  guestSection: {
    width: '100%',
    marginTop: 36,
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  dividerGradient: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: SPACING.lg,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  guestButtonOuter: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  guestButton: {
    height: DIMENSIONS.inputHeight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  guestButtonDisabled: {
    opacity: 0.5,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  guestHelperText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
