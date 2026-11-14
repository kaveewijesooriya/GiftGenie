import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppearance } from '@/context/appearance-context';
import { getDashboardSummary, type DashboardSummary } from '@/database/repository';

const emptySummary: DashboardSummary = {
  productCount: 0, lowStockCount: 0, openOrderCount: 0, salesToday: 0, recentOrders: [], lowStockProducts: [],
};

export default function HomeScreen() {
  const router = useRouter();
  const { isDark: dark, currency } = useAppearance();
  const theme = Colors[dark ? 'dark' : 'light'];
  const [summary, setSummary] = useState(emptySummary);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    let active = true;
    getDashboardSummary().then((value) => { if (active) { setSummary(value); setError(''); } })
      .catch(() => { if (active) setError('Business data could not be loaded. Close and reopen the app to try again.'); });
    return () => { active = false; };
  }, []);
  useFocusEffect(refresh);

  const money = (value: number) => `${currency} ${value.toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;
  const card = dark ? '#252238' : '#FFFFFF';
  const border = dark ? '#393044' : '#EEE8F6';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={[styles.kicker, { color: '#8055D8' }]}>GIFTGENIE • SELLER SPACE</Text><Text style={[styles.title, { color: theme.text }]}>Good day 👋</Text><Text style={{ color: theme.textSecondary }}>Here’s your shop at a glance.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={[styles.avatar, { backgroundColor: '#8055D8' }]}><Ionicons name="person-outline" size={21} color="white" /></Pressable>
        </View>
        <View style={styles.stats}>
          <StatCard title="Products" value={String(summary.productCount)} icon="cube-outline" theme={theme} surface={card} border={border} onPress={() => router.push('/inventory')} />
          <StatCard title="Open orders" value={String(summary.openOrderCount)} icon="receipt-outline" theme={theme} surface={card} border={border} onPress={() => router.push('/orders')} />
          <StatCard title="Sales today" value={money(summary.salesToday)} icon="trending-up-outline" theme={theme} surface={card} border={border} onPress={() => router.push('/sales')} />
          <StatCard title="Low stock" value={String(summary.lowStockCount)} icon="warning-outline" theme={theme} surface={card} border={border} warning onPress={() => router.push('/inventory')} />
        </View>

        <View style={[styles.hero, { backgroundColor: '#5B2AB8' }]}>
          <View style={styles.heroDecor}><Ionicons name="sparkles" size={64} color="#FFFFFF22" /></View>
          <Text style={styles.heroEyebrow}>YOUR BUSINESS, IN ONE PLACE</Text>
          <Text style={styles.heroTitle}>Make every gift{ '\n' }special.</Text>
          <Text style={styles.heroCopy}>Manage stock, prepare orders and keep your customers smiling.</Text>
          <Pressable onPress={() => router.push('/inventory')} style={styles.heroButton}><Text style={styles.heroButtonText}>Manage inventory</Text><Ionicons name="arrow-forward" size={16} color="#5B2AB8" /></Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick actions</Text>
        <View style={styles.actions}>
          <QuickAction icon="add-circle-outline" label="Add product" color="#8055D8" onPress={() => router.push('/inventory?create=1')} surface={card} border={border} text={theme.text} />
          <QuickAction icon="receipt-outline" label="New order" color="#E77B42" onPress={() => router.push('/orders/create')} surface={card} border={border} text={theme.text} />
          <QuickAction icon="people-outline" label="Customers" color="#419C80" onPress={() => router.push('/customers')} surface={card} border={border} text={theme.text} />
          <QuickAction icon="bar-chart-outline" label="Analytics" color="#D36D9C" onPress={() => router.push('/analytics')} surface={card} border={border} text={theme.text} />
        </View>

        {error ? <Text style={{ color: '#D94343', marginTop: 14 }}>{error}</Text> : null}
        <View style={styles.sectionRow}><Text style={[styles.sectionTitle, { color: theme.text }]}>Low stock alerts</Text><Pressable onPress={() => router.push('/inventory')}><Text style={styles.link}>View inventory</Text></Pressable></View>
        {summary.lowStockProducts.length ? summary.lowStockProducts.map((product) => (
          <Pressable key={product.id} onPress={() => router.push({ pathname: '/gift-details/[id]', params: { id: product.id } })} style={[styles.listRow, { backgroundColor: card, borderColor: border }]}>
            <View style={[styles.miniIcon, { backgroundColor: '#FFF0E8' }]}><Ionicons name="cube-outline" size={18} color="#DA6C32" /></View>
            <View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: theme.text }]}>{product.name}</Text><Text style={{ color: theme.textSecondary, fontSize: 12 }}>Available {product.available} · threshold {product.threshold}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        )) : <View style={[styles.empty, { backgroundColor: card, borderColor: border }]}><Text style={{ fontSize: 25 }}>✨</Text><Text style={[styles.rowTitle, { color: theme.text }]}>All clear on stock</Text><Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Products at or below their low-stock threshold will appear here.</Text></View>}

        <View style={styles.sectionRow}><Text style={[styles.sectionTitle, { color: theme.text }]}>Recent orders</Text><Pressable onPress={() => router.push('/orders')}><Text style={styles.link}>See all</Text></Pressable></View>
        {summary.recentOrders.length ? (
          summary.recentOrders.map((order) => (
            <View key={order.id} style={[styles.listRow, { backgroundColor: card, borderColor: border }]}>
              <View style={[styles.miniIcon, { backgroundColor: '#F0E8FF' }]}><Ionicons name="receipt-outline" size={18} color="#8055D8" /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{order.orderNumber}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{order.status}</Text>
              </View>
              <Text style={[styles.rowTitle, { color: theme.text }]}>{money(order.total)}</Text>
            </View>
          ))
        ) : <View style={[styles.empty, { backgroundColor: card, borderColor: border }]}><Text style={{ color: theme.textSecondary }}>Your new orders will show here.</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, icon, theme, surface, border, warning, onPress }: any) {
  return <Pressable onPress={onPress} style={[styles.statCard, { backgroundColor: surface, borderColor: border }]}><View style={[styles.statIcon, { backgroundColor: warning ? '#FFF0E8' : '#F0E8FF' }]}><Ionicons name={icon} size={18} color={warning ? '#DA6C32' : '#8055D8'} /></View><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statValue, { color: theme.text }]}>{value}</Text><Text style={{ color: theme.textSecondary, fontSize: 11 }}>{title}</Text></Pressable>;
}
function QuickAction({ icon, label, color, onPress, surface, border, text }: any) {
  return <Pressable onPress={onPress} style={[styles.action, { backgroundColor: surface, borderColor: border }]}><Ionicons name={icon} size={22} color={color} /><Text style={[styles.actionText, { color: text }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 20, paddingBottom: 34 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, kicker: { fontSize: 10, letterSpacing: 1.3, fontWeight: '800' }, title: { fontSize: 27, fontWeight: '800', marginTop: 7, marginBottom: 3 }, avatar: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, statCard: { width: '48%', flexGrow: 1, flexBasis: '46%', minHeight: 108, borderRadius: 17, borderWidth: 1, padding: 13 }, statIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, statValue: { fontSize: 20, fontWeight: '800' }, hero: { marginTop: 18, padding: 21, borderRadius: 23, overflow: 'hidden' }, heroDecor: { position: 'absolute', right: 18, top: 17 }, heroEyebrow: { color: '#E5D9FF', fontWeight: '800', fontSize: 9, letterSpacing: 1.2 }, heroTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 32, fontWeight: '800', marginTop: 9 }, heroCopy: { color: '#E9DFFF', fontSize: 12, lineHeight: 18, marginTop: 7, maxWidth: '78%' }, heroButton: { backgroundColor: 'white', alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 15 }, heroButtonText: { color: '#5B2AB8', fontSize: 12, fontWeight: '800' }, sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 23, marginBottom: 12 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, action: { width: '48%', flexGrow: 1, flexBasis: '45%', minHeight: 65, borderRadius: 15, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }, actionText: { fontSize: 12, fontWeight: '700' }, sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }, link: { fontSize: 12, fontWeight: '800', color: '#8055D8' }, listRow: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 15, padding: 12, marginBottom: 9 }, miniIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, rowTitle: { fontSize: 13, fontWeight: '800' }, empty: { alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 15, padding: 17 },
});
