import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '@/config/theme';
import { HeaderLogo } from '../../src/components/ui/HeaderLogo';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen
        name="register"
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.textPrimary,
          animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerTitle: () => <HeaderLogo />,
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.textPrimary,
          animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerTitle: () => <HeaderLogo />,
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="verify-email"
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.textPrimary,
          headerTitle: () => <HeaderLogo />,
          headerBackVisible: false,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
