import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseModal } from '../ui/BaseModal';
import { Button } from '../ui/Button';
import { colors } from '../../config/theme';
import { SPACING } from '../../config/constants';

interface StatusItem {
  color: string;
  title: string;
  description: string;
}

interface StatusInfoModalProps {
  visible: boolean;
  onClose: () => void;
  showBlankPending: boolean;
  showFreeSwap: boolean;
}

const STATUS_INFO: Record<'blank' | 'swap', StatusItem> = {
  blank: {
    color: '#FF6B6B',
    title: 'Blank Tile Incoming',
    description:
      'Every player is guaranteed one blank tile per game, but you never know when it arrives. This dot means yours is still on the way!',
  },
  swap: {
    color: '#4A90D9',
    title: 'Free Swap Available',
    description:
      'Normally, swapping tiles ends your turn. But once per game, you can swap for free! This dot means you still have your free swap.',
  },
};

export function StatusInfoModal({
  visible,
  onClose,
  showBlankPending,
  showFreeSwap,
}: StatusInfoModalProps) {
  // Preserve content during close animation
  const [displayItems, setDisplayItems] = useState<StatusItem[]>([]);

  useEffect(() => {
    if (visible) {
      const items: StatusItem[] = [];
      if (showBlankPending) items.push(STATUS_INFO.blank);
      if (showFreeSwap) items.push(STATUS_INFO.swap);
      setDisplayItems(items);
    }
  }, [visible, showBlankPending, showFreeSwap]);

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      overlayOpacity={0.7}
      backdropBlur
      contentStyle={styles.modal}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Player Status</Text>

        <Text style={styles.subtitle}>
          These indicators show special bonuses
        </Text>

        <View style={styles.itemsContainer}>
          {displayItems.map((item, index) => (
            <View key={item.title} style={styles.statusItem}>
              <View style={styles.dotContainer}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <View
                  style={[
                    styles.dotGlow,
                    { backgroundColor: item.color, opacity: 0.3 },
                  ]}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button label="Got it" onPress={onClose} fullWidth rounded size="lg" />
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    padding: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  itemsContainer: {
    width: '100%',
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  dotContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  dotGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
