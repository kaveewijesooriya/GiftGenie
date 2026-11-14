import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppearance } from '@/context/appearance-context';

const links: { title: string; description: string; icon: keyof typeof Ionicons.glyphMap; color: string; route: Href }[] = [
  { title: 'Customer Management', description: 'Contacts, purchase history and notes', icon: 'people-outline', color: '#4C9C81', route: '/customers' },
  { title: 'Sales History', description: 'Recorded sales and payment totals', icon: 'cash-outline', color: '#DB8B38', route: '/sales' },
  { title: 'Gift Bundle Creator', description: 'Build bundles from your inventory', icon: 'gift-outline', color: '#D56591', route: '/bundles' },
  { title: 'Business Analytics', description: 'Sales, profit and stock performance', icon: 'bar-chart-outline', color: '#6684D8', route: '/analytics' },
  { title: 'App Settings', description: 'Appearance, currency and data management', icon: 'settings-outline', color: '#8055D8', route: '/settings' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark } = useAppearance();
  const theme = Colors[isDark ? 'dark' : 'light'];
  const card = isDark ? '#252238' : '#FFFFFF';
  const border = isDark ? '#393044' : '#EEE8F6';
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>YOUR SHOP</Text><Text style={[styles.title, { color: theme.text }]}>Profile</Text>
    <View style={[styles.brandCard, { backgroundColor: '#5B2AB8' }]}><View style={styles.brandIcon}><Ionicons name="gift" size={25} color="white" /></View><View style={{ flex: 1 }}><Text style={styles.brandTitle}>GiftGenie</Text><Text style={styles.brandSubtitle}>Offline Gift Shop Manager</Text></View><Ionicons name="sparkles" size={24} color="#FFFFFF99" /></View>
    <Text style={[styles.section, { color: theme.text }]}>Manage your business</Text>
    {links.map((item) => <Pressable key={String(item.route)} onPress={() => router.push(item.route)} style={[styles.menuItem, { backgroundColor: card, borderColor: border }]}><View style={[styles.iconWrap, { backgroundColor: `${item.color}18` }]}><Ionicons name={item.icon} size={21} color={item.color} /></View><View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text><Text style={[styles.itemDescription, { color: theme.textSecondary }]}>{item.description}</Text></View><Ionicons name="chevron-forward" size={18} color={theme.textSecondary} /></Pressable>)}
    <View style={styles.footer}><Text style={[styles.footerText, { color: theme.textSecondary }]}>Your business records stay on this device.</Text><Text style={[styles.footerText, { color: theme.textSecondary }]}>GiftGenie · Offline Seller Edition</Text></View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 20, paddingBottom: 34 }, kicker: { color: '#8055D8', fontWeight: '800', fontSize: 10, letterSpacing: 1.3 }, title: { fontSize: 29, fontWeight: '800', marginTop: 5, marginBottom: 17 }, brandCard: { borderRadius: 19, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, brandIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#FFFFFF28', alignItems: 'center', justifyContent: 'center' }, brandTitle: { color: 'white', fontWeight: '800', fontSize: 18 }, brandSubtitle: { color: '#E9DFFF', fontSize: 11, marginTop: 4 }, section: { fontSize: 16, fontWeight: '800', marginTop: 25, marginBottom: 11 }, menuItem: { minHeight: 72, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 9 }, iconWrap: { width: 41, height: 41, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, itemTitle: { fontSize: 13, fontWeight: '800' }, itemDescription: { fontSize: 10, marginTop: 4 }, footer: { alignItems: 'center', marginTop: 24, gap: 5 }, footerText: { fontSize: 10 } });
