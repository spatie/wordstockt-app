import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { MenuView } from '@react-native-menu/menu';
import { useRouter } from 'expo-router';
import { useLogout } from '../../api/queries/useAuth';
import { showConfirm } from '../../utils/alerts';
import { colors } from '../../config/theme';
import { DIMENSIONS } from '../../config/constants';
import { ROUTES } from '../../config/routes';

export function HeaderMenu() {
  const router = useRouter();
  const logout = useLogout();

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
      case 'change-password':
        router.push(ROUTES.CHANGE_PASSWORD);
        break;
      case 'rules':
        router.push(ROUTES.RULES);
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

  return (
    <MenuView
      onPressAction={({ nativeEvent }) => handleMenuAction(nativeEvent.event)}
      actions={[
        {
          id: 'social-section',
          title: '',
          displayInline: true,
          subactions: [
            {
              id: 'leaderboard',
              title: 'Leaderboard',
              image: 'trophy',
            },
            {
              id: 'friends',
              title: 'Friends',
              image: 'person.2',
            },
          ],
        },
        {
          id: 'info-section',
          title: '',
          displayInline: true,
          subactions: [
            {
              id: 'rules',
              title: 'Rules',
              image: 'book',
            },
          ],
        },
        {
          id: 'account-section',
          title: '',
          displayInline: true,
          subactions: [
            {
              id: 'profile',
              title: 'Profile',
              image: 'person.circle',
            },
            {
              id: 'change-password',
              title: 'Change Password',
              image: 'key',
            },
          ],
        },
        {
          id: 'logout',
          title: 'Logout',
          attributes: {
            destructive: true,
          },
          image: 'rectangle.portrait.and.arrow.right',
        },
      ]}
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
