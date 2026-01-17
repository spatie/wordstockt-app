import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useRegister } from '../../src/api/queries/useAuth';
import { getApiError } from '../../src/api/client';
import { FormInput } from '../../src/components/form/FormInput';
import { PasswordInput } from '../../src/components/form/PasswordInput';
import { colors } from '../../src/config/theme';
import { SPACING, RADIUS, DIMENSIONS } from '../../src/config/constants';
import { ROUTES } from '../../src/config/routes';

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

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useRegister();

  const handleRegister = async () => {
    register.mutate({
      username,
      email,
      password,
      password_confirmation: password,
    });
  };

  const errorMessage = register.error
    ? getApiError(register.error).message
    : null;

  // Validation
  const isUsernameValid = username.length >= 3 && username.length <= 20;
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 8;

  const canSubmit =
    isUsernameValid && isEmailValid && isPasswordValid && !register.isPending;

  // Show validation hints only after user starts typing
  const showUsernameHint = username.length > 0 && !isUsernameValid;
  const showEmailHint = email.length > 0 && !isEmailValid;
  const showPasswordHint = password.length > 0 && !isPasswordValid;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <MainLogo />

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join WordStockt and challenge your friends.
            </Text>

            <FormInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              autoCapitalize="none"
              autoComplete="username"
              error={showUsernameHint ? '3-20 characters required' : undefined}
            />

            <FormInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={showEmailHint ? 'Enter a valid email' : undefined}
            />

            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              autoComplete="new-password"
              error={showPasswordHint ? 'At least 8 characters' : undefined}
            />

            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Privacy Policy Notice */}
            <Text style={styles.privacyNotice}>
              By creating an account, you agree to our{' '}
              <Text
                style={styles.privacyLink}
                onPress={() =>
                  Linking.openURL('https://wordstockt.com/privacy')
                }
              >
                Privacy Policy
              </Text>
            </Text>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                !canSubmit && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={!canSubmit}
            >
              {register.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <Text style={styles.registerButtonIcon}>→</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <Link href={ROUTES.LOGIN} asChild>
                <TouchableOpacity>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
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
  privacyNotice: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  privacyLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  registerButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: DIMENSIONS.inputHeight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  registerButtonIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
