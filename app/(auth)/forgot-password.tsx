import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useForgotPassword } from '../../src/api/queries/useAuth';
import { getApiError } from '../../src/api/client';
import { FormInput } from '../../src/components/form/FormInput';
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
        <View style={styles.content}>
          <MainLogo />

          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>

          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            If we have an account with that email or username, we've sent a
            password reset link.
          </Text>

          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <MainLogo />

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email or username and we'll send you a link to reset your
            password.
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

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {forgotPassword.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
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
    backgroundColor: colors.primary,
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
