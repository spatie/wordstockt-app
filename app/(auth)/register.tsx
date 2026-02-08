import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useRegister } from '../../src/api/queries/useAuth';
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
import {
  isValidUsername,
  isValidEmail,
  isValidPassword,
  validationHints,
} from '../../src/utils/validation';

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

  const usernameValid = isValidUsername(username);
  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);

  const canSubmit =
    usernameValid && emailValid && passwordValid && !register.isPending;

  const showUsernameHint = username.length > 0 && !usernameValid;
  const showEmailHint = email.length > 0 && !emailValid;
  const showPasswordHint = password.length > 0 && !passwordValid;

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
            <View style={styles.logoContainer}>
              <MainLogo />
            </View>

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
              error={showUsernameHint ? validationHints.username : undefined}
            />

            <FormInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={showEmailHint ? validationHints.email : undefined}
            />

            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              autoComplete="new-password"
              error={showPasswordHint ? validationHints.password : undefined}
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
            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                !canSubmit && styles.registerButtonDisabled,
                { opacity: pressed && canSubmit ? 0.7 : 1 },
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
            </Pressable>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <Link href={ROUTES.LOGIN} asChild>
                <Pressable
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={styles.signInLink}>Sign In</Text>
                </Pressable>
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
    maxWidth: LAYOUT.authFormMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    marginTop: 20,
    marginBottom: SPACING.xl,
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
    backgroundColor: 'rgba(74, 144, 217, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 217, 0.5)',
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
