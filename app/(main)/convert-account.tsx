import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useConvertGuest } from '../../src/api/queries/useAuth';
import { useAuthStore } from '../../src/stores/authStore';
import { FormInput } from '../../src/components/form/FormInput';
import { PasswordInput } from '../../src/components/form/PasswordInput';
import { AnimatedSaveButton } from '../../src/components/ui/AnimatedSaveButton';
import { getApiError } from '../../src/api/client';
import { colors } from '../../src/config/theme';
import {
  isValidUsername,
  isValidEmail,
  isValidPassword,
  validationHints,
} from '../../src/utils/validation';

export default function ConvertAccountScreen() {
  const router = useRouter();
  const convertGuest = useConvertGuest();
  const user = useAuthStore((s) => s.user);

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const usernameValid = isValidUsername(username);
  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const canSubmit = usernameValid && emailValid && passwordValid && passwordsMatch;

  const showUsernameHint = username.length > 0 && !usernameValid;
  const showPasswordHint = password.length > 0 && !passwordValid;
  const showConfirmPasswordHint = confirmPassword.length > 0 && !passwordsMatch;

  const handleConvert = async () => {
    setError(null);

    try {
      await convertGuest.mutateAsync({
        username,
        email,
        password,
        password_confirmation: confirmPassword,
      });
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError.message);
      throw err;
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create Your Free Account</Text>
          <Text style={styles.subtitle}>
            No ads. No spam. Your data stays private.
          </Text>

          <View style={styles.inputGroup}>
            <FormInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              autoCapitalize="none"
              autoComplete="username"
              error={showUsernameHint ? validationHints.username : undefined}
            />
          </View>

          <View style={styles.inputGroup}>
            <FormInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              autoComplete="new-password"
              error={showPasswordHint ? validationHints.password : undefined}
            />
          </View>

          <View style={styles.inputGroup}>
            <PasswordInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password"
              autoComplete="new-password"
              error={showConfirmPasswordHint ? validationHints.passwordMismatch : undefined}
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <AnimatedSaveButton
            onPress={handleConvert}
            onSuccess={() => router.back()}
            label="Create Account"
            successLabel="Account created!"
            disabled={!canSubmit}
          />

          <Text style={styles.footerText}>
            Your games will be saved to your new account
          </Text>
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
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});
