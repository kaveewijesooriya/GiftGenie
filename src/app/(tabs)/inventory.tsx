import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppearance } from '@/context/appearance-context';
import { archiveProduct, listProducts, listStockMovements, saveProduct, updateStock, type ProductInput, type ProductRecord } from '@/database/repository';
import { syncLowStockAlerts } from '@/notifications/reminders';

const blank: ProductInput = { name: '', sku: '', category: '', description: '', costPrice: 0, sellingPrice: 0, stockQuantity: 0, lowStockThreshold: 5, recipientTags: [], occasionTags: [] };

export default function InventoryScreen() {
  const params = useLocalSearchParams<{ create?: string; editId?: string }>();
  const { isDark: dark, currency } = useAppearance();
  const colors = Colors[dark ? 'dark' : 'light'];
  const surface = dark ? '#252238' : '#FFFFFF';
  const border = dark ? '#393044' : '#EEE8F6';
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<ProductRecord | null>(null);
  const [form, setForm] = useState<ProductInput>(blank);
  const [movementTarget, setMovementTarget] = useState<ProductRecord | null>(null);
  const [movementDelta, setMovementDelta] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listStockMovements>>>([]);
  const [historyTarget, setHistoryTarget] = useState<ProductRecord | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [occasionFilter, setOccasionFilter] = useState('All');
  const [recipientFilter, setRecipientFilter] = useState('All');
  const [error, setError] = useState('');

  const openNew = useCallback(() => { setEditing(null); setForm(blank); setError(''); setModal(true); }, []);
  const openEdit = useCallback((product: ProductRecord) => { setEditing(product); setForm({ ...product }); setError(''); setModal(true); }, []);

  const refresh = useCallback(() => {
    let active = true;
    listProducts().then((rows) => { if (active) setProducts(rows); }).catch(() => { if (active) setError('Could not load inventory.'); });
    return () => { active = false; };
  }, []);
  useFocusEffect(refresh);

  const handledParam = useRef('');
  useEffect(() => {
    if (params.create === '1' && handledParam.current !== 'create') {
      handledParam.current = 'create';
      openNew();
    } else if (params.editId && products.length && handledParam.current !== params.editId) {
      const target = products.find((item) => item.id === params.editId);
      if (target) {
        handledParam.current = params.editId;
        const frame = requestAnimationFrame(() => openEdit(target));
        return () => cancelAnimationFrame(frame);
      }
    }
  }, [params.create, params.editId, products, openNew, openEdit]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((item) => (!query || `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query)) &&
      (categoryFilter === 'All' || item.category === categoryFilter) &&
      (occasionFilter === 'All' || item.occasionTags.includes(occasionFilter)) &&
      (recipientFilter === 'All' || item.recipientTags.includes(recipientFilter)) &&
      (minPrice === '' || item.sellingPrice >= Number(minPrice)) && (maxPrice === '' || item.sellingPrice <= Number(maxPrice)));
  }, [products, search, minPrice, maxPrice, categoryFilter, occasionFilter, recipientFilter]);
  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map((item) => item.category).filter(Boolean))).sort()], [products]);
  const occasions = useMemo(() => ['All', ...Array.from(new Set(products.flatMap((item) => item.occasionTags))).sort()], [products]);

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit() {
    const costPrice = Number(form.costPrice);
    const sellingPrice = Number(form.sellingPrice);
    const stockQuantity = Number(form.stockQuantity);
    const lowStockThreshold = Number(form.lowStockThreshold);
    if (!form.name.trim()) return setError('Product name is required.');
    if (![costPrice, sellingPrice, stockQuantity, lowStockThreshold].every(Number.isFinite) || [costPrice, sellingPrice, stockQuantity, lowStockThreshold].some((number) => number < 0) || !Number.isInteger(stockQuantity) || !Number.isInteger(lowStockThreshold)) return setError('Enter valid non-negative prices and whole-number stock values.');
    if (editing && stockQuantity < editing.reservedQuantity) return setError(`Stock cannot be lower than ${editing.reservedQuantity} reserved units.`);
    try { await saveProduct({ ...form, costPrice, sellingPrice, stockQuantity, lowStockThreshold }, editing?.id); setModal(false); await refreshNow(); await syncLowStockAlerts(await listProducts()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Product could not be saved.'); }
  }
  async function refreshNow() { setProducts(await listProducts()); }
  async function remove(product: ProductRecord) {
    Alert.alert('Archive product?', `${product.name} will be hidden from active inventory. Existing history is kept.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => { void archiveProduct(product.id).then(async () => { await refreshNow(); await syncLowStockAlerts(await listProducts()); }).catch((caught: unknown) => Alert.alert('Unable to archive', caught instanceof Error ? caught.message : 'Please try again.')); } },
    ]);
  }
  async function saveMovement() {
    if (!movementTarget) return;
    const delta = Number(movementDelta);
    if (!Number.isSafeInteger(delta) || delta === 0) return setError('Enter a non-zero whole-number stock change. Use a minus sign to reduce stock.');
    try { await updateStock(movementTarget, delta, movementNote || (delta > 0 ? 'Stock restock' : 'Manual stock adjustment')); setMovementTarget(null); setMovementDelta(''); setMovementNote(''); setError(''); await refreshNow(); await syncLowStockAlerts(await listProducts()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Stock could not be updated.'); }
  }
  async function openHistory(product: ProductRecord) { setHistoryTarget(product); setHistory(await listStockMovements(product.id)); setError(''); }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><View><Text style={styles.kicker}>SELLER SPACE</Text><Text style={[styles.title, { color: colors.text }]}>Inventory</Text><Text style={{ color: colors.textSecondary }}>Manage products, pricing and stock.</Text></View><Pressable onPress={openNew} style={styles.addButton}><Ionicons name="add" size={21} color="white" /><Text style={styles.addText}>Add</Text></Pressable></View>
        <View style={[styles.searchBox, { backgroundColor: surface, borderColor: border }]}><Ionicons name="search-outline" size={19} color="#8B8198" /><TextInput value={search} onChangeText={setSearch} placeholder="Search name, SKU or category" placeholderTextColor="#978E9F" style={[styles.searchInput, { color: colors.text }]} /></View>
        <View style={styles.filterRow}><TextInput value={minPrice} onChangeText={setMinPrice} keyboardType="decimal-pad" placeholder={`Min ${currency}`} placeholderTextColor="#978E9F" style={[styles.filterInput, { backgroundColor: surface, borderColor: border, color: colors.text }]} /><TextInput value={maxPrice} onChangeText={setMaxPrice} keyboardType="decimal-pad" placeholder={`Max ${currency}`} placeholderTextColor="#978E9F" style={[styles.filterInput, { backgroundColor: surface, borderColor: border, color: colors.text }]} /></View>
        <FilterRow label="Category" values={categories} value={categoryFilter} onChange={setCategoryFilter} />
        <FilterRow label="Occasion" values={occasions} value={occasionFilter} onChange={setOccasionFilter} />
        <FilterRow label="Recipient" values={['All', 'Boys', 'Girls', 'Both']} value={recipientFilter} onChange={setRecipientFilter} />
        <View style={styles.summary}><Text style={[styles.summaryText, { color: colors.textSecondary }]}>{visible.length} active {visible.length === 1 ? 'product' : 'products'}</Text><Text style={[styles.summaryText, { color: colors.textSecondary }]}>{products.filter((item) => item.stockQuantity - item.reservedQuantity <= item.lowStockThreshold).length} low stock</Text></View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!products.length ? <View style={[styles.empty, { backgroundColor: surface, borderColor: border }]}><View style={styles.emptyIcon}><Ionicons name="cube-outline" size={29} color="#8055D8" /></View><Text style={[styles.emptyTitle, { color: colors.text }]}>Start your inventory</Text><Text style={[styles.emptyCopy, { color: colors.textSecondary }]}>Add the products you sell. Your stock, cost and profit records will stay on this device.</Text><Pressable onPress={openNew} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Add your first product</Text></Pressable></View> : visible.length ? visible.map((product) => {
          const available = product.stockQuantity - product.reservedQuantity;
          const low = available <= product.lowStockThreshold;
          return <View key={product.id} style={[styles.productCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.productTop}><View style={styles.productEmoji}><Text style={{ fontSize: 24 }}>{product.emoji}</Text></View><View style={{ flex: 1 }}><Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{product.category || 'Uncategorized'}{product.sku ? ` · ${product.sku}` : ''}</Text></View><View style={[styles.badge, { backgroundColor: low ? '#FFF0E8' : '#E8F7EF' }]}><Text style={{ color: low ? '#BD5722' : '#268554', fontSize: 10, fontWeight: '800' }}>{low ? 'LOW' : 'IN STOCK'}</Text></View></View>
            <View style={styles.metrics}><Metric label="Selling" value={`${currency} ${product.sellingPrice.toLocaleString()}`} theme={colors.text} /><Metric label="Cost" value={`${currency} ${product.costPrice.toLocaleString()}`} theme={colors.text} /><Metric label="Available" value={`${available} / ${product.stockQuantity}`} theme={colors.text} /></View>
            {product.reservedQuantity > 0 ? <Text style={styles.reserved}>Reserved for orders: {product.reservedQuantity}</Text> : null}
            <View style={[styles.actions, { borderTopColor: border }]}><Action label="Edit" icon="create-outline" onPress={() => openEdit(product)} /><Action label="Adjust stock" icon="swap-vertical-outline" onPress={() => { setMovementTarget(product); setError(''); }} /><Action label="History" icon="time-outline" onPress={() => void openHistory(product)} /><Action label="Archive" icon="archive-outline" onPress={() => remove(product)} /></View>
          </View>;
        }) : <View style={[styles.empty, { backgroundColor: surface, borderColor: border }]}><Text style={{ color: colors.textSecondary }}>No products match those filters.</Text></View>}
      </ScrollView>

      <Modal visible={modal} animationType="slide" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled"><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.text }]}>{editing ? 'Edit product' : 'Add product'}</Text><Pressable onPress={() => setModal(false)}><Ionicons name="close" size={25} color={colors.text} /></Pressable></View>
          <Field label="Product name *" value={form.name} onChangeText={(v) => update('name', v)} colors={colors} surface={surface} border={border} />
          <Field label="SKU (optional)" value={form.sku ?? ''} onChangeText={(v) => update('sku', v)} colors={colors} surface={surface} border={border} />
          <Field label="Category" value={form.category} onChangeText={(v) => update('category', v)} colors={colors} surface={surface} border={border} />
          <Field label="Description" value={form.description ?? ''} onChangeText={(v) => update('description', v)} colors={colors} surface={surface} border={border} multiline />
          <View style={styles.formPair}><Field label={`Cost price (${currency})`} value={String(form.costPrice)} onChangeText={(v) => update('costPrice', Number(v) || 0)} colors={colors} surface={surface} border={border} numeric /><Field label={`Selling price (${currency})`} value={String(form.sellingPrice)} onChangeText={(v) => update('sellingPrice', Number(v) || 0)} colors={colors} surface={surface} border={border} numeric /></View>
          <View style={styles.formPair}><Field label="Physical stock" value={String(form.stockQuantity)} onChangeText={(v) => update('stockQuantity', Number(v) || 0)} colors={colors} surface={surface} border={border} numeric /><Field label="Low-stock alert at" value={String(form.lowStockThreshold)} onChangeText={(v) => update('lowStockThreshold', Number(v) || 0)} colors={colors} surface={surface} border={border} numeric /></View>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Recipients</Text><View style={styles.tagRow}>{['Boys', 'Girls', 'Both'].map((tag) => <TagToggle key={tag} label={tag} selected={form.recipientTags.includes(tag)} onPress={() => update('recipientTags', form.recipientTags.includes(tag) ? form.recipientTags.filter((item) => item !== tag) : [...form.recipientTags.filter((item) => item !== 'Both'), tag])} />)}</View>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Occasions</Text><View style={styles.tagRow}>{['Birthday', 'Anniversary', 'Wedding', 'Valentines Day', 'Christmas', 'Graduation', 'Housewarming', 'Other'].map((tag) => <TagToggle key={tag} label={tag} selected={form.occasionTags.includes(tag)} onPress={() => update('occasionTags', form.occasionTags.includes(tag) ? form.occasionTags.filter((item) => item !== tag) : [...form.occasionTags, tag])} />)}</View>
          {error ? <Text style={styles.error}>{error}</Text> : null}<Pressable onPress={() => void submit()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{editing ? 'Save changes' : 'Add product'}</Text></Pressable>
        </ScrollView></SafeAreaView>
      </Modal>

      <Modal visible={!!movementTarget} transparent animationType="fade" onRequestClose={() => setMovementTarget(null)}><View style={styles.overlay}><View style={[styles.dialog, { backgroundColor: surface }]}><Text style={[styles.modalTitle, { color: colors.text }]}>Adjust stock</Text><Text style={[styles.modalHint, { color: colors.textSecondary }]}>{movementTarget?.name} · available {movementTarget ? movementTarget.stockQuantity - movementTarget.reservedQuantity : 0}</Text><Field label="Quantity change (+ to restock, − to reduce)" value={movementDelta} onChangeText={setMovementDelta} colors={colors} surface={colors.background} border={border} numeric /><Field label="Reason" value={movementNote} onChangeText={setMovementNote} colors={colors} surface={colors.background} border={border} />{error ? <Text style={styles.error}>{error}</Text> : null}<View style={styles.dialogButtons}><Pressable onPress={() => setMovementTarget(null)} style={[styles.secondaryButton, { borderColor: border }]}><Text style={{ color: colors.text }}>Cancel</Text></Pressable><Pressable onPress={() => void saveMovement()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Save adjustment</Text></Pressable></View></View></View></Modal>

      <Modal visible={!!historyTarget} transparent animationType="slide" onRequestClose={() => setHistoryTarget(null)}><View style={styles.overlay}><View style={[styles.dialog, { backgroundColor: surface }]}><Text style={[styles.modalTitle, { color: colors.text }]}>Stock history</Text><Text style={[styles.modalHint, { color: colors.textSecondary }]}>{historyTarget?.name}</Text><ScrollView style={{ maxHeight: 350 }}>{history.length ? history.map((move) => <View key={move.id} style={[styles.historyRow, { borderBottomColor: border }]}><View style={{ flex: 1 }}><Text style={[styles.productName, { color: colors.text }]}>{move.movement_type.replaceAll('_', ' ')}</Text><Text style={{ color: colors.textSecondary, fontSize: 11 }}>{move.note || 'Stock movement'} · {new Date(move.created_at).toLocaleDateString()}</Text></View><Text style={{ color: move.quantity_delta > 0 ? '#268554' : '#BD5722', fontWeight: '800' }}>{move.quantity_delta > 0 ? '+' : ''}{move.quantity_delta} → {move.quantity_after}</Text></View>) : <Text style={{ color: colors.textSecondary, paddingVertical: 20 }}>No stock movements recorded yet.</Text>}</ScrollView><Pressable onPress={() => setHistoryTarget(null)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Done</Text></Pressable></View></View></Modal>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, colors, surface, border, numeric, multiline }: { label: string; value: string; onChangeText: (value: string) => void; colors: { text: string; textSecondary: string }; surface: string; border: string; numeric?: boolean; multiline?: boolean }) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType={numeric ? 'decimal-pad' : 'default'} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} placeholderTextColor="#978E9F" style={[styles.input, { color: colors.text, backgroundColor: surface, borderColor: border }, multiline && styles.multiline]} /></View>;
}
function Metric({ label, value, theme }: { label: string; value: string; theme: string }) { return <View style={{ flex: 1 }}><Text style={styles.metricLabel}>{label}</Text><Text numberOfLines={1} style={[styles.metricValue, { color: theme }]}>{value}</Text></View>; }
function Action({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.action}><Ionicons name={icon} size={16} color="#8055D8" /><Text style={styles.actionText}>{label}</Text></Pressable>; }
function FilterRow({ label, values, value, onChange }: { label: string; values: string[]; value: string; onChange: (value: string) => void }) { return <View style={styles.filterBlock}><Text style={styles.filterLabel}>{label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>{values.map((item) => <Pressable key={item} onPress={() => onChange(item)} style={[styles.filterChip, value === item && styles.filterChipSelected]}><Text style={[styles.filterChipText, value === item && { color: 'white' }]}>{item}</Text></Pressable>)}</ScrollView></View>; }
function TagToggle({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.tag, selected && styles.tagSelected]}><Text style={[styles.tagText, selected && { color: 'white' }]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 18, paddingBottom: 35 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 }, kicker: { color: '#8055D8', fontWeight: '800', fontSize: 10, letterSpacing: 1.2 }, title: { fontSize: 28, fontWeight: '800', marginVertical: 5 }, addButton: { backgroundColor: '#8055D8', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 4 }, addText: { color: 'white', fontWeight: '800' }, searchBox: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, fontSize: 13 }, filterRow: { flexDirection: 'row', gap: 10, marginTop: 10 }, filterInput: { flex: 1, height: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 12 }, filterBlock: { marginTop: 9 }, filterLabel: { color: '#958C9F', fontSize: 9, fontWeight: '800', marginBottom: 5 }, filterChips: { gap: 6 }, filterChip: { borderRadius: 8, backgroundColor: '#F4F1F7', paddingHorizontal: 9, paddingVertical: 6 }, filterChipSelected: { backgroundColor: '#8055D8' }, filterChipText: { color: '#766D80', fontSize: 9, fontWeight: '700' }, tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }, tag: { borderWidth: 1, borderColor: '#E5DDEE', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 }, tagSelected: { borderColor: '#8055D8', backgroundColor: '#8055D8' }, tagText: { color: '#766D80', fontSize: 10, fontWeight: '700' }, summary: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 }, summaryText: { fontSize: 12, fontWeight: '600' }, productCard: { borderRadius: 17, borderWidth: 1, padding: 13, marginBottom: 11 }, productTop: { flexDirection: 'row', gap: 10, alignItems: 'center' }, productEmoji: { width: 44, height: 44, backgroundColor: '#F0E8FF', borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, productName: { fontSize: 14, fontWeight: '800' }, badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }, metrics: { flexDirection: 'row', gap: 7, marginTop: 15 }, metricLabel: { color: '#93899E', fontSize: 10 }, metricValue: { fontSize: 12, fontWeight: '800', marginTop: 3 }, reserved: { color: '#8055D8', fontSize: 11, fontWeight: '600', marginTop: 9 }, actions: { borderTopWidth: 1, marginTop: 13, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' }, action: { alignItems: 'center', gap: 3, paddingHorizontal: 3 }, actionText: { color: '#8055D8', fontSize: 9, fontWeight: '700' }, empty: { borderWidth: 1, borderRadius: 19, padding: 24, alignItems: 'center', marginTop: 35 }, emptyIcon: { width: 58, height: 58, borderRadius: 19, backgroundColor: '#F0E8FF', alignItems: 'center', justifyContent: 'center' }, emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 15 }, emptyCopy: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 7 }, primaryButton: { backgroundColor: '#8055D8', paddingHorizontal: 15, paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginTop: 15 }, primaryButtonText: { color: 'white', fontWeight: '800', fontSize: 13 }, modalSafe: { flex: 1 }, modalContent: { padding: 20, paddingBottom: 34 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, modalTitle: { fontSize: 20, fontWeight: '800' }, field: { marginBottom: 12, flex: 1 }, fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 }, input: { minHeight: 45, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 }, multiline: { height: 76, paddingTop: 10 }, formPair: { flexDirection: 'row', gap: 10 }, error: { color: '#C92A2A', fontSize: 12, marginVertical: 7 }, overlay: { flex: 1, backgroundColor: '#160D24AA', justifyContent: 'center', padding: 20 }, dialog: { borderRadius: 20, padding: 18, maxHeight: '85%' }, modalHint: { fontSize: 12, marginTop: 4, marginBottom: 15 }, dialogButtons: { flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'flex-end', marginTop: 5 }, secondaryButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 }, historyRow: { paddingVertical: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
});
