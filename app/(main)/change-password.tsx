import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChangePassword } from '../../src/api/queries/useAuth';
import { PasswordInput } from '../../src/components/form/PasswordInput';
import { useSnackbar } from '../../src/components/ui/SnackbarProvider';
import { getApiError } from '../../src/api/client';
import { colors } from '../../src/config/theme';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const changePassword = useChangePassword();
  const { showSnackbar } = useSnackbar();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isCurrentPasswordValid = currentPassword.length >= 1;
  const isNewPasswordValid = newPassword.length >= 8;
  const doPasswordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;
  const isNewPasswordDifferent = newPassword !== currentPassword;

  const canSubmit =
    isCurrentPasswordValid &&
    isNewPasswordValid &&
    doPasswordsMatch &&
    isNewPasswordDifferent &&
    !changePassword.isPending;

  const showNewPasswordHint = newPassword.length > 0 && !isNewPasswordValid;
  const showConfirmPasswordHint =
    confirmPassword.length > 0 && !doPasswordsMatch;
  const showSamePasswordHint =
    newPassword.length >= 8 &&
    currentPassword.length > 0 &&
    !isNewPasswordDifferent;

  const handleChangePassword = async () => {
    setError(null);

    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      showSnackbar('Password changed successfully', 'success');
      router.back();
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError.message);
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
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>
            Enter your current password and choose a new one.
          </Text>

          <View style={styles.inputGroup}>
            <PasswordInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current Password"
              autoComplete="password"
            />
          </View>

          <View style={styles.inputGroup}>
            <PasswordInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New Password"
              autoComplete="new-password"
              error={
                showNewPasswordHint
                  ? 'At least 8 characters'
                  : showSamePasswordHint
                    ? 'Must be different from current password'
                    : undefined
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <PasswordInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm New Password"
              autoComplete="new-password"
              error={
                showConfirmPasswordHint ? 'Passwords do not match' : undefined
              }
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={!canSubmit}
          >
            {changePassword.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Change Password</Text>
            )}
          </TouchableOpacity>
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
