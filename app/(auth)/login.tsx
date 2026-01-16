import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useLogin } from '../../src/api/queries/useAuth';
import { getApiError } from '../../src/api/client';
import { LogoTile } from '../../src/components/ui/LogoTile';
import { FormInput } from '../../src/components/form/FormInput';
import { PasswordInput } from '../../src/components/form/PasswordInput';
import { colors } from '../../src/config/theme';
import { SPACING, RADIUS, DIMENSIONS } from '../../src/config/constants';
import { ROUTES } from '../../src/config/routes';

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerLogo}>
        <LogoTile letter="W" size="small" />
        <LogoTile letter="S" size="small" />
        <Text style={styles.headerTitle}>WordStockt</Text>
      </View>
    </View>
  );
}

const LOGO_SIZE = 140;

function MainLogo() {
  return (
    <View style={styles.mainLogoContainer}>
      <View style={styles.mainLogoWrapper}>
        <Image
          source={require('../../assets/logo-source.png')}
          style={styles.mainLogoImage}
        />
        {/* Fade overlays for smooth edge transition */}
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleLogin = async () => {
    login.mutate({ email, password });
  };

  const errorMessage = login.error ? getApiError(login.error).message : null;
  const canSubmit = email.length > 0 && password.length > 0 && !login.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraScrollHeight={20}
      >
        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(400)}>
            <MainLogo />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(100)}>
            <Text style={styles.title}>Welcome to WordStockt</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(300).delay(150)}>
            <Text style={styles.subtitle}>
              Enter your details to play WordStockt.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(200)}
            style={styles.fullWidth}
          >
            <FormInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email or Username"
              keyboardType="default"
              autoCapitalize="none"
              autoComplete="username"
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(250)}
            style={styles.fullWidth}
          >
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              autoComplete="password"
            />
          </Animated.View>

          {/* Forgot Password */}
          <Animated.View entering={FadeInDown.duration(300).delay(300)}>
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push(ROUTES.FORGOT_PASSWORD)}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Error Message */}
          {errorMessage && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={styles.errorContainer}
            >
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Animated.View>
          )}

          {/* Login Button */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(350)}
            style={styles.fullWidth}
          >
            <TouchableOpacity
              style={[
                styles.loginButton,
                !canSubmit && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!canSubmit}
            >
              {login.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Sign Up Link */}
          <Animated.View entering={FadeInDown.duration(300).delay(400)}>
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <Link href={ROUTES.REGISTER} asChild>
                <TouchableOpacity>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullWidth: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: SPACING.sm,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  mainLogoContainer: {
    marginTop: 40,
    marginBottom: SPACING.xxxl,
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 40,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xxl,
    marginTop: -SPACING.sm,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: DIMENSIONS.inputHeight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
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
});
