import React, { useState } from 'react';
import {
  View,
  Pressable,
  Modal,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { colors } from '../../config/theme';
import { useUpdateAvatar, useDeleteAvatar } from '../../api/queries/useAuth';
import { pickAvatar, type AvatarSource } from '../../utils/avatarImage';
import type { User } from '../../types';

interface EditableAvatarProps {
  user: User;
  size?: number;
}

export function EditableAvatar({ user, size = 80 }: EditableAvatarProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const updateAvatar = useUpdateAvatar();
  const deleteAvatar = useDeleteAvatar();
  const isBusy = updateAvatar.isPending || deleteAvatar.isPending;

  const handlePick = async (source: AvatarSource) => {
    setMenuVisible(false);
    try {
      const image = await pickAvatar(source);
      if (!image) {
        return;
      }
      await updateAvatar.mutateAsync(image);
    } catch (error) {
      Alert.alert(
        'Could not update photo',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  const handleRemove = async () => {
    setMenuVisible(false);
    try {
      await deleteAvatar.mutateAsync();
    } catch (error) {
      Alert.alert(
        'Could not remove photo',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  return (
    <View>
      <Pressable
        onPress={() => setMenuVisible(true)}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        testID="edit-avatar-button"
      >
        <Avatar
          name={user.username}
          size={size}
          uri={user.avatar ?? undefined}
          backgroundColor={user.avatarColor ?? undefined}
        />
        <View style={styles.badge}>
          <Ionicons name="camera" size={16} color="#fff" />
        </View>
        {isBusy && (
          <View style={[styles.overlay, { borderRadius: size / 2 }]}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Profile photo</Text>
            <SheetButton
              icon="images-outline"
              label="Choose from Library"
              onPress={() => handlePick('library')}
              testID="avatar-library"
            />
            <SheetButton
              icon="camera-outline"
              label="Take Photo"
              onPress={() => handlePick('camera')}
              testID="avatar-camera"
            />
            {user.avatar && (
              <SheetButton
                icon="trash-outline"
                label="Remove Photo"
                destructive
                onPress={handleRemove}
                testID="avatar-remove"
              />
            )}
            <SheetButton
              icon="close"
              label="Cancel"
              onPress={() => setMenuVisible(false)}
              testID="avatar-cancel"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

interface SheetButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}

function SheetButton({
  icon,
  label,
  onPress,
  destructive = false,
  testID,
}: SheetButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.sheetButton,
        pressed && styles.sheetButtonPressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={destructive ? '#E74C3C' : colors.textPrimary}
      />
      <Text
        style={[
          styles.sheetButtonText,
          destructive && styles.sheetButtonTextDestructive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  sheetButtonPressed: {
    backgroundColor: colors.border,
  },
  sheetButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  sheetButtonTextDestructive: {
    color: '#E74C3C',
  },
});
