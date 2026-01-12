import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import { useLogout } from '../../api/queries/useAuth';
import { useNavigationStore } from '../../stores/navigationStore';
import { AnimatedLogoTile } from './AnimatedLogoTile';
import { BackButton } from './BackButton';
import { MenuModal } from './MenuModal';
import { showConfirm } from '../../utils/alerts';
import { colors } from '../../config/theme';
import { SPACING, DIMENSIONS } from '../../config/constants';
import { ROUTES } from '../../config/routes';

interface AppHeaderProps {
  showBack?: boolean;
  backTo?: string;
  showMenu?: boolean;
}

export function AppHeader({
  showBack,
  backTo,
  showMenu = true,
}: AppHeaderProps) {
  const router = useRouter();
  const logout = useLogout();
  const clearLastGameUlid = useNavigationStore((s) => s.clearLastGameUlid);
  const [menuVisible, setMenuVisible] = useState(false);
  const logoAnimationTrigger = useSharedValue(0);

  const handleLogoPress = useCallback(() => {
    // Toggle the trigger to restart animation
    logoAnimationTrigger.value = logoAnimationTrigger.value === 0 ? 1 : 0;
    // Reset after animation completes
    setTimeout(() => {
      logoAnimationTrigger.value = 0;
    }, 600);
  }, [logoAnimationTrigger]);

  const menuItems = useMemo(
    () => [
      {
        label: 'Profile',
        onPress: () => router.push(ROUTES.PROFILE),
      },
      {
        label: 'Friends',
        onPress: () => router.push(ROUTES.FRIENDS),
      },
      {
        label: 'Change Password',
        onPress: () => router.push(ROUTES.CHANGE_PASSWORD),
      },
      {
        label: 'Rules',
        onPress: () => router.push(ROUTES.RULES),
      },
      {
        label: 'Logout',
        onPress: () =>
          showConfirm(
            'Logout',
            'Are you sure you want to logout?',
            () => logout.mutate(),
            'Logout',
            'destructive'
          ),
        destructive: true,
      },
    ],
    [router, logout]
  );

  return (
    <View style={styles.header}>
      {/* Left: Back button (only shown when showBack is true) */}
      <View style={styles.headerSide}>
        {showBack && <BackButton backTo={backTo} onBack={clearLastGameUlid} />}
      </View>

      {/* Center: WordStockt logo (tappable for fun animation) */}
      <TouchableOpacity
        style={styles.headerCenter}
        onPress={handleLogoPress}
        activeOpacity={0.8}
      >
        <AnimatedLogoTile
          letter="W"
          size="small"
          animationTrigger={logoAnimationTrigger}
          delay={0}
        />
        <AnimatedLogoTile
          letter="S"
          size="small"
          animationTrigger={logoAnimationTrigger}
          delay={50}
        />
        <Text style={styles.headerTitle}>WordStockt</Text>
      </TouchableOpacity>

      {/* Right: Hamburger menu (only shown when showMenu is true) */}
      <View style={styles.headerSide}>
        {showMenu && (
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.iconButton}
          >
            <Text style={styles.iconText}>☰</Text>
          </TouchableOpacity>
        )}
      </View>

      {showMenu && (
        <MenuModal
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          items={menuItems}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: colors.background,
  },
  headerSide: {
    width: DIMENSIONS.iconButton,
    height: DIMENSIONS.iconButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: SPACING.sm,
  },
  iconButton: {
    width: DIMENSIONS.iconButton,
    height: DIMENSIONS.iconButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
    color: colors.textPrimary,
  },
});
