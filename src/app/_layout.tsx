import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppearanceProvider, useAppearance } from '@/context/appearance-context';
import { syncAllReminders } from '@/notifications/reminders';

if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync().catch(() => undefined);
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <RootNavigator />
        <AnimatedSplashOverlay />
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { isDark, ready, notificationsEnabled } = useAppearance();
  useEffect(() => { if (ready && notificationsEnabled) void syncAllReminders(); }, [ready, notificationsEnabled]);
  return <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="gift-details/[id]" />
      <Stack.Screen name="orders/create" />
      <Stack.Screen name="orders/[id]" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="customers/create" />
      <Stack.Screen name="customers/[id]" />
      <Stack.Screen name="sales" />
      <Stack.Screen name="sales/create" />
      <Stack.Screen name="bundles" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="settings/backup" />
    </Stack>
  </ThemeProvider>;
}
