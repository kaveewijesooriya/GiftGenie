import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppearance } from '@/context/appearance-context';

export default function AppTabs() {
  const { isDark } = useAppearance();
  const palette = Colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const inactive = isDark ? '#A49BAF' : '#8E8797';
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#8055D8', tabBarInactiveTintColor: inactive,
      tabBarStyle: { backgroundColor: palette.background, borderTopColor: isDark ? '#34244A' : '#E8E1F0', height: 58 + insets.bottom, paddingTop: 5, paddingBottom: Math.max(insets.bottom, 6), elevation: 8 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 } }}>
      {/* Avoid web font glyphs in the server-rendered tab bar. They load after hydration and
          produce a class mismatch in React Native Web. Native keeps its icon labels. */}
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home', tabBarIcon: () => null }} />
      <Tabs.Screen name="inventory" options={{ title: 'Inventory', tabBarLabel: 'Inventory', tabBarIcon: () => null }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarLabel: 'Orders', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile', tabBarIcon: () => null }} />
    </Tabs>
  );
}
