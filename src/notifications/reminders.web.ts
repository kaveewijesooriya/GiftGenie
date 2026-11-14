import type { ProductRecord } from '@/database/repository';

export async function requestLocalNotificationPermission(): Promise<boolean> { return false; }
export async function syncOrderReminders(_orderId: string, _orderNumber: string, _dueAt: string | null, _closed = false): Promise<void> { return; }
export async function syncLowStockAlerts(_products: ProductRecord[]): Promise<void> { return; }
export async function syncAllReminders(): Promise<void> { return; }
export async function cancelAllGiftGenieReminders(): Promise<void> { return; }
