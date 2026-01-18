import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SegmentedButtons, Switch, IconButton } from 'react-native-paper';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

interface BoardOptionProps {
  selected: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}

function BoardOption({
  selected,
  icon,
  label,
  description,
  onPress,
}: BoardOptionProps) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, progress]);

  const selectedOverlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.1,
  }));

  const radioInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: progress.value,
  }));

  return (
    <Pressable
      style={styles.boardOption}
      onPress={onPress}
      android_ripple={null}
    >
      <Animated.View
        style={[styles.boardOptionSelectedOverlay, selectedOverlayStyle]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.boardOptionIcon,
          selected && styles.boardOptionIconSelected,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={selected ? colors.primary : colors.textSecondary}
        />
      </View>
      <View style={styles.boardOptionText}>
        <Text
          style={[
            styles.boardOptionLabel,
            selected && styles.boardOptionLabelSelected,
          ]}
        >
          {label}
        </Text>
        <Text style={styles.boardOptionDescription}>{description}</Text>
      </View>
      <View style={styles.boardOptionRadio}>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          <Animated.View style={[styles.radioInner, radioInnerStyle]} />
        </View>
      </View>
    </Pressable>
  );
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
      <View style={styles.boardOptions}>
        <BoardOption
          selected={boardType === 'standard'}
          icon="grid"
          label="Standard"
          description="Classic bonus squares"
          onPress={() => handleBoardTypeChange('standard')}
        />
        <BoardOption
          selected={boardType === 'no_bonuses'}
          icon="grid-off"
          label="No Bonuses"
          description="Plain board, no multipliers"
          onPress={() => handleBoardTypeChange('no_bonuses')}
        />
        <BoardOption
          selected={boardType === 'custom'}
          icon="pencil-ruler"
          label="Custom"
          description="Design your own layout"
          onPress={() => handleBoardTypeChange('custom')}
        />
      </View>

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
  boardOptions: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  boardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  boardOptionSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
  },
  boardOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    backgroundColor: colors.background,
  },
  boardOptionIconSelected: {
    backgroundColor: `${colors.primary}20`,
  },
  boardOptionText: {
    flex: 1,
  },
  boardOptionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  boardOptionLabelSelected: {
    color: colors.primary,
  },
  boardOptionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  boardOptionRadio: {
    marginLeft: SPACING.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
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
