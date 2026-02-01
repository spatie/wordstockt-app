import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BaseModal } from './BaseModal';
import { colors } from '../../config/theme';
import { SPACING, RADIUS } from '../../config/constants';

interface MenuItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
}

/**
 * Dropdown menu modal positioned at top-right.
 * Uses BaseModal for consistent overlay behavior.
 */
export function MenuModal({ visible, onClose, items }: MenuModalProps) {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      centered={false}
      contentStyle={styles.menuContainer}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && items[index - 1]?.destructive !== item.destructive && (
            <View style={styles.divider} />
          )}
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => {
              onClose();
              item.onPress();
            }}
          >
            <Text
              style={[
                styles.menuItemText,
                item.destructive && styles.destructiveText,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        </React.Fragment>
      ))}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    left: 'auto',
    width: 'auto',
    minWidth: 200,
    maxWidth: 280,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: SPACING.xs,
  },
  destructiveText: {
    color: '#E74C3C',
  },
});
