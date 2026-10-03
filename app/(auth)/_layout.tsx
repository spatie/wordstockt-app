import { Stack } from 'expo-router';
import { HeaderLogo } from '../../src/components/ui/HeaderLogo';
import { useThemeColors } from '../../src/hooks/useThemeColors';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function AuthLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerTitle: () => <HeaderLogo />,
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        animation: 'default',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Log in' }} />
      <Stack.Screen
        name="register"
        options={{ title: 'Create account', headerShown: true }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{ title: 'Reset password', headerShown: true }}
      />
    </Stack>
  );
}
