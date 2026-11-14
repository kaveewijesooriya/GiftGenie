import { Ionicons } from '@expo/vector-icons';
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
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#8055D8',
      tabBarInactiveTintColor: inactive,
      tabBarStyle: {
        backgroundColor: palette.background,
        borderTopColor: isDark ? '#34244A' : '#E8E1F0',
        height: 58 + insets.bottom,
        paddingTop: 5,
        paddingBottom: Math.max(insets.bottom, 6),
        elevation: 8,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home', tabBarIcon: ({ size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={focused ? '#8055D8' : inactive} /> }} />
      <Tabs.Screen name="inventory" options={{ title: 'Inventory', tabBarLabel: 'Inventory', tabBarIcon: ({ size, focused }) => <Ionicons name={focused ? 'cube' : 'cube-outline'} size={size} color={focused ? '#8055D8' : inactive} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarLabel: 'Orders', tabBarIcon: ({ size, focused }) => <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={focused ? '#8055D8' : inactive} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile', tabBarIcon: ({ size, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={focused ? '#8055D8' : inactive} /> }} />
    </Tabs>
  );
}
