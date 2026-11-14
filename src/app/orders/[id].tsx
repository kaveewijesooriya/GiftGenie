import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppearance } from '@/context/appearance-context';
import { getOrderDetails, setOrderStatus } from '@/database/repository';
import { syncOrderReminders } from '@/notifications/reminders';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter(); const { isDark, currency } = useAppearance();
  const theme = Colors[isDark ? 'dark' : 'light']; const card = isDark ? '#252238' : '#FFFFFF'; const border = isDark ? '#393044' : '#EEE8F6';
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrderDetails>>>(null); const [error, setError] = useState('');
  const refresh = useCallback(() => { let active = true; getOrderDetails(id).then((value) => { if (active) setOrder(value); }).catch(() => { if (active) setError('Could not load this order.'); }); return () => { active = false; }; }, [id]);
  useFocusEffect(refresh);
  async function change(status: 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled') {
    try { await setOrderStatus(id, status); const updated = await getOrderDetails(id); if (updated) await syncOrderReminders(id, updated.order_number, updated.due_at, status === 'completed' || status === 'cancelled'); await refreshNow(); }
    catch (caught) { Alert.alert('Order not updated', caught instanceof Error ? caught.message : 'Please try again.'); }
  }
  async function refreshNow() { setOrder(await getOrderDetails(id)); }
  if (!order) return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><View style={styles.center}><Text style={{ color: theme.textSecondary }}>{error || 'Loading order…'}</Text><Pressable onPress={() => router.back()}><Text style={{ color: '#8055D8', fontWeight: '800' }}>Go back</Text></Pressable></View></SafeAreaView>;
  const terminal = order.status === 'completed' || order.status === 'cancelled';
  const next = order.status === 'pending' ? 'confirmed' : order.status === 'confirmed' ? 'preparing' : order.status === 'preparing' ? 'ready' : 'completed';
  const nextLabel: Record<string, string> = { confirmed: 'Confirm & reserve stock', preparing: 'Mark as preparing', ready: 'Mark ready for pickup', completed: 'Complete order & record sale' };
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={theme.text} /></Pressable><Text style={[styles.title, { color: theme.text }]}>Order details</Text><View style={{ width: 22 }} /></View>
    <View style={[styles.hero, { backgroundColor: card, borderColor: border }]}><Text style={styles.orderNumber}>{order.order_number}</Text><Text style={[styles.status, { color: order.status === 'completed' ? '#268554' : order.status === 'cancelled' ? '#908898' : '#8055D8' }]}>{order.status.toUpperCase()}</Text><Text style={[styles.amount, { color: theme.text }]}>{currency} {order.total.toLocaleString()}</Text><Text style={{ color: theme.textSecondary }}>{order.customer_name || 'Walk-in customer'}{order.customer_phone ? ` · ${order.customer_phone}` : ''}</Text></View>
    <View style={[styles.panel, { backgroundColor: card, borderColor: border }]}><View style={styles.panelHeader}><Text style={[styles.panelTitle, { color: theme.text }]}>Items</Text><Text style={styles.meta}>{order.priority === 'emergency' ? '⚡ Emergency' : 'Normal priority'}</Text></View>{order.items.map((item) => <View key={item.id} style={[styles.item, { borderBottomColor: border }]}><View style={{ flex: 1 }}><Text style={[styles.itemName, { color: theme.text }]}>{item.item_name} × {item.quantity}</Text><Text style={styles.meta}>{currency} {item.unit_price.toLocaleString()} each</Text></View><Text style={[styles.itemName, { color: theme.text }]}>{currency} {(item.unit_price * item.quantity).toLocaleString()}</Text></View>)}<View style={styles.total}><Text style={[styles.panelTitle, { color: theme.text }]}>Total</Text><Text style={styles.orderNumber}>{currency} {order.total.toLocaleString()}</Text></View></View>
    <View style={[styles.panel, { backgroundColor: card, borderColor: border }]}><Text style={[styles.panelTitle, { color: theme.text }]}>Order information</Text><Text style={styles.meta}>Created {new Date(order.created_at).toLocaleString()}</Text>{order.due_at ? <Text style={styles.meta}>Due {new Date(order.due_at).toLocaleDateString()}</Text> : null}{order.reserved_at ? <Text style={styles.meta}>Stock reserved</Text> : null}{order.notes ? <Text style={[styles.note, { color: theme.text }]}>{order.notes}</Text> : null}</View>
    {!terminal ? <><Pressable onPress={() => void change(next as 'confirmed' | 'preparing' | 'ready' | 'completed')} style={styles.primary}><Text style={styles.primaryText}>{nextLabel[next]}</Text></Pressable><Pressable onPress={() => Alert.alert('Cancel this order?', 'Any reserved stock will be released.', [{ text: 'Keep order', style: 'cancel' }, { text: 'Cancel order', style: 'destructive', onPress: () => { void change('cancelled'); } }])} style={styles.cancel}><Text style={styles.cancelText}>Cancel order</Text></Pressable></> : null}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 19, paddingBottom: 34 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, title: { fontSize: 20, fontWeight: '800' }, hero: { borderWidth: 1, borderRadius: 18, padding: 17, alignItems: 'center' }, orderNumber: { color: '#8055D8', fontWeight: '900', fontSize: 15 }, status: { fontWeight: '900', fontSize: 10, marginTop: 8 }, amount: { fontSize: 28, fontWeight: '900', marginVertical: 8 }, panel: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 12 }, panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, panelTitle: { fontSize: 14, fontWeight: '800' }, item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1 }, itemName: { fontSize: 12, fontWeight: '700' }, meta: { color: '#958C9F', fontSize: 11, marginTop: 5 }, total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }, note: { marginTop: 8 }, primary: { backgroundColor: '#8055D8', padding: 14, borderRadius: 13, alignItems: 'center', marginTop: 16 }, primaryText: { color: 'white', fontWeight: '800' }, cancel: { alignItems: 'center', padding: 13 }, cancelText: { color: '#BC4545', fontWeight: '700' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 } });
