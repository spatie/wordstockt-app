import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useDeleteAccount } from '../../src/api/queries/useAuth';
import { Button } from '../../src/components/ui/Button';
import { showConfirm } from '../../src/utils/alerts';
import { getApiError } from '../../src/api/client';
import { colors } from '../../src/config/theme';

export default function DeleteAccountScreen() {
  const deleteAccount = useDeleteAccount();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    showConfirm(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      async () => {
        setError(null);
        try {
          await deleteAccount.mutateAsync();
        } catch (err) {
          const apiError = getApiError(err);
          setError(apiError.message);
        }
      },
      'Delete',
      'destructive'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Delete Account</Text>
        <Text style={styles.subtitle}>
          We're sorry to see you go. Please read the following information
          before deleting your account.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What will be deleted</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              • Your profile and email address
            </Text>
            <Text style={styles.listItem}>
              • All your game history and statistics
            </Text>
            <Text style={styles.listItem}>
              • Your friends list and pending invitations
            </Text>
            <Text style={styles.listItem}>• Any active or completed games</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This action is permanent</Text>
          <Text style={styles.paragraph}>
            Once your account is deleted, all your data will be permanently
            removed and cannot be recovered.
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          label="Delete My Account"
          onPress={handleDelete}
          color="#DC2626"
          loading={deleteAccount.isPending}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
  listItem: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  paragraph: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
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
});
