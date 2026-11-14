import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '@/context/appearance-context';
import { Colors } from '@/constants/theme';
import { getDatabase } from '@/database';
import { DATABASE_VERSION } from '@/database/migrations';

const TABLES = [
  { name: 'categories', columns: ['id', 'name', 'color', 'created_at'] },
  { name: 'products', columns: ['id', 'sku', 'name', 'category_id', 'description', 'cost_price', 'selling_price', 'stock_quantity', 'reserved_quantity', 'low_stock_threshold', 'recipient_tags', 'occasion_tags', 'photo_uri', 'active', 'emoji', 'created_at', 'updated_at'] },
  { name: 'customers', columns: ['id', 'name', 'phone', 'normalized_phone', 'email', 'address', 'notes', 'created_at'] },
  { name: 'orders', columns: ['id', 'order_number', 'customer_id', 'status', 'priority', 'due_at', 'notes', 'subtotal', 'discount', 'total', 'reserved_at', 'completed_at', 'created_at', 'updated_at'] },
  { name: 'gift_bundles', columns: ['id', 'name', 'description', 'selling_price', 'discount', 'occasion_tags', 'recipient_tags', 'active', 'created_at', 'updated_at'] },
  { name: 'gift_bundle_items', columns: ['id', 'bundle_id', 'product_id', 'quantity'] },
  { name: 'order_items', columns: ['id', 'order_id', 'product_id', 'bundle_id', 'bundle_line_id', 'item_name', 'quantity', 'unit_price', 'unit_cost'] },
  { name: 'sales', columns: ['id', 'order_id', 'customer_id', 'total', 'cost_total', 'payment_method', 'notes', 'sold_at'] },
  { name: 'sale_items', columns: ['id', 'sale_id', 'product_id', 'bundle_id', 'item_name', 'quantity', 'unit_price', 'unit_cost'] },
  { name: 'stock_movements', columns: ['id', 'product_id', 'movement_type', 'quantity_delta', 'quantity_after', 'reference_id', 'note', 'created_at'] },
  { name: 'expenses', columns: ['id', 'title', 'category', 'amount', 'notes', 'spent_at', 'created_at'] },
  { name: 'settings', columns: ['key', 'value', 'updated_at'] },
] as const;

type BackupData = Record<(typeof TABLES)[number]['name'], Record<string, unknown>[]>;
type BackupFile = { app: 'GiftGenie'; schemaVersion: number; exportedAt: string; data: BackupData; preferences: { appearance: string; currency: string; notifications: string } };

function validBackup(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false;
  const backup = value as Partial<BackupFile>;
  if (backup.app !== 'GiftGenie' || backup.schemaVersion !== DATABASE_VERSION || !backup.data || typeof backup.data !== 'object' || !backup.preferences || typeof backup.preferences !== 'object') return false;
  if (!['light', 'dark', 'system'].includes(backup.preferences.appearance) || !/^[A-Z]{3}$/.test(backup.preferences.currency) || !['true', 'false'].includes(backup.preferences.notifications)) return false;
  return TABLES.every(({ name }) => Array.isArray(backup.data?.[name]) && (backup.data?.[name] as unknown[]).every((row) => row !== null && typeof row === 'object' && !Array.isArray(row)));
}

