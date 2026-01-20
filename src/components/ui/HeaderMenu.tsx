import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { MenuView, MenuAction } from '@react-native-menu/menu';
import { useRouter, Href } from 'expo-router';
import { useLogout } from '../../api/queries/useAuth';
import { useAuthStore } from '../../stores/authStore';
import { showConfirm } from '../../utils/alerts';
import { colors } from '../../config/theme';
import { DIMENSIONS } from '../../config/constants';
import { ROUTES } from '../../config/routes';

export function HeaderMenu() {
  const router = useRouter();
  const logout = useLogout();
  const isGuest = useAuthStore((s) => s.isGuest);

  const handleMenuAction = (actionId: string) => {
    switch (actionId) {
      case 'profile':
        router.push(ROUTES.PROFILE);
        break;
      case 'leaderboard':
        router.push(ROUTES.LEADERBOARD);
        break;
      case 'friends':
        router.push(ROUTES.FRIENDS);
        break;
      case 'achievements':
        router.push(ROUTES.ACHIEVEMENTS as Href);
        break;
      case 'change-password':
        router.push(ROUTES.CHANGE_PASSWORD);
        break;
      case 'create-account':
        router.push(ROUTES.CONVERT_ACCOUNT);
        break;
      case 'rules':
        router.push(ROUTES.RULES);
        break;
      case 'about':
        router.push(ROUTES.ABOUT);
        break;
      case 'logout':
        showConfirm(
          'Logout',
          'Are you sure you want to logout?',
          () => logout.mutate(),
          'Logout',
          'destructive'
        );
        break;
    }
  };

  const isIOS = Platform.OS === 'ios';

  const menuItems = {
    leaderboard: { id: 'leaderboard', title: 'Leaderboard', image: 'trophy' },
    achievements: { id: 'achievements', title: 'Achievements', image: 'star' },
    friends: { id: 'friends', title: 'Friends', image: 'person.2' },
    profile: { id: 'profile', title: 'Profile', image: 'person.circle' },
    changePassword: {
      id: 'change-password',
      title: 'Change Password',
      image: 'key',
    },
    createAccount: {
      id: 'create-account',
      title: 'Create Free Account',
      image: 'person.badge.plus',
    },
    rules: { id: 'rules', title: 'Rules', image: 'book' },
    about: { id: 'about', title: 'About', image: 'info.circle' },
  };

  const section = (
    id: string,
    androidTitle: string,
    items: MenuAction[]
  ): MenuAction => ({
    id,
    title: isIOS ? '' : androidTitle,
    displayInline: true,
    subactions: items.map((item) =>
      isIOS ? item : { id: item.id, title: item.title }
    ),
  });

  const socialItems = isGuest
    ? []
    : [menuItems.leaderboard, menuItems.achievements, menuItems.friends];

  const accountItems = isGuest
    ? [menuItems.profile, menuItems.createAccount]
    : [menuItems.profile, menuItems.changePassword];

  const actions: MenuAction[] = [
    ...(socialItems.length > 0
      ? [section('social-section', 'Social', socialItems)]
      : []),
    section('account-section', 'Account', accountItems),
    section('info-section', 'Help', [menuItems.rules, menuItems.about]),
    {
      id: 'logout',
      title: 'Logout',
      attributes: { destructive: true },
      ...(isIOS && { image: 'rectangle.portrait.and.arrow.right' }),
    },
  ];

  return (
    <MenuView
      onPressAction={({ nativeEvent }) => handleMenuAction(nativeEvent.event)}
      actions={actions}
      shouldOpenOnLongPress={false}
      style={styles.iconButton}
    >
      <Text style={styles.iconText}>☰</Text>
    </MenuView>
  );
}

const styles = StyleSheet.create({
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
