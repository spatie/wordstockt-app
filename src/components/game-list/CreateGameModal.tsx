import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { BaseModal } from '../ui/BaseModal';
import { Button } from '../ui/Button';
import { BoardMaker } from './BoardMaker';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { colors } from '../../config/theme';
import { SPACING } from '../../config/constants';
import type { SquareType } from '../../types/game';

type Language = 'nl' | 'en';
type BoardType = 'standard' | 'no_bonuses' | 'custom';

export interface CreateGameParams {
  language: Language;
  board_type: BoardType;
  board_template?: SquareType[][];
}

interface CreateGameModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (params: CreateGameParams) => void;
  isPending: boolean;
}

export function CreateGameModal({
  visible,
  onClose,
  onConfirm,
  isPending,
}: CreateGameModalProps) {
  const preferredLanguage = usePreferencesStore((s) => s.preferredLanguage);
  const setPreferredLanguage = usePreferencesStore(
    (s) => s.setPreferredLanguage
  );

  const [language, setLanguage] = useState<Language>(preferredLanguage);
  const [boardType, setBoardType] = useState<BoardType>('standard');
  const [showBoardMaker, setShowBoardMaker] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<SquareType[][] | null>(
    null
  );

  // Sync language with preference when modal opens
  useEffect(() => {
    if (visible) {
      setLanguage(preferredLanguage);
    }
  }, [visible, preferredLanguage]);

  const handleLanguageChange = (value: string) => {
    const lang = value as Language;
    setLanguage(lang);
    setPreferredLanguage(lang);
  };

  const handleBoardTypeChange = (value: string) => {
    const type = value as BoardType;
    setBoardType(type);
    if (type === 'custom' && !customTemplate) {
      setShowBoardMaker(true);
    }
  };

  const handleBoardMakerAccept = (template: SquareType[][]) => {
    setCustomTemplate(template);
    setShowBoardMaker(false);
  };

  const handleBoardMakerCancel = () => {
    if (!customTemplate) {
      setBoardType('standard');
    }
    setShowBoardMaker(false);
  };

  const handleConfirm = () => {
    onConfirm({
      language,
      board_type: boardType,
      board_template:
        boardType === 'custom' ? (customTemplate ?? undefined) : undefined,
    });
  };

  const handleClose = () => {
    setLanguage(preferredLanguage);
    setBoardType('standard');
    setShowBoardMaker(false);
    setCustomTemplate(null);
    onClose();
  };

  if (showBoardMaker) {
    return (
      <BaseModal
        visible={visible}
        onClose={handleBoardMakerCancel}
        backdropBlur
      >
        <BoardMaker
          onAccept={handleBoardMakerAccept}
          onCancel={handleBoardMakerCancel}
        />
      </BaseModal>
    );
  }

  const isCreateDisabled = boardType === 'custom' && !customTemplate;

  return (
    <BaseModal visible={visible} onClose={handleClose} backdropBlur>
      <Text style={styles.title}>New Game</Text>

      <Text style={styles.label}>Language</Text>
      <SegmentedButtons
        value={language}
        onValueChange={handleLanguageChange}
        buttons={[
          { value: 'en', label: 'English' },
          { value: 'nl', label: 'Dutch' },
        ]}
        style={styles.segmentedButtons}
      />

      <Text style={styles.label}>Board</Text>
      <SegmentedButtons
        value={boardType}
        onValueChange={handleBoardTypeChange}
        buttons={[
          { value: 'standard', label: 'Standard' },
          { value: 'no_bonuses', label: 'No Bonus' },
          { value: 'custom', label: 'Custom' },
        ]}
        style={styles.segmentedButtons}
      />

      {boardType === 'custom' && customTemplate && (
        <View style={styles.customBoardRow}>
          <Text style={styles.customBoardText}>Custom board configured</Text>
          <Button
            label="Edit"
            onPress={() => setShowBoardMaker(true)}
            variant="secondary"
            size="sm"
          />
        </View>
      )}

      <Button
        label="Create Game"
        onPress={handleConfirm}
        loading={isPending}
        fullWidth
        rounded
        disabled={isCreateDisabled}
      />
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: SPACING.xxl,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: SPACING.sm,
  },
  segmentedButtons: {
    marginBottom: SPACING.xxl,
  },
  customBoardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.sm,
  },
  customBoardText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
