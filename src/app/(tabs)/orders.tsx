import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppearance } from '@/context/appearance-context';
import { listOrders, type OrderRecord } from '@/database/repository';

export default function OrdersScreen() {
  const router = useRouter();
  const { isDark, currency } = useAppearance();
  const theme = Colors[isDark ? 'dark' : 'light'];
  const card = isDark ? '#252238' : '#FFFFFF';
  const border = isDark ? '#393044' : '#EEE8F6';
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [error, setError] = useState('');
  const refresh = useCallback(() => {
    let active = true;
    listOrders().then((value) => { if (active) { setOrders(value); setError(''); } }).catch(() => { if (active) setError('Could not load orders.'); });
    return () => { active = false; };
  }, []);
  useFocusEffect(refresh);
  const active = orders.filter((order) => !['completed', 'cancelled'].includes(order.status));
  const closed = orders.filter((order) => ['completed', 'cancelled'].includes(order.status));
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}><View><Text style={styles.kicker}>SELLER SPACE</Text><Text style={[styles.title, { color: theme.text }]}>Orders</Text><Text style={{ color: theme.textSecondary }}>Track work from request to pickup.</Text></View><Pressable onPress={() => router.push('/orders/create')} style={styles.add}><Ionicons name="add" size={19} color="white" /><Text style={styles.addText}>New</Text></Pressable></View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.summaryRow}><Summary label="In progress" value={active.length} theme={theme.text} card={card} border={border} /><Summary label="Completed" value={orders.filter((item) => item.status === 'completed').length} theme={theme.text} card={card} border={border} /><Summary label="Emergency" value={active.filter((item) => item.priority === 'emergency').length} theme={theme.text} card={card} border={border} /></View>
      {orders.length === 0 ? <View style={[styles.empty, { backgroundColor: card, borderColor: border }]}><View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={28} color="#8055D8" /></View><Text style={[styles.emptyTitle, { color: theme.text }]}>No orders yet</Text><Text style={[styles.emptyCopy, { color: theme.textSecondary }]}>Create an order to reserve stock and follow it through preparation.</Text><Pressable onPress={() => router.push('/orders/create')} style={styles.primary}><Text style={styles.primaryText}>Create an order</Text></Pressable></View> : <>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Active</Text>
        {active.length ? active.map((order) => <OrderCard key={order.id} order={order} currency={currency} card={card} border={border} theme={theme.text} secondary={theme.textSecondary} onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })} />) : <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>No active orders.</Text>}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recently closed</Text>
        {closed.slice(0, 10).map((order) => <OrderCard key={order.id} order={order} currency={currency} card={card} border={border} theme={theme.text} secondary={theme.textSecondary} onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })} />)}
      </>}
    </ScrollView>
  </SafeAreaView>;
}

function Summary({ label, value, theme, card, border }: { label: string; value: number; theme: string; card: string; border: string }) { return <View style={[styles.summary, { backgroundColor: card, borderColor: border }]}><Text style={[styles.summaryValue, { color: theme }]}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>; }
function OrderCard({ order, currency, card, border, theme, secondary, onPress }: { order: OrderRecord; currency: string; card: string; border: string; theme: string; secondary: string; onPress: () => void }) {
  const emergency = order.priority === 'emergency';
  const tint = order.status === 'completed' ? '#268554' : order.status === 'cancelled' ? '#91899B' : '#8055D8';
  return <Pressable onPress={onPress} style={[styles.order, { backgroundColor: card, borderColor: border }]}><View style={[styles.orderIcon, { backgroundColor: emergency ? '#FFF0E8' : '#F0E8FF' }]}><Ionicons name={emergency ? 'flash' : 'receipt-outline'} size={19} color={emergency ? '#D26B32' : '#8055D8'} /></View><View style={{ flex: 1 }}><View style={styles.orderTitleLine}><Text style={[styles.orderNumber, { color: theme }]}>{order.orderNumber}</Text>{emergency ? <Text style={styles.emergency}>URGENT</Text> : null}</View><Text style={{ color: secondary, fontSize: 11, marginTop: 4 }}>{order.customerName || 'Walk-in customer'} · {order.dueAt ? new Date(order.dueAt).toLocaleDateString() : 'No due date'}</Text></View><View style={{ alignItems: 'flex-end', gap: 5 }}><Text style={[styles.orderTotal, { color: theme }]}>{currency} {order.total.toLocaleString()}</Text><Text style={{ fontSize: 10, fontWeight: '800', color: tint }}>{order.status.toUpperCase()}</Text></View></Pressable>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 19, paddingBottom: 35 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 }, kicker: { color: '#8055D8', fontWeight: '800', fontSize: 10, letterSpacing: 1.2 }, title: { fontSize: 28, fontWeight: '800', marginVertical: 5 }, add: { backgroundColor: '#8055D8', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', gap: 4, alignItems: 'center' }, addText: { color: 'white', fontWeight: '800' }, summaryRow: { flexDirection: 'row', gap: 8 }, summary: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 11 }, summaryValue: { fontSize: 21, fontWeight: '800' }, summaryLabel: { color: '#968DA0', fontSize: 9, marginTop: 3 }, sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 23, marginBottom: 10 }, order: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 }, orderIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, orderTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 6 }, orderNumber: { fontSize: 13, fontWeight: '800' }, emergency: { color: '#C25A24', fontSize: 8, fontWeight: '900', backgroundColor: '#FFF0E8', paddingHorizontal: 5, paddingVertical: 3, borderRadius: 5 }, orderTotal: { fontSize: 12, fontWeight: '800' }, empty: { marginTop: 35, alignItems: 'center', borderWidth: 1, borderRadius: 19, padding: 23 }, emptyIcon: { width: 58, height: 58, backgroundColor: '#F0E8FF', borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 14 }, emptyCopy: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 }, primary: { backgroundColor: '#8055D8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 15 }, primaryText: { color: 'white', fontSize: 13, fontWeight: '800' }, emptyHint: { fontSize: 12 }, error: { color: '#C92A2A', marginBottom: 9 } });
