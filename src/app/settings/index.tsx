import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppearance, type AppearanceChoice } from '@/context/appearance-context';
import { cancelAllGiftGenieReminders, requestLocalNotificationPermission, syncAllReminders } from '@/notifications/reminders';

const currencies = ['LKR', 'USD', 'EUR', 'GBP', 'INR', 'AUD'];
const appearance: { id: AppearanceChoice; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'light', label: 'Light Mode', icon: 'sunny-outline' },
  { id: 'dark', label: 'Dark Mode', icon: 'moon-outline' },
  { id: 'system', label: 'System Default', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const router = useRouter(); const system = useColorScheme(); const { choice, setChoice, isDark, currency, setCurrency, notificationsEnabled, setNotificationsEnabled } = useAppearance();
  const theme = Colors[isDark ? 'dark' : 'light']; const card = isDark ? '#252238' : '#FFFFFF'; const border = isDark ? '#393044' : '#EEE8F6';
  async function setNotifications(enabled: boolean) {
    if (enabled) {
      if (!(await requestLocalNotificationPermission())) { Alert.alert('Notifications not enabled', 'Allow notifications in your device settings to receive stock and due-date reminders.'); return; }
      await setNotificationsEnabled(true); await syncAllReminders();
    } else { await setNotificationsEnabled(false); await cancelAllGiftGenieReminders(); }
  }
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={theme.text} /></Pressable><Text style={[styles.title, { color: theme.text }]}>App Settings</Text><View style={{ width: 22 }} /></View>
    <Text style={styles.sectionLabel}>APPEARANCE</Text><View style={[styles.panel, { backgroundColor: card, borderColor: border }]}>{appearance.map((item, index) => <Pressable key={item.id} onPress={() => void setChoice(item.id)} style={[styles.option, index < appearance.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }]}><View style={[styles.optionIcon, { backgroundColor: '#F0E8FF' }]}><Ionicons name={item.icon} size={17} color="#8055D8" /></View><Text style={[styles.optionText, { color: theme.text }]}>{item.label}</Text>{choice === item.id ? <Ionicons name="checkmark-circle" size={21} color="#8055D8" /> : null}</Pressable>)}</View>
    <Text style={styles.sectionLabel}>CURRENCY</Text><View style={[styles.panel, styles.currencyPanel, { backgroundColor: card, borderColor: border }]}>{currencies.map((code) => <Pressable key={code} onPress={() => void setCurrency(code)} style={[styles.currencyChip, { borderColor: currency === code ? '#8055D8' : border, backgroundColor: currency === code ? '#F0E8FF' : 'transparent' }]}><Text style={{ color: currency === code ? '#6536BF' : theme.text, fontWeight: '800', fontSize: 12 }}>{code}</Text></Pressable>)}</View>
    <Text style={styles.sectionLabel}>NOTIFICATIONS</Text><View style={[styles.option, styles.panel, { backgroundColor: card, borderColor: border }]}><View style={[styles.optionIcon, { backgroundColor: '#FFF3E7' }]}><Ionicons name="notifications-outline" size={18} color="#CF7B2E" /></View><View style={{ flex: 1 }}><Text style={[styles.optionText, { color: theme.text }]}>Local reminders</Text><Text style={styles.hint}>Low stock and order due dates</Text></View><Switch value={notificationsEnabled} onValueChange={(value) => void setNotifications(value)} trackColor={{ true: '#8055D8' }} /></View>
    <Text style={styles.sectionLabel}>DATA MANAGEMENT</Text><Pressable onPress={() => router.push('/settings/backup')} style={[styles.option, styles.panel, { backgroundColor: card, borderColor: border }]}><View style={[styles.optionIcon, { backgroundColor: '#E8F5EF' }]}><Ionicons name="cloud-download-outline" size={18} color="#3C9474" /></View><View style={{ flex: 1 }}><Text style={[styles.optionText, { color: theme.text }]}>Backup & Restore</Text><Text style={styles.hint}>Export or restore a local JSON backup</Text></View><Ionicons name="chevron-forward" size={18} color={theme.textSecondary} /></Pressable>
    <Text style={styles.sectionLabel}>ABOUT</Text><View style={[styles.about, { backgroundColor: card, borderColor: border }]}><Text style={[styles.optionText, { color: theme.text }]}>GiftGenie · Offline Seller Edition</Text><Text style={styles.hint}>All shop data is stored locally on this device.</Text><Text style={styles.hint}>Appearance follows {choice === 'system' ? (system === 'dark' ? 'dark' : 'light') : choice} settings.</Text></View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 19, paddingBottom: 35 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }, title: { fontSize: 20, fontWeight: '800' }, sectionLabel: { color: '#8D819B', fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 8, marginTop: 18 }, panel: { borderRadius: 15, borderWidth: 1, overflow: 'hidden' }, option: { minHeight: 58, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, optionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, optionText: { fontSize: 13, fontWeight: '800' }, currencyPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }, currencyChip: { borderWidth: 1, minWidth: 62, alignItems: 'center', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 9 }, hint: { color: '#978E9F', fontSize: 10, marginTop: 4 }, about: { borderRadius: 15, borderWidth: 1, padding: 15 } });
