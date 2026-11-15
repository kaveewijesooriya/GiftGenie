import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OrderDatePicker from '@/components/order-date-picker';
import { Colors } from '@/constants/theme';
import { useAppearance } from '@/context/appearance-context';
import { createOrder, listBundles, listCustomers, listProducts, saveCustomer, type BundleRecord, type CustomerInput, type CustomerRecord, type ProductRecord } from '@/database/repository';
import { requestLocalNotificationPermission, syncOrderReminders } from '@/notifications/reminders';

const emptyCustomer: CustomerInput = { name: '', phone: '', email: '', address: '', notes: '' };

export default function CreateOrderScreen() {
  const router = useRouter();
  const { isDark, currency } = useAppearance();
  const theme = Colors[isDark ? 'dark' : 'light'];
  const card = isDark ? '#252238' : '#FFFFFF';
  const border = isDark ? '#393044' : '#EEE8F6';
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [bundles, setBundles] = useState<BundleRecord[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [bundleQuantities, setBundleQuantities] = useState<Record<string, string>>({});
  const [customerId, setCustomerId] = useState('');
  const [customerDraft, setCustomerDraft] = useState<CustomerInput>(emptyCustomer);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [priority, setPriority] = useState<'normal' | 'emergency'>('normal');
  const [dueAt, setDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([listProducts(), listCustomers(), listBundles()])
      .then(([items, people, bundleRows]) => {
        if (active) {
          setProducts(items);
          setCustomers(people);
          setBundles(bundleRows.filter((bundle) => bundle.active));
        }
      })
      .catch(() => { if (active) setError('Could not load products and customers.'); });
    return () => { active = false; };
  }, []));

  const matchingProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase();
    return products.filter((product) => !query || `${product.name} ${product.sku ?? ''} ${product.category}`.toLocaleLowerCase().includes(query));
  }, [products, productSearch]);
  const selected = products.flatMap((product) => {
    const quantity = Number(quantities[product.id] ?? '0');
    return quantity > 0 ? [{ productId: product.id, quantity, total: product.sellingPrice * quantity }] : [];
  });
  const selectedBundles = bundles.flatMap((bundle) => {
    const quantity = Number(bundleQuantities[bundle.id] || 0);
    return quantity > 0 ? [{ bundleId: bundle.id, quantity }] : [];
  });
  const total = selected.reduce((sum, item) => sum + item.total, 0)
    + bundles.reduce((sum, bundle) => sum + (bundle.sellingPrice - bundle.discount) * Number(bundleQuantities[bundle.id] || 0), 0);

  async function submit() {
    setError('');
    setSaving(true);
    try {
      if (!selected.length && !selectedBundles.length) throw new Error('Add at least one product or bundle to the order.');
      let selectedCustomerId = customerId || undefined;
      if (addingCustomer) {
        if (!customerDraft.name.trim() || !customerDraft.phone.trim()) {
          throw new Error('Enter the new customer’s name and phone number.');
        }
        selectedCustomerId = await saveCustomer(customerDraft);
      }
      const due = dueAt ? new Date(`${dueAt}T12:00:00`).toISOString() : undefined;
      const id = await createOrder({ customerId: selectedCustomerId, priority, dueAt: due, notes, lines: selected, bundles: selectedBundles });
      if (due && await requestLocalNotificationPermission()) await syncOrderReminders(id, `#${id.slice(-6)}`, due);
      router.replace('/(tabs)/orders');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Order could not be created.');
    } finally {
      setSaving(false);
    }
  }

  function setCustomerField<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setCustomerDraft((current) => ({ ...current, [key]: value }));
  }

  function changeQuantity(productId: string, delta: number) {
    setQuantities((current) => {
      const next = Math.max(0, Number(current[productId] || 0) + delta);
      return { ...current, [productId]: next ? String(next) : '' };
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={theme.text} /></Pressable>
          <Text style={[styles.title, { color: theme.text }]}>New order</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Customer</Text>
        <View style={styles.chips}>
          <Chip label="Walk-in" selected={!customerId && !addingCustomer} onPress={() => { setCustomerId(''); setAddingCustomer(false); }} />
          {customers.map((customer) => <Chip key={customer.id} label={customer.name} selected={customerId === customer.id && !addingCustomer} onPress={() => { setCustomerId(customer.id); setAddingCustomer(false); }} />)}
          <Chip label={addingCustomer ? 'Cancel new customer' : '+ Add customer details'} selected={addingCustomer} onPress={() => { setCustomerId(''); setAddingCustomer((value) => !value); }} />
        </View>

        {addingCustomer ? (
          <View style={[styles.customerPanel, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.panelTitle, { color: theme.text }]}>New customer details</Text>
            <FormField label="Name *" value={customerDraft.name} onChangeText={(value) => setCustomerField('name', value)} theme={theme.text} card={card} border={border} />
            <FormField label="Phone *" value={customerDraft.phone} onChangeText={(value) => setCustomerField('phone', value)} theme={theme.text} card={card} border={border} keyboardType="phone-pad" />
            <FormField label="Email (optional)" value={customerDraft.email ?? ''} onChangeText={(value) => setCustomerField('email', value)} theme={theme.text} card={card} border={border} keyboardType="email-address" />
            <FormField label="Address (optional)" value={customerDraft.address ?? ''} onChangeText={(value) => setCustomerField('address', value)} theme={theme.text} card={card} border={border} />
          </View>
        ) : null}

        <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
        <View style={styles.segment}>
          <Chip label="Normal" selected={priority === 'normal'} onPress={() => setPriority('normal')} />
          <Chip label="Emergency" selected={priority === 'emergency'} onPress={() => setPriority('emergency')} />
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Due date (optional)</Text>
        <OrderDatePicker value={dueAt} onChange={setDueAt} color={theme.text} surface={card} border={border} isDark={isDark} />
        {dueAt ? <Pressable onPress={() => setDueAt('')} style={styles.clearDate}><Text style={styles.clearDateText}>Clear date</Text></Pressable> : null}
        <FormField label="Notes" value={notes} onChangeText={setNotes} theme={theme.text} card={card} border={border} multiline />

        <View style={styles.productHeading}>
          <View><Text style={[styles.sectionTitle, { color: theme.text }]}>Products</Text><Text style={styles.hint}>Choose items and set quantities</Text></View>
          <Text style={styles.count}>{matchingProducts.length} items</Text>
        </View>
        <View style={[styles.searchBox, { backgroundColor: card, borderColor: border }]}>
          <Ionicons name="search-outline" size={18} color="#8B8198" />
          <TextInput value={productSearch} onChangeText={setProductSearch} placeholder="Search products" placeholderTextColor="#978E9F" style={[styles.searchInput, { color: theme.text }]} returnKeyType="search" />
          {productSearch ? <Pressable accessibilityLabel="Clear product search" onPress={() => setProductSearch('')}><Ionicons name="close-circle" size={18} color="#958C9C" /></Pressable> : null}
        </View>

        {products.length ? matchingProducts.length ? (
          <View style={styles.productGrid}>
            {matchingProducts.map((product) => {
              const available = product.stockQuantity - product.reservedQuantity;
              const quantity = Number(quantities[product.id] || 0);
              return (
                <View key={product.id} style={[styles.productCard, { backgroundColor: card, borderColor: border }]}>
                  <View style={styles.productImage}>
                    {product.photoUri ? <Image source={{ uri: product.photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Text style={styles.productEmoji}>{product.emoji || '🎁'}</Text>}
                  </View>
                  <Text numberOfLines={2} style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
                  <Text style={styles.productPrice}>{currency} {product.sellingPrice.toLocaleString()}</Text>
                  <Text style={styles.hint}>{available} available</Text>
                  <View style={styles.quantityRow}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove one ${product.name}`} disabled={quantity === 0} onPress={() => changeQuantity(product.id, -1)} style={[styles.quantityButton, quantity === 0 && styles.quantityDisabled]}><Ionicons name="remove" size={17} color="#6536BF" /></Pressable>
                    <TextInput value={quantities[product.id] ?? ''} onChangeText={(value) => setQuantities((previous) => ({ ...previous, [product.id]: value.replace(/[^0-9]/g, '') }))} placeholder="0" keyboardType="number-pad" placeholderTextColor="#9A92A3" accessibilityLabel={`Quantity for ${product.name}`} style={[styles.quantity, { color: theme.text, borderColor: border }]} />
                    <Pressable accessibilityRole="button" accessibilityLabel={`Add one ${product.name}`} disabled={quantity >= available} onPress={() => changeQuantity(product.id, 1)} style={[styles.quantityButton, quantity >= available && styles.quantityDisabled]}><Ionicons name="add" size={17} color="#6536BF" /></Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : <View style={[styles.empty, { backgroundColor: card, borderColor: border }]}><Text style={{ color: theme.textSecondary }}>No products match “{productSearch}”.</Text></View>
          : <View style={[styles.empty, { backgroundColor: card, borderColor: border }]}><Text style={{ color: theme.textSecondary }}>Add inventory products before creating an order.</Text><Pressable onPress={() => router.push('/(tabs)/inventory')}><Text style={styles.link}>Go to inventory</Text></Pressable></View>}

        {bundles.length ? <>
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20, marginBottom: 10 }]}>Gift bundles</Text>
          {bundles.map((bundle) => {
            const available = bundle.components.length ? Math.min(...bundle.components.map((part) => Math.floor(part.available / part.quantity))) : 0;
            return <View key={bundle.id} style={[styles.bundleRow, { backgroundColor: card, borderColor: border }]}>
              <View style={{ flex: 1 }}><Text style={[styles.productName, { color: theme.text }]}>{bundle.name}</Text><Text style={styles.hint}>{currency} {(bundle.sellingPrice - bundle.discount).toLocaleString()} · up to {available} available</Text></View>
              <TextInput value={bundleQuantities[bundle.id] ?? ''} onChangeText={(value) => setBundleQuantities((previous) => ({ ...previous, [bundle.id]: value.replace(/[^0-9]/g, '') }))} placeholder="0" keyboardType="number-pad" placeholderTextColor="#9A92A3" style={[styles.quantity, { color: theme.text, borderColor: border }]} />
            </View>;
          })}
        </> : null}

        <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: theme.text }]}>Order total</Text><Text style={styles.totalValue}>{currency} {total.toLocaleString()}</Text></View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={() => void submit()} disabled={saving} style={[styles.submit, saving && { opacity: 0.6 }]}><Text style={styles.submitText}>{saving ? 'Saving…' : 'Save pending order'}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && { color: 'white' }]}>{label}</Text></Pressable>;
}

function FormField({ label, value, onChangeText, theme, card, border, multiline, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; theme: string; card: string; border: string; multiline?: boolean; keyboardType?: 'default' | 'phone-pad' | 'email-address' }) {
  return <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: theme }]}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} multiline={multiline} placeholderTextColor="#9991A1" style={[styles.input, multiline && styles.multiline, { color: theme, backgroundColor: card, borderColor: border }]} />
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 19, paddingBottom: 35 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 21, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 15 },
  segment: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#E3DBEF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'transparent' },
  chipSelected: { backgroundColor: '#8055D8', borderColor: '#8055D8' },
  chipText: { color: '#766D80', fontSize: 11, fontWeight: '700' },
  customerPanel: { borderWidth: 1, borderRadius: 15, padding: 13, marginBottom: 15 },
  panelTitle: { fontSize: 13, fontWeight: '800', marginBottom: 10 },
  field: { marginBottom: 13 },
  fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  input: { minHeight: 45, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  multiline: { minHeight: 72, paddingTop: 11, textAlignVertical: 'top' },
  clearDate: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 10, padding: 5 },
  clearDateText: { color: '#8055D8', fontSize: 11, fontWeight: '700' },
  productHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  count: { color: '#8055D8', fontSize: 11, fontWeight: '800' },
  hint: { fontSize: 10, color: '#958C9C', marginTop: 4 },
  searchBox: { minHeight: 45, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 10, fontSize: 13 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  productCard: { width: '48%', borderWidth: 1, borderRadius: 14, padding: 9, marginBottom: 1 },
  productImage: { height: 112, borderRadius: 10, backgroundColor: '#F0E8FF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 },
  productEmoji: { fontSize: 40 },
  productName: { fontSize: 12, fontWeight: '800', minHeight: 30 },
  productPrice: { color: '#8055D8', fontSize: 12, fontWeight: '900', marginTop: 5 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  quantityButton: { width: 29, height: 29, borderRadius: 9, backgroundColor: '#F0E8FF', alignItems: 'center', justifyContent: 'center' },
  quantityDisabled: { opacity: 0.4 },
  quantity: { width: 43, height: 34, borderWidth: 1, borderRadius: 9, textAlign: 'center', paddingHorizontal: 2 },
  bundleRow: { borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  empty: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 9 },
  link: { color: '#8055D8', fontWeight: '800', fontSize: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, marginTop: 16, borderTopWidth: 1, borderColor: '#E5DDEE' },
  totalLabel: { fontWeight: '800', fontSize: 14 },
  totalValue: { color: '#8055D8', fontWeight: '900', fontSize: 17 },
  error: { color: '#C92A2A', marginTop: 8 },
  submit: { backgroundColor: '#8055D8', padding: 14, borderRadius: 13, alignItems: 'center', marginTop: 15 },
  submitText: { color: 'white', fontWeight: '800' },
});
