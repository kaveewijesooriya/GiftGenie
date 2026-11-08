
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8055D8',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.backgroundElement,
          height: 58 + insets.bottom,
          paddingTop: 5,
          paddingBottom: Math.max(insets.bottom, 6),
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={focused ? '#8055D8' : '#8E8E93'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Gift Ideas',
          tabBarLabel: 'Gift Ideas',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name={focused ? 'gift' : 'gift-outline'}
              size={size}
              color={focused ? '#8055D8' : '#8E8E93'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="find"
        options={{
          title: 'Find Gifts',
          tabBarLabel: 'Find',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="search-outline"
              size={size}
              color={focused ? '#8055D8' : '#8E8E93'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarLabel: 'Cart',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name={focused ? 'cart' : 'cart-outline'}
              size={size}
              color={focused ? '#8055D8' : '#8E8E93'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarLabel: 'Wishlist',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={size}
              color={focused ? '#8055D8' : '#8E8E93'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarLabel: 'Planner',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={focused ? '#8055D8' : '#8E8E93'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
