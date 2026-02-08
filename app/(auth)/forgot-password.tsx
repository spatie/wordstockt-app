import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useForgotPassword } from '../../src/api/queries/useAuth';
import { getApiError } from '../../src/api/client';
import { FormInput } from '../../src/components/form/FormInput';
import { MainLogo } from '../../src/components/ui/MainLogo';
import { FloatingTiles } from '../../src/components/ui/FloatingTiles';
import { colors } from '../../src/config/theme';
import {
  SPACING,
  RADIUS,
  DIMENSIONS,
  LAYOUT,
} from '../../src/config/constants';

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const forgotPassword = useForgotPassword();

  const handleSubmit = async () => {
    forgotPassword.mutate(
      { identifier },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      }
    );
  };

  const errorMessage = forgotPassword.error
    ? getApiError(forgotPassword.error).message
    : null;

  const canSubmit = identifier.length > 0 && !forgotPassword.isPending;

  if (submitted) {
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

          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>

          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            If we have an account with that email or username, we&apos;ve sent a
            password reset link.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Back to Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <MainLogo />
          </View>

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email or username and we&apos;ll send you a link to reset
            your password.
          </Text>

          <FormInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="Email or Username"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
          />

          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              !canSubmit && styles.buttonDisabled,
              { opacity: pressed && canSubmit ? 0.7 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {forgotPassword.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </Pressable>
        </View>
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
    paddingHorizontal: SPACING.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#48bb78',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successIconText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
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
  button: {
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
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});