export default function BackupRestoreScreen() {
  const router = useRouter(); const { isDark } = useAppearance(); const theme = Colors[isDark ? 'dark' : 'light']; const card = isDark ? '#252238' : '#FFFFFF'; const border = isDark ? '#393044' : '#EEE8F6';
  const [loading, setLoading] = useState(false); const [backupBeforeRestore, setBackupBeforeRestore] = useState(true); const [message, setMessage] = useState('');

  async function makeBackup(share: boolean): Promise<string> {
    const db = await getDatabase(); const data = {} as BackupData;
    for (const table of TABLES) {
      const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table.name}`);
      data[table.name] = rows;
    }
    const [appearance, currency, notifications] = await Promise.all([AsyncStorage.getItem('@giftgenie_appearance'), AsyncStorage.getItem('@giftgenie_currency'), AsyncStorage.getItem('@giftgenie_notifications')]);
    const backup: BackupFile = { app: 'GiftGenie', schemaVersion: DATABASE_VERSION, exportedAt: new Date().toISOString(), data, preferences: { appearance: appearance ?? 'system', currency: currency ?? 'LKR', notifications: notifications ?? 'true' } };
    const stamp = new Date().toISOString().replace(/[:.]/g, '-'); const fileName = `GiftGenie-backup-${stamp}.json`;
    if (Platform.OS === 'web' || !FileSystem.documentDirectory) throw new Error('JSON file export requires the GiftGenie mobile app.');
    const uri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
    if (share) {
      if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is not available on this device.');
      await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Save GiftGenie backup', UTI: 'public.json' });
    }
    return uri;
  }

  async function exportBackup() {
    setLoading(true); setMessage('Preparing your local backup…');
    try { await makeBackup(true); setMessage('Backup file is ready. Save it somewhere safe.'); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : 'Backup could not be created.'); }
    finally { setLoading(false); }
  }

  async function importBackup() {
    setMessage('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/json', 'public.json'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets[0]) return;
      setLoading(true);
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
      const parsed: unknown = JSON.parse(text);
      if (!validBackup(parsed)) throw new Error(`This is not a supported GiftGenie backup (expected schema version ${DATABASE_VERSION}).`);
      if (backupBeforeRestore) await makeBackup(true);
      Alert.alert('Restore this backup?', 'Restoring replaces all current business records on this device. Make sure you have saved the selected file.', [
        { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
        { text: 'Replace data', style: 'destructive', onPress: () => { void restoreData(parsed).then(async () => { const pref = parsed.preferences; await Promise.all([AsyncStorage.setItem('@giftgenie_appearance', pref.appearance), AsyncStorage.setItem('@giftgenie_currency', pref.currency), AsyncStorage.setItem('@giftgenie_notifications', pref.notifications)]); setMessage('Backup restored successfully. Return to the dashboard to reload the saved data.'); }).catch((caught: unknown) => setMessage(caught instanceof Error ? `Restore failed: ${caught.message}` : 'Restore failed. Your previous data was kept.')).finally(() => setLoading(false)); } },
      ]);
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'The selected file could not be read.'); setLoading(false); }
  }

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()}><Text style={{ color: '#8055D8', fontWeight: '800' }}>‹ Back</Text></Pressable><Text style={[styles.title, { color: theme.text }]}>Backup & Restore</Text><View style={{ width: 35 }} /></View>
    <View style={[styles.hero, { backgroundColor: card, borderColor: border }]}><View style={styles.icon}><Text style={{ fontSize: 26 }}>🛡️</Text></View><Text style={[styles.heroTitle, { color: theme.text }]}>Your shop data stays yours</Text><Text style={styles.hint}>Backups are JSON files saved and shared locally from this device. Nothing is uploaded.</Text></View>
    <Text style={[styles.section, { color: theme.text }]}>Create a backup</Text><View style={[styles.panel, { backgroundColor: card, borderColor: border }]}><Text style={[styles.panelTitle, { color: theme.text }]}>Export business data</Text><Text style={styles.hint}>Includes products, customers, orders, sales, bundles, stock movements, expenses and app settings. Schema version {DATABASE_VERSION}.</Text><Pressable disabled={loading} onPress={() => void exportBackup()} style={[styles.primary, loading && { opacity: .6 }]}><Text style={styles.primaryText}>{loading ? 'Please wait…' : 'Create & share backup'}</Text></Pressable></View>
    <Text style={[styles.section, { color: theme.text }]}>Restore a backup</Text><View style={[styles.panel, { backgroundColor: card, borderColor: border }]}><Text style={[styles.panelTitle, { color: theme.text }]}>Replace business data</Text><Text style={styles.hint}>Choose a valid GiftGenie JSON file. The app validates the schema before showing a replacement confirmation. A restore is applied in one database transaction.</Text><View style={styles.backupRow}><View style={{ flex: 1 }}><Text style={[styles.panelTitle, { color: theme.text, fontSize: 12 }]}>Create safety backup first</Text><Text style={styles.hint}>Saves a backup copy locally before replacing data.</Text></View><Switch value={backupBeforeRestore} onValueChange={setBackupBeforeRestore} trackColor={{ true: '#8055D8' }} /></View><Pressable disabled={loading} onPress={() => void importBackup()} style={[styles.secondary, loading && { opacity: .6 }]}><Text style={styles.secondaryText}>{loading ? 'Please wait…' : 'Choose backup file'}</Text></Pressable></View>
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </ScrollView></SafeAreaView>;
}

async function restoreData(backup: BackupFile) {
  const db = await getDatabase();
  const insertOrder = [...TABLES];
  const deleteOrder = [...insertOrder].reverse();
  await db.withTransactionAsync(async () => {
    for (const table of deleteOrder) await db.runAsync(`DELETE FROM ${table.name}`);
    for (const table of insertOrder) {
      const rows = backup.data[table.name]; const columns = [...table.columns];
      for (const row of rows) {
        const values = columns.map((column) => (row[column] ?? null) as string | number | null | Uint8Array);
        const placeholders = columns.map(() => '?').join(', ');
        await db.runAsync(`INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${placeholders})`, values);
      }
    }
  });
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 19, paddingBottom: 36 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, title: { fontSize: 18, fontWeight: '800' }, hero: { alignItems: 'center', padding: 19, borderRadius: 18, borderWidth: 1 }, icon: { width: 57, height: 57, backgroundColor: '#F0E8FF', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, heroTitle: { fontSize: 16, fontWeight: '800', marginTop: 11 }, hint: { color: '#958C9F', fontSize: 11, lineHeight: 17, marginTop: 6 }, section: { fontSize: 16, fontWeight: '800', marginTop: 22, marginBottom: 9 }, panel: { borderWidth: 1, borderRadius: 16, padding: 14 }, panelTitle: { fontSize: 14, fontWeight: '800' }, primary: { backgroundColor: '#8055D8', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 14 }, primaryText: { color: 'white', fontSize: 12, fontWeight: '800' }, backupRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 }, secondary: { borderWidth: 1, borderColor: '#8055D8', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 14 }, secondaryText: { color: '#8055D8', fontSize: 12, fontWeight: '800' }, message: { color: '#8055D8', fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: 'center' } });
