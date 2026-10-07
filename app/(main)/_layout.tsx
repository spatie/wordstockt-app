import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useInvitationStore } from '../../src/stores/invitationStore';
import { HeaderLogo } from '../../src/components/ui/HeaderLogo';
import { HeaderMenu } from '../../src/components/ui/HeaderMenu';
import { InvitationDialog } from '../../src/components/game/InvitationDialog';
import { ScreenBackground } from '../../src/components/ui/ScreenBackground';

// Screens opened from a deep link or notification always get the games list
// underneath, so back and swipe-back keep working.
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function MainLayout() {
  const colors = useThemeColors();

  const pendingInvitation = useInvitationStore((s) => s.pendingInvitation);
  const clearPendingInvitation = useInvitationStore(
    (s) => s.clearPendingInvitation
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <InvitationDialog
        invitation={pendingInvitation}
        onClose={clearPendingInvitation}
      />
      <Stack
        screenLayout={({ children }) => (
          <ScreenBackground>{children}</ScreenBackground>
        )}
        // Screens show their title in the bar; the games list and the game
        // board show the logo instead
        screenOptions={{
          headerTransparent: true,
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          headerRight: () => <HeaderMenu />,
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: 'default',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Games',
            headerTitle: () => <HeaderLogo />,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="game/[id]/index"
          options={{ title: 'Game', headerTitle: () => <HeaderLogo /> }}
        />
        <Stack.Screen
          name="game/[id]/history"
          options={{ title: 'Move history' }}
        />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
        <Stack.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
        <Stack.Screen name="friends" options={{ title: 'Friends' }} />
        <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
        <Stack.Screen name="rules" options={{ title: 'Rules' }} />
        <Stack.Screen name="about" options={{ title: 'About' }} />
        <Stack.Screen name="user/[id]" options={{ title: 'Player' }} />
        <Stack.Screen
          name="change-password"
          options={{ title: 'Change password' }}
        />
        <Stack.Screen
          name="convert-account"
          options={{ title: 'Create account' }}
        />
        <Stack.Screen
          name="delete-account"
          options={{ title: 'Delete account' }}
        />
        <Stack.Screen name="invite/[code]" options={{ title: 'Invite' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
