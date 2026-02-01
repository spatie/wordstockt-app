import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../config/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  showOnlineIndicator?: boolean;
  backgroundColor?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1] && parts[0][0] && parts[1][0]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColorFromName(name: string): string {
  const avatarColors = [
    '#4A90D9', // Blue
    '#9B59B6', // Purple
    '#27AE60', // Green
    '#E67E22', // Orange
    '#E74C3C', // Red
    '#1ABC9C', // Teal
    '#F39C12', // Yellow
    '#8E44AD', // Deep purple
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return avatarColors[Math.abs(hash) % avatarColors.length]!;
}

export function Avatar({
  uri,
  name = '?',
  size = 48,
  showOnlineIndicator = false,
  backgroundColor,
}: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = backgroundColor || getColorFromName(name);

  // Memoize all size-dependent styles to prevent re-renders in lists
  const sizeStyles = useMemo(
    () => ({
      container: { width: size, height: size },
      image: { width: size, height: size, borderRadius: size / 2 },
      initialsContainer: {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
      },
      initialsText: { fontSize: size * 0.4 },
      indicator: {
        width: size * 0.25,
        height: size * 0.25,
        borderRadius: (size * 0.25) / 2,
        bottom: size * 0.02,
        right: size * 0.02,
        borderWidth: size * 0.25 * 0.2,
      },
    }),
    [size, bgColor]
  );

  // Memoize image source separately (depends only on uri)
  // Convert null to undefined since ImageSource expects string | undefined
  const imageSource = useMemo(() => ({ uri: uri ?? undefined }), [uri]);

  return (
    <View style={[styles.container, sizeStyles.container]}>
      {uri ? (
        <Image
          source={imageSource}
          style={[styles.image, sizeStyles.image]}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.initialsContainer, sizeStyles.initialsContainer]}>
          <Text style={[styles.initials, sizeStyles.initialsText]}>
            {initials}
          </Text>
        </View>
      )}
      {showOnlineIndicator && (
        <View style={[styles.onlineIndicator, sizeStyles.indicator]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {},
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
    borderColor: colors.background,
  },
});
