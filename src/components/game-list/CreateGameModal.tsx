import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SegmentedButtons, Switch, IconButton } from 'react-native-paper';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BaseModal } from '../ui/BaseModal';
import { Button } from '../ui/Button';
import { BoardMaker } from './BoardMaker';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { colors } from '../../config/theme';
import { SPACING, RADIUS } from '../../config/constants';
import type { SquareType } from '../../types/game';

type Language = 'nl' | 'en';
type BoardType = 'standard' | 'no_bonuses' | 'custom';

export interface CreateGameParams {
  language: Language;
  board_type: BoardType;
  board_template?: SquareType[][];
  is_public?: boolean;
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
  const [isPublic, setIsPublic] = useState(false);
  const [showPublicInfo, setShowPublicInfo] = useState(false);

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
    setBoardType(value as BoardType);
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
      is_public: isPublic,
    });
  };

  const handleClose = () => {
    setLanguage(preferredLanguage);
    setBoardType('standard');
    setShowBoardMaker(false);
    setCustomTemplate(null);
    setIsPublic(false);
    setShowPublicInfo(false);
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
      <Text style={styles.title}>Start new game</Text>

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

      {boardType === 'custom' && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(100)}
          style={styles.customBoardRow}
        >
          <Text style={styles.customBoardText}>
            {customTemplate ? 'Custom board configured' : 'No board configured'}
          </Text>
          <Button
            label={customTemplate ? 'Edit' : 'Configure'}
            onPress={() => setShowBoardMaker(true)}
            variant="secondary"
            size="sm"
          />
        </Animated.View>
      )}

      <View style={styles.switchRow}>
        <Pressable
          style={styles.switchLabelRow}
          onPress={() => setIsPublic(!isPublic)}
        >
          <Text style={styles.switchLabel}>Public Game</Text>
          <IconButton
            icon="help-circle-outline"
            size={18}
            iconColor={colors.textSecondary}
            onPress={() => setShowPublicInfo(!showPublicInfo)}
            style={styles.infoIcon}
          />
        </Pressable>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          color={colors.primary}
        />
      </View>

      {showPublicInfo && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(100)}
          style={styles.infoBox}
        >
          <Text style={styles.infoText}>
            Public games can be found and joined by any player. Create a public
            game to play with someone new!
          </Text>
        </Animated.View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          label="Create Game"
          onPress={handleConfirm}
          loading={isPending}
          fullWidth
          rounded
          disabled={isCreateDisabled}
        />
      </View>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  switchLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoIcon: {
    margin: 0,
    marginLeft: -4,
  },
  infoBox: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  buttonContainer: {
    marginTop: SPACING.xxl,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
