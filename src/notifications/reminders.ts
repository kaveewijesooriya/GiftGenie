import AsyncStorage from '@react-native-async-storage/async-storage';
import { AndroidImportance } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getDatabase } from '@/database';
import type { ProductRecord } from '@/database/repository';

const ORDER_IDS = '@giftgenie_order_notification_ids';
const STOCK_IDS = '@giftgenie_stock_notification_ids';
const ACTIVE_LOW_STOCK = '@giftgenie_active_low_stock';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

async function allowed(): Promise<boolean> {
  if (Platform.OS === 'web' || (await AsyncStorage.getItem('@giftgenie_notifications')) === 'false') return false;
  const permission = await Notifications.getPermissionsAsync();
  return permission.granted;
}

export async function requestLocalNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('shop-reminders', { name: 'Shop reminders', importance: AndroidImportance.DEFAULT });
    const permission = await Notifications.getPermissionsAsync();
    if (permission.granted) return true;
    if (permission.status === 'denied') return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch { return false; }
}

async function readMap(key: string): Promise<Record<string, string[]>> {
  try { const value = await AsyncStorage.getItem(key); const parsed: unknown = value ? JSON.parse(value) : {}; return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, string[]> : {}; }
  catch { return {}; }
}

async function cancelKey(key: string, storageKey: string): Promise<void> {
  const map = await readMap(storageKey); const identifiers = map[key] ?? [];
  await Promise.all(identifiers.map((identifier) => Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined)));
  delete map[key]; await AsyncStorage.setItem(storageKey, JSON.stringify(map));
}

async function storeIds(storageKey: string, key: string, identifiers: string[]): Promise<void> {
  const map = await readMap(storageKey); map[key] = identifiers; await AsyncStorage.setItem(storageKey, JSON.stringify(map));
}

export async function syncOrderReminders(orderId: string, orderNumber: string, dueAt: string | null, closed = false): Promise<void> {
  try {
    await cancelKey(orderId, ORDER_IDS);
    if (!dueAt || closed || !(await allowed())) return;
    const due = new Date(dueAt).getTime(); if (!Number.isFinite(due)) return;
    const identifiers: string[] = [];
    const reminderAt = due - 3 * 24 * 60 * 60 * 1000;
    if (reminderAt > Date.now()) identifiers.push(await Notifications.scheduleNotificationAsync({ content: { title: `Order ${orderNumber} is coming up`, body: 'This order is due in three days. Check that it is on track.', data: { route: `/orders/${orderId}` } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminderAt), channelId: 'shop-reminders' } }));
    const overdueAt = due + 24 * 60 * 60 * 1000;
    if (overdueAt > Date.now()) identifiers.push(await Notifications.scheduleNotificationAsync({ content: { title: `Order ${orderNumber} may be overdue`, body: 'Review this order and update its status.', data: { route: `/orders/${orderId}` } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(overdueAt), channelId: 'shop-reminders' } }));
    await storeIds(ORDER_IDS, orderId, identifiers);
  } catch (error) { console.warn('Could not sync order reminders:', error); }
}

export async function syncLowStockAlerts(products: ProductRecord[]): Promise<void> {
  try {
    const active = new Set<string>(); const existing = await readMap(STOCK_IDS); const alreadyLow = new Set(await readActiveLowStock());
    const permission = await allowed();
    for (const product of products) {
      const key = product.id; const low = product.active && product.stockQuantity - product.reservedQuantity <= product.lowStockThreshold;
      if (!low) { delete existing[key]; await cancelKey(key, STOCK_IDS); continue; }
      active.add(key);
      if (alreadyLow.has(key) || !permission) continue;
      const identifier = await Notifications.scheduleNotificationAsync({ content: { title: 'GiftGenie low-stock alert', body: `${product.name} has ${product.stockQuantity - product.reservedQuantity} available. Restock when needed.`, data: { route: '/(tabs)/inventory' } }, trigger: null });
      existing[key] = [identifier]; alreadyLow.add(key);
    }
    for (const key of alreadyLow) if (!active.has(key)) { alreadyLow.delete(key); await cancelKey(key, STOCK_IDS); }
    await AsyncStorage.setItem(ACTIVE_LOW_STOCK, JSON.stringify(Array.from(alreadyLow)));
    await AsyncStorage.setItem(STOCK_IDS, JSON.stringify(existing));
  } catch (error) { console.warn('Could not sync low-stock reminders:', error); }
}

async function readActiveLowStock(): Promise<string[]> {
  try { const parsed: unknown = JSON.parse((await AsyncStorage.getItem(ACTIVE_LOW_STOCK)) ?? '[]'); return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []; }
  catch { return []; }
}

export async function syncAllReminders(): Promise<void> {
  if (!(await allowed())) return;
  try {
    const db = await getDatabase();
    const orders = await db.getAllAsync<{ id: string; order_number: string; due_at: string | null; status: string }>("SELECT id, order_number, due_at, status FROM orders WHERE status NOT IN ('completed', 'cancelled') AND due_at IS NOT NULL");
    const products = await db.getAllAsync<{ id: string; sku: string | null; name: string; category_name: string | null; description: string; cost_price: number; selling_price: number; stock_quantity: number; reserved_quantity: number; low_stock_threshold: number; recipient_tags: string; occasion_tags: string; active: number; emoji: string; created_at: string; updated_at: string }>('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.active = 1');
    for (const order of orders) await syncOrderReminders(order.id, order.order_number, order.due_at);
    await syncLowStockAlerts(products.map((row) => ({ id: row.id, sku: row.sku ?? '', name: row.name, category: row.category_name ?? '', description: row.description, costPrice: row.cost_price, sellingPrice: row.selling_price, stockQuantity: row.stock_quantity, reservedQuantity: row.reserved_quantity, lowStockThreshold: row.low_stock_threshold, recipientTags: JSON.parse(row.recipient_tags) as string[], occasionTags: JSON.parse(row.occasion_tags) as string[], active: row.active === 1, emoji: row.emoji, createdAt: row.created_at, updatedAt: row.updated_at })));
  } catch (error) { console.warn('Could not restore scheduled reminders:', error); }
}

export async function cancelAllGiftGenieReminders(): Promise<void> {
  const [orders, stock] = await Promise.all([readMap(ORDER_IDS), readMap(STOCK_IDS)]);
  const identifiers = [...Object.values(orders), ...Object.values(stock)].flat();
  await Promise.all(identifiers.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  await Promise.all([AsyncStorage.removeItem(ORDER_IDS), AsyncStorage.removeItem(STOCK_IDS), AsyncStorage.removeItem(ACTIVE_LOW_STOCK)]);
}
