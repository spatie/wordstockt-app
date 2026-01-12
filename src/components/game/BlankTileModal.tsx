import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseModal } from '../ui/BaseModal';
import { colors } from '../../config/theme';
import { SPACING, RADIUS } from '../../config/constants';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LETTERS_PER_ROW = 7;

interface BlankTileModalProps {
  visible: boolean;
  onSelectLetter: (letter: string) => void;
  onDismiss: () => void;
}

export function BlankTileModal({
  visible,
  onSelectLetter,
  onDismiss,
}: BlankTileModalProps) {
  // Split alphabet into rows
  const rows: string[][] = [];
  for (let i = 0; i < ALPHABET.length; i += LETTERS_PER_ROW) {
    rows.push(ALPHABET.slice(i, i + LETTERS_PER_ROW));
  }

  return (
    <BaseModal
      visible={visible}
      onClose={onDismiss}
      overlayOpacity={0.7}
      backdropBlur
      contentStyle={styles.modal}
    >
      <Text style={styles.title}>Choose a letter</Text>
      <Text style={styles.subtitle}>Select a letter for your blank tile</Text>
      <View style={styles.letterGrid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((letter) => (
              <TouchableOpacity
                key={letter}
                style={styles.letterButton}
                onPress={() => onSelectLetter(letter)}
                activeOpacity={0.7}
              >
                <Text style={styles.letterText}>{letter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  letterGrid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  letterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#E8E4DC',
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  letterText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
