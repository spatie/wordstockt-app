import React from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '../../src/config/theme';
import { useUserWebSocket } from '../../src/hooks/useUserWebSocket';
import { useInvitationStore } from '../../src/stores/invitationStore';
import { HeaderLogo } from '../../src/components/ui/HeaderLogo';
import { HeaderMenu } from '../../src/components/ui/HeaderMenu';
import { InvitationDialog } from '../../src/components/game/InvitationDialog';

export default function MainLayout() {
  // Subscribe to user channel for real-time updates (invitations, etc.)
  useUserWebSocket();

  const pendingInvitation = useInvitationStore((s) => s.pendingInvitation);
  const clearPendingInvitation = useInvitationStore(
    (s) => s.clearPendingInvitation
  );

  return (
    <>
      <InvitationDialog
        invitation={pendingInvitation}
        onClose={clearPendingInvitation}
      />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.textPrimary,
          contentStyle: {
            backgroundColor: colors.background,
          },
          // Use platform-appropriate animations
          animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          // Native header configuration
          headerTitle: () => <HeaderLogo />,
          headerRight: () => <HeaderMenu />,
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerBackVisible: false,
          }}
        />
        <Stack.Screen name="game/[id]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="rules" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="invite/[code]" />
      </Stack>
    </>
  );
}
