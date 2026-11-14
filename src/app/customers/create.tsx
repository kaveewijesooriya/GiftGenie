import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppearance } from '@/context/appearance-context';
import { listCustomers, saveCustomer, type CustomerInput } from '@/database/repository';

export default function CustomerFormScreen() {
  const router = useRouter(); const { customerId } = useLocalSearchParams<{ customerId?: string }>(); const { isDark } = useAppearance(); const theme = Colors[isDark ? 'dark' : 'light']; const card = isDark ? '#252238' : '#FFFFFF'; const border = isDark ? '#393044' : '#EEE8F6';
  const [form, setForm] = useState<CustomerInput>({ name: '', phone: '', email: '', address: '', notes: '' }); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(() => { if (customerId) void listCustomers().then((rows) => { const customer = rows.find((item) => item.id === customerId); if (customer) setForm({ name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, notes: customer.notes }); }); }, [customerId]);
  function field<K extends keyof CustomerInput>(key: K, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit() { setError(''); setSaving(true); try { await saveCustomer(form, customerId); router.back(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Customer could not be saved.'); } finally { setSaving(false); } }
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={theme.text} /></Pressable><Text style={[styles.title, { color: theme.text }]}>{customerId ? 'Edit customer' : 'New customer'}</Text><View style={{ width: 22 }} /></View>
    <Field label="Name *" value={form.name} onChangeText={(v) => field('name', v)} theme={theme.text} card={card} border={border} /><Field label="Phone number *" value={form.phone} onChangeText={(v) => field('phone', v)} theme={theme.text} card={card} border={border} numeric /><Field label="Email (optional)" value={form.email ?? ''} onChangeText={(v) => field('email', v)} theme={theme.text} card={card} border={border} /><Field label="Address (optional)" value={form.address ?? ''} onChangeText={(v) => field('address', v)} theme={theme.text} card={card} border={border} /><Field label="Notes" value={form.notes ?? ''} onChangeText={(v) => field('notes', v)} theme={theme.text} card={card} border={border} />
    <Text style={styles.hint}>A duplicate phone number is checked before saving.</Text>{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable onPress={() => void submit()} disabled={saving} style={styles.primary}><Text style={styles.primaryText}>{saving ? 'Saving…' : customerId ? 'Save changes' : 'Add customer'}</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
function Field({ label, value, onChangeText, theme, card, border, numeric }: { label: string; value: string; onChangeText: (value: string) => void; theme: string; card: string; border: string; numeric?: boolean }) { return <View style={styles.field}><Text style={[styles.label, { color: theme }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType={numeric ? 'phone-pad' : 'default'} style={[styles.input, { color: theme, backgroundColor: card, borderColor: border }]} /></View>; }
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 19, paddingBottom: 34 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, title: { fontSize: 20, fontWeight: '800' }, field: { marginBottom: 14 }, label: { fontSize: 12, fontWeight: '800', marginBottom: 6 }, input: { minHeight: 47, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 }, hint: { color: '#958C9F', fontSize: 11 }, error: { color: '#C92A2A', marginTop: 9 }, primary: { backgroundColor: '#8055D8', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 18 }, primaryText: { color: 'white', fontWeight: '800' } });
