import { getDatabase, runInTransaction } from './index';

export type ProductInput = {
  name: string;
  sku?: string;
  category: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  recipientTags: string[];
  occasionTags: string[];
  photoUri?: string | null;
};

export type ProductRecord = ProductInput & {
  id: string;
  reservedQuantity: number;
  active: boolean;
  emoji: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSummary = {
  productCount: number;
  lowStockCount: number;
  openOrderCount: number;
  salesToday: number;
  recentOrders: { id: string; orderNumber: string; status: string; total: number }[];
  lowStockProducts: { id: string; name: string; available: number; threshold: number }[];
};

type ProductRow = {
  id: string;
  sku: string | null;
  name: string;
  category_name: string | null;
  description: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  recipient_tags: string;
  occasion_tags: string;
  photo_uri: string | null;
  active: number;
  emoji: string;
  created_at: string;
  updated_at: string;
};

const now = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function mapProduct(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    sku: row.sku ?? '',
    name: row.name,
    category: row.category_name ?? '',
    description: row.description,
    costPrice: row.cost_price,
    sellingPrice: row.selling_price,
    stockQuantity: row.stock_quantity,
    reservedQuantity: row.reserved_quantity,
    lowStockThreshold: row.low_stock_threshold,
    recipientTags: JSON.parse(row.recipient_tags) as string[],
    occasionTags: JSON.parse(row.occasion_tags) as string[],
    photoUri: row.photo_uri,
    active: row.active === 1,
    emoji: row.emoji,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureCategory(categoryName: string): Promise<string | null> {
  const name = categoryName.trim();
  if (!name) return null;
  const db = await getDatabase();
  const found = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM categories WHERE name = ? COLLATE NOCASE', name
  );
  if (found) return found.id;
  const id = newId('cat');
  await db.runAsync('INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)', id, name, now());
  return id;
}

export async function listProducts(search = ''): Promise<ProductRecord[]> {
  const db = await getDatabase();
  const query = `%${search.trim()}%`;
  const rows = await db.getAllAsync<ProductRow>(
    `SELECT p.*, c.name AS category_name FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.active = 1 AND (p.name LIKE ? COLLATE NOCASE OR COALESCE(p.sku, '') LIKE ? COLLATE NOCASE)
     ORDER BY p.name COLLATE NOCASE`, query, query
  );
  return rows.map(mapProduct);
}

export async function saveProduct(input: ProductInput, existingId?: string): Promise<void> {
  if (!input.name.trim()) throw new Error('Enter a product name.');
  if (input.costPrice < 0 || input.sellingPrice < 0 || input.stockQuantity < 0) throw new Error('Prices and stock cannot be negative.');
  const id = existingId ?? newId('prd');
  const timestamp = now();
  await runInTransaction(async (db) => {
    const categoryId = await ensureCategory(input.category);
    if (existingId) {
      const previous = await db.getFirstAsync<{ stock_quantity: number; reserved_quantity: number }>('SELECT stock_quantity, reserved_quantity FROM products WHERE id = ?', existingId);
      if (!previous) throw new Error('Product no longer exists.');
      if (input.stockQuantity < previous.reserved_quantity) throw new Error('Stock cannot be lower than reserved stock.');
      await db.runAsync(
        `UPDATE products SET sku = ?, name = ?, category_id = ?, description = ?, cost_price = ?, selling_price = ?,
         stock_quantity = ?, low_stock_threshold = ?, recipient_tags = ?, occasion_tags = ?, photo_uri = ?, updated_at = ? WHERE id = ?`,
        input.sku?.trim() || null, input.name.trim(), categoryId, input.description?.trim() ?? '', input.costPrice,
        input.sellingPrice, input.stockQuantity, input.lowStockThreshold,
        JSON.stringify(input.recipientTags), JSON.stringify(input.occasionTags), input.photoUri ?? null, timestamp, id
      );
      const movement = input.stockQuantity - previous.stock_quantity;
      if (movement !== 0) await db.runAsync(
        `INSERT INTO stock_movements (id, product_id, movement_type, quantity_delta, quantity_after, note, created_at)
         VALUES (?, ?, ?, ?, ?, 'Stock adjusted while editing product', ?)`, newId('mov'), id, movement > 0 ? 'restock' : 'adjustment', movement, input.stockQuantity, timestamp
      );
    } else {
      await db.runAsync(
        `INSERT INTO products (id, sku, name, category_id, description, cost_price, selling_price, stock_quantity,
         low_stock_threshold, recipient_tags, occasion_tags, photo_uri, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, input.sku?.trim() || null, input.name.trim(), categoryId, input.description?.trim() ?? '', input.costPrice,
        input.sellingPrice, input.stockQuantity, input.lowStockThreshold,
        JSON.stringify(input.recipientTags), JSON.stringify(input.occasionTags), input.photoUri ?? null, timestamp, timestamp
      );
      if (input.stockQuantity > 0) {
        await db.runAsync(
          `INSERT INTO stock_movements (id, product_id, movement_type, quantity_delta, quantity_after, note, created_at)
           VALUES (?, ?, 'restock', ?, ?, 'Opening stock', ?)`, newId('mov'), id, input.stockQuantity, input.stockQuantity, timestamp
        );
      }
    }
  });
}

export async function updateStock(product: ProductRecord, delta: number, note: string): Promise<void> {
  if (!Number.isSafeInteger(delta) || delta === 0) throw new Error('Enter a non-zero whole-number adjustment.');
  await runInTransaction(async (db) => {
    const current = await db.getFirstAsync<{ stock_quantity: number; reserved_quantity: number }>(
      'SELECT stock_quantity, reserved_quantity FROM products WHERE id = ?', product.id
    );
    if (!current) throw new Error('Product no longer exists.');
    const next = current.stock_quantity + delta;
    if (next < current.reserved_quantity) throw new Error('Stock cannot be lower than reserved stock.');
    await db.runAsync('UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?', next, now(), product.id);
    await db.runAsync(
      `INSERT INTO stock_movements (id, product_id, movement_type, quantity_delta, quantity_after, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, newId('mov'), product.id, delta > 0 ? 'restock' : 'adjustment', delta, next, note.trim(), now()
    );
  });
}

export async function archiveProduct(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE products SET active = 0, updated_at = ? WHERE id = ?', now(), id);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const db = await getDatabase();
  const [products, lowStock, openOrders, sales, recentOrders, lowProducts] = await Promise.all([
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM products WHERE active = 1'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM products WHERE active = 1 AND stock_quantity - reserved_quantity <= low_stock_threshold'),
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM orders WHERE status NOT IN ('completed', 'cancelled')"),
    db.getFirstAsync<{ total: number }>("SELECT COALESCE(SUM(total), 0) AS total FROM sales WHERE date(sold_at) = date('now', 'localtime')"),
    db.getAllAsync<DashboardSummary['recentOrders'][number]>(
      'SELECT id, order_number AS orderNumber, status, total FROM orders ORDER BY created_at DESC LIMIT 4'
    ),
    db.getAllAsync<{ id: string; name: string; available: number; threshold: number }>(
      'SELECT id, name, stock_quantity - reserved_quantity AS available, low_stock_threshold AS threshold FROM products WHERE active = 1 AND stock_quantity - reserved_quantity <= low_stock_threshold ORDER BY available ASC LIMIT 4'
    ),
  ]);
  return {
    productCount: products?.count ?? 0,
    lowStockCount: lowStock?.count ?? 0,
    openOrderCount: openOrders?.count ?? 0,
    salesToday: sales?.total ?? 0,
    recentOrders,
    lowStockProducts: lowProducts,
  };
}

export async function listStockMovements(productId: string) {
  const db = await getDatabase();
  return db.getAllAsync<{ id: string; movement_type: string; quantity_delta: number; quantity_after: number; note: string; created_at: string }>(
    'SELECT id, movement_type, quantity_delta, quantity_after, note, created_at FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC', productId
  );
}

export type CustomerInput = { name: string; phone: string; email?: string; address?: string; notes?: string };
export type CustomerRecord = CustomerInput & { id: string; createdAt: string; orderCount: number; totalSpent: number; lastPurchase: string | null };

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
}

export async function listCustomers(search = ''): Promise<CustomerRecord[]> {
  const db = await getDatabase();
  const query = `%${search.trim()}%`;
  const rows = await db.getAllAsync<{ id: string; name: string; phone: string; email: string | null; address: string | null; notes: string; created_at: string; order_count: number; total_spent: number; last_purchase: string | null }>(
    `SELECT c.id, c.name, c.phone, c.email, c.address, c.notes, c.created_at,
       COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) AS order_count,
       COALESCE(SUM(CASE WHEN s.id IS NOT NULL THEN s.total ELSE 0 END), 0) AS total_spent,
       MAX(s.sold_at) AS last_purchase
     FROM customers c LEFT JOIN orders o ON o.customer_id = c.id LEFT JOIN sales s ON s.customer_id = c.id
     WHERE c.name LIKE ? COLLATE NOCASE OR c.phone LIKE ?
     GROUP BY c.id ORDER BY c.name COLLATE NOCASE`, query, query
  );
  return rows.map((row) => ({ id: row.id, name: row.name, phone: row.phone, email: row.email ?? '', address: row.address ?? '', notes: row.notes, createdAt: row.created_at, orderCount: row.order_count, totalSpent: row.total_spent, lastPurchase: row.last_purchase }));
}

export async function saveCustomer(input: CustomerInput, id?: string): Promise<string> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const normalized = normalizePhone(phone);
  if (!name || !normalized) throw new Error('Customer name and phone number are required.');
  const customerId = id ?? newId('cus');
  await runInTransaction(async (db) => {
    const duplicate = await db.getFirstAsync<{ id: string }>('SELECT id FROM customers WHERE normalized_phone = ? AND id != ?', normalized, customerId);
    if (duplicate) throw new Error('A customer with this phone number already exists.');
    if (id) await db.runAsync('UPDATE customers SET name = ?, phone = ?, normalized_phone = ?, email = ?, address = ?, notes = ? WHERE id = ?', name, phone, normalized, input.email?.trim() || null, input.address?.trim() || null, input.notes?.trim() ?? '', customerId);
    else await db.runAsync('INSERT INTO customers (id, name, phone, normalized_phone, email, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', customerId, name, phone, normalized, input.email?.trim() || null, input.address?.trim() || null, input.notes?.trim() ?? '', now());
  });
  return customerId;
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM customers WHERE id = ?', id);
}

export async function getCustomerOrders(customerId: string) {
  const db = await getDatabase();
  return db.getAllAsync<{ id: string; order_number: string; status: string; total: number; created_at: string; items: string }>(
    `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
       COALESCE(GROUP_CONCAT(oi.item_name || ' × ' || oi.quantity, ', '), '') AS items
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id WHERE o.customer_id = ?
     GROUP BY o.id ORDER BY o.created_at DESC`, customerId
  );
}

export type OrderLineInput = { productId: string; quantity: number };
export type BundleLineInput = { bundleId: string; quantity: number };
export type OrderRecord = { id: string; orderNumber: string; status: string; priority: string; dueAt: string | null; total: number; customerName: string | null; createdAt: string };

type SnapshotLine = { productId: string; name: string; quantity: number; price: number; cost: number };

async function makeSnapshots(db: Awaited<ReturnType<typeof getDatabase>>, lines: OrderLineInput[], bundles: BundleLineInput[] = []) {
  const snapshots: SnapshotLine[] = [];
  let bundleTotal = 0;
  for (const line of lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) throw new Error('Item quantities must be positive whole numbers.');
    const product = await db.getFirstAsync<{ id: string; name: string; selling_price: number; cost_price: number }>('SELECT id, name, selling_price, cost_price FROM products WHERE id = ? AND active = 1', line.productId);
    if (!product) throw new Error('One of the selected products is unavailable.');
    snapshots.push({ productId: line.productId, name: product.name, quantity: line.quantity, price: product.selling_price, cost: product.cost_price });
  }
  for (const line of bundles) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) throw new Error('Bundle quantities must be positive whole numbers.');
    const bundle = await db.getFirstAsync<{ name: string; selling_price: number; discount: number; active: number }>('SELECT name, selling_price, discount, active FROM gift_bundles WHERE id = ?', line.bundleId);
    if (!bundle || bundle.active !== 1) throw new Error('One of the selected bundles is unavailable.');
    const parts = await db.getAllAsync<{ product_id: string; name: string; quantity: number; selling_price: number; cost_price: number }>('SELECT bi.product_id, p.name, bi.quantity, p.selling_price, p.cost_price FROM gift_bundle_items bi JOIN products p ON p.id = bi.product_id WHERE bi.bundle_id = ?', line.bundleId);
    if (!parts.length) throw new Error(`The bundle “${bundle.name}” has no components.`);
    const totalCost = parts.reduce((sum, part) => sum + part.cost_price * part.quantity, 0);
    const netPrice = Math.max(0, bundle.selling_price - bundle.discount);
    bundleTotal += netPrice * line.quantity;
    for (const part of parts) {
      const partCostTotal = part.cost_price * part.quantity;
      const allocatedTotal = totalCost > 0
        ? netPrice * partCostTotal / totalCost
        : netPrice * part.quantity / parts.reduce((sum, entry) => sum + entry.quantity, 0);
      snapshots.push({ productId: part.product_id, name: `${bundle.name} · ${part.name}`, quantity: part.quantity * line.quantity, price: part.quantity ? allocatedTotal / part.quantity : 0, cost: part.cost_price });
    }
  }
  const requested = new Map<string, number>();
  for (const item of snapshots) requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
  for (const [productId, quantity] of requested) {
    const product = await db.getFirstAsync<{ name: string; stock_quantity: number; reserved_quantity: number }>('SELECT name, stock_quantity, reserved_quantity FROM products WHERE id = ?', productId);
    if (!product || product.stock_quantity - product.reserved_quantity < quantity) throw new Error(`Not enough available stock for ${product?.name ?? 'one of the selected products'}.`);
  }
  const productTotal = snapshots.slice(0, lines.length).reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { snapshots, total: productTotal + bundleTotal };
}

export async function listOrders(): Promise<OrderRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; order_number: string; status: string; priority: string; due_at: string | null; total: number; customer_name: string | null; created_at: string }>(
    'SELECT o.id, o.order_number, o.status, o.priority, o.due_at, o.total, c.name AS customer_name, o.created_at FROM orders o LEFT JOIN customers c ON c.id = o.customer_id ORDER BY CASE o.priority WHEN \'emergency\' THEN 0 ELSE 1 END, o.created_at DESC'
  );
  return rows.map((row) => ({ id: row.id, orderNumber: row.order_number, status: row.status, priority: row.priority, dueAt: row.due_at, total: row.total, customerName: row.customer_name, createdAt: row.created_at }));
}

export async function createOrder(input: { customerId?: string; priority: 'normal' | 'emergency'; dueAt?: string; notes?: string; lines: OrderLineInput[]; bundles?: BundleLineInput[] }): Promise<string> {
  if (!input.lines.length && !input.bundles?.length) throw new Error('Add at least one product or bundle to the order.');
  const id = newId('ord');
  await runInTransaction(async (db) => {
    const number = `GG-${Date.now().toString().slice(-7)}`;
    const { snapshots, total } = await makeSnapshots(db, input.lines, input.bundles);
    const timestamp = now();
    await db.runAsync('INSERT INTO orders (id, order_number, customer_id, status, priority, due_at, notes, subtotal, total, created_at, updated_at) VALUES (?, ?, ?, \'pending\', ?, ?, ?, ?, ?, ?, ?)', id, number, input.customerId ?? null, input.priority, input.dueAt ?? null, input.notes?.trim() ?? '', total, total, timestamp, timestamp);
    for (const item of snapshots) await db.runAsync('INSERT INTO order_items (id, order_id, product_id, item_name, quantity, unit_price, unit_cost) VALUES (?, ?, ?, ?, ?, ?, ?)', newId('oli'), id, item.productId, item.name, item.quantity, item.price, item.cost);
  });
  return id;
}

export async function setOrderStatus(orderId: string, nextStatus: 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'): Promise<void> {
  await runInTransaction(async (db) => {
    const order = await db.getFirstAsync<{ status: string; reserved_at: string | null; completed_at: string | null }>('SELECT status, reserved_at, completed_at FROM orders WHERE id = ?', orderId);
    if (!order) throw new Error('Order not found.');
    if (order.status === 'completed' || order.status === 'cancelled') throw new Error('This order is already closed.');
    if (nextStatus === 'completed' && order.completed_at) throw new Error('This order has already been deducted from stock.');
    const validNext: Record<string, string[]> = { pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled', 'completed'], preparing: ['ready', 'cancelled', 'completed'], ready: ['completed', 'cancelled'] };
    if (!validNext[order.status]?.includes(nextStatus)) throw new Error('Move the order through its current status before this update.');
    const items = await db.getAllAsync<{ product_id: string; item_name: string; quantity: number; unit_price: number; unit_cost: number }>('SELECT product_id, item_name, quantity, unit_price, unit_cost FROM order_items WHERE order_id = ?', orderId);
    if (nextStatus === 'confirmed' && !order.reserved_at) {
      for (const item of items) {
        const product = await db.getFirstAsync<{ stock_quantity: number; reserved_quantity: number }>('SELECT stock_quantity, reserved_quantity FROM products WHERE id = ?', item.product_id);
        if (!product || product.stock_quantity - product.reserved_quantity < item.quantity) throw new Error(`Not enough stock for ${item.item_name}.`);
      }
      for (const item of items) await db.runAsync('UPDATE products SET reserved_quantity = reserved_quantity + ? WHERE id = ?', item.quantity, item.product_id);
      await db.runAsync('UPDATE orders SET reserved_at = ? WHERE id = ?', now(), orderId);
    }
    if (nextStatus === 'cancelled' && order.reserved_at) {
      for (const item of items) await db.runAsync('UPDATE products SET reserved_quantity = reserved_quantity - ? WHERE id = ? AND reserved_quantity >= ?', item.quantity, item.product_id, item.quantity);
      await db.runAsync('UPDATE orders SET reserved_at = NULL WHERE id = ?', orderId);
    }
    if (nextStatus === 'completed') {
      if (!order.reserved_at) {
        for (const item of items) {
          const product = await db.getFirstAsync<{ stock_quantity: number; reserved_quantity: number }>('SELECT stock_quantity, reserved_quantity FROM products WHERE id = ?', item.product_id);
          if (!product || product.stock_quantity - product.reserved_quantity < item.quantity) throw new Error(`Not enough stock for ${item.item_name}.`);
        }
      }
      for (const item of items) {
        const product = await db.getFirstAsync<{ stock_quantity: number; reserved_quantity: number }>('SELECT stock_quantity, reserved_quantity FROM products WHERE id = ?', item.product_id);
        if (!product || product.stock_quantity < item.quantity || (order.reserved_at && product.reserved_quantity < item.quantity)) throw new Error(`Stock reservation for ${item.item_name} is no longer valid.`);
        const after = product.stock_quantity - item.quantity;
        const reservedAfter = order.reserved_at ? product.reserved_quantity - item.quantity : product.reserved_quantity;
        await db.runAsync('UPDATE products SET stock_quantity = ?, reserved_quantity = ?, updated_at = ? WHERE id = ?', after, reservedAfter, now(), item.product_id);
        await db.runAsync('INSERT INTO stock_movements (id, product_id, movement_type, quantity_delta, quantity_after, reference_id, note, created_at) VALUES (?, ?, \'order_complete\', ?, ?, ?, ?, ?)', newId('mov'), item.product_id, -item.quantity, after, orderId, 'Order completed', now());
      }
      const parent = await db.getFirstAsync<{ customer_id: string | null; total: number }>('SELECT customer_id, total FROM orders WHERE id = ?', orderId);
      const saleId = newId('sal');
      await db.runAsync('INSERT INTO sales (id, order_id, customer_id, total, cost_total, sold_at) VALUES (?, ?, ?, ?, ?, ?)', saleId, orderId, parent?.customer_id ?? null, parent?.total ?? 0, items.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0), now());
      for (const item of items) await db.runAsync('INSERT INTO sale_items (id, sale_id, product_id, item_name, quantity, unit_price, unit_cost) VALUES (?, ?, ?, ?, ?, ?, ?)', newId('sli'), saleId, item.product_id, item.item_name, item.quantity, item.unit_price, item.unit_cost);
    }
    await db.runAsync('UPDATE orders SET status = ?, completed_at = CASE WHEN ? = \'completed\' THEN ? ELSE completed_at END, updated_at = ? WHERE id = ?', nextStatus, nextStatus, now(), now(), orderId);
  });
}

export async function getOrderDetails(orderId: string) {
  const db = await getDatabase();
  const order = await db.getFirstAsync<{ id: string; order_number: string; status: string; priority: string; due_at: string | null; notes: string; total: number; subtotal: number; reserved_at: string | null; completed_at: string | null; customer_id: string | null; customer_name: string | null; customer_phone: string | null; created_at: string }>(
    `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE o.id = ?`, orderId
  );
  if (!order) return null;
  const items = await db.getAllAsync<{ id: string; product_id: string | null; item_name: string; quantity: number; unit_price: number; unit_cost: number }>('SELECT id, product_id, item_name, quantity, unit_price, unit_cost FROM order_items WHERE order_id = ? ORDER BY item_name', orderId);
  return { ...order, items };
}

export async function listSales() {
  const db = await getDatabase();
  return db.getAllAsync<{ id: string; total: number; cost_total: number; sold_at: string; customer_name: string | null; item_count: number }>(
    `SELECT s.id, s.total, s.cost_total, s.sold_at, c.name AS customer_name,
       COALESCE(SUM(si.quantity), 0) AS item_count FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       LEFT JOIN sale_items si ON si.sale_id = s.id GROUP BY s.id ORDER BY s.sold_at DESC`
  );
}

export async function createDirectSale(input: { customerId?: string; lines: OrderLineInput[]; bundles?: BundleLineInput[]; paymentMethod: string; notes?: string }): Promise<void> {
  if (!input.lines.length && !input.bundles?.length) throw new Error('Add at least one product or bundle to the sale.');
  await runInTransaction(async (db) => {
    const { snapshots, total } = await makeSnapshots(db, input.lines, input.bundles);
    const id = newId('sal'); const timestamp = now();
    await db.runAsync('INSERT INTO sales (id, customer_id, total, cost_total, payment_method, notes, sold_at) VALUES (?, ?, ?, ?, ?, ?, ?)', id, input.customerId ?? null, total, snapshots.reduce((sum, item) => sum + item.cost * item.quantity, 0), input.paymentMethod, input.notes?.trim() ?? '', timestamp);
    for (const item of snapshots) {
      const product = await db.getFirstAsync<{ stock_quantity: number }>('SELECT stock_quantity FROM products WHERE id = ?', item.productId);
      const after = (product?.stock_quantity ?? 0) - item.quantity;
      if (after < 0) throw new Error(`Not enough stock for ${item.name}.`);
      await db.runAsync('UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?', after, timestamp, item.productId);
      await db.runAsync('INSERT INTO sale_items (id, sale_id, product_id, item_name, quantity, unit_price, unit_cost) VALUES (?, ?, ?, ?, ?, ?, ?)', newId('sli'), id, item.productId, item.name, item.quantity, item.price, item.cost);
      await db.runAsync('INSERT INTO stock_movements (id, product_id, movement_type, quantity_delta, quantity_after, reference_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', newId('mov'), item.productId, item.name.includes(' · ') ? 'bundle_sale' : 'sale', -item.quantity, after, id, 'Direct sale', timestamp);
    }
  });
}

export type BundleInput = { name: string; description: string; sellingPrice: number; discount: number; occasionTags: string[]; recipientTags: string[]; active: boolean; items: OrderLineInput[] };
export type BundleRecord = BundleInput & { id: string; costTotal: number; components: { productId: string; productName: string; quantity: number; cost: number; available: number }[] };

export async function listBundles(): Promise<BundleRecord[]> {
  const db = await getDatabase();
  const bundles = await db.getAllAsync<{ id: string; name: string; description: string; selling_price: number; discount: number; occasion_tags: string; recipient_tags: string; active: number }>('SELECT * FROM gift_bundles ORDER BY name COLLATE NOCASE');
  const result: BundleRecord[] = [];
  for (const bundle of bundles) {
    const components = await db.getAllAsync<{ product_id: string; product_name: string; quantity: number; cost_price: number; available: number }>('SELECT bi.product_id, p.name AS product_name, bi.quantity, p.cost_price, p.stock_quantity - p.reserved_quantity AS available FROM gift_bundle_items bi JOIN products p ON p.id = bi.product_id WHERE bi.bundle_id = ? ORDER BY p.name', bundle.id);
    result.push({ id: bundle.id, name: bundle.name, description: bundle.description, sellingPrice: bundle.selling_price, discount: bundle.discount, occasionTags: JSON.parse(bundle.occasion_tags) as string[], recipientTags: JSON.parse(bundle.recipient_tags) as string[], active: bundle.active === 1, items: components.map((item) => ({ productId: item.product_id, quantity: item.quantity })), costTotal: components.reduce((sum, item) => sum + item.cost_price * item.quantity, 0), components: components.map((item) => ({ productId: item.product_id, productName: item.product_name, quantity: item.quantity, cost: item.cost_price, available: item.available })) });
  }
  return result;
}

export async function saveBundle(input: BundleInput, id?: string): Promise<void> {
  if (!input.name.trim()) throw new Error('Enter a bundle name.');
  if (input.sellingPrice < 0 || input.discount < 0 || input.discount > input.sellingPrice) throw new Error('Enter a valid selling price and discount.');
  if (!input.items.length || input.items.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1)) throw new Error('Add products and positive component quantities.');
  const components = Array.from(input.items.reduce((map, item) => map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity), new Map<string, number>()), ([productId, quantity]) => ({ productId, quantity }));
  const timestamp = now(); const bundleId = id ?? newId('bnd');
  await runInTransaction(async (db) => {
    if (id) await db.runAsync('UPDATE gift_bundles SET name = ?, description = ?, selling_price = ?, discount = ?, occasion_tags = ?, recipient_tags = ?, active = ?, updated_at = ? WHERE id = ?', input.name.trim(), input.description.trim(), input.sellingPrice, input.discount, JSON.stringify(input.occasionTags), JSON.stringify(input.recipientTags), input.active ? 1 : 0, timestamp, id);
    else await db.runAsync('INSERT INTO gift_bundles (id, name, description, selling_price, discount, occasion_tags, recipient_tags, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', bundleId, input.name.trim(), input.description.trim(), input.sellingPrice, input.discount, JSON.stringify(input.occasionTags), JSON.stringify(input.recipientTags), input.active ? 1 : 0, timestamp, timestamp);
    if (id) await db.runAsync('DELETE FROM gift_bundle_items WHERE bundle_id = ?', id);
    for (const item of components) await db.runAsync('INSERT INTO gift_bundle_items (id, bundle_id, product_id, quantity) VALUES (?, ?, ?, ?)', newId('bni'), bundleId, item.productId, item.quantity);
  });
}

export async function deleteBundle(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM gift_bundles WHERE id = ?', id);
}

export async function getAnalytics(startDate: string, endDate: string) {
  const db = await getDatabase();
  const totals = await db.getFirstAsync<{ sales: number; cost: number; sale_count: number; expenses: number; orders: number }>(
    `SELECT COALESCE((SELECT SUM(total) FROM sales WHERE date(sold_at) BETWEEN date(?) AND date(?)), 0) AS sales,
     COALESCE((SELECT SUM(cost_total) FROM sales WHERE date(sold_at) BETWEEN date(?) AND date(?)), 0) AS cost,
     (SELECT COUNT(*) FROM sales WHERE date(sold_at) BETWEEN date(?) AND date(?)) AS sale_count,
     COALESCE((SELECT SUM(amount) FROM expenses WHERE date(spent_at) BETWEEN date(?) AND date(?)), 0) AS expenses,
     (SELECT COUNT(*) FROM orders WHERE date(created_at) BETWEEN date(?) AND date(?)) AS orders`,
    startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate
  );
  const bestSellers = await db.getAllAsync<{ item_name: string; quantity: number; revenue: number }>(
    `SELECT si.item_name, SUM(si.quantity) AS quantity, SUM(si.quantity * si.unit_price) AS revenue
     FROM sale_items si JOIN sales s ON s.id = si.sale_id WHERE date(s.sold_at) BETWEEN date(?) AND date(?)
     GROUP BY si.item_name ORDER BY quantity DESC LIMIT 5`, startDate, endDate
  );
  const stock = await db.getFirstAsync<{ value: number; slow_count: number }>(
    `SELECT COALESCE(SUM((p.stock_quantity - p.reserved_quantity) * p.cost_price), 0) AS value,
     SUM(CASE WHEN p.active = 1 AND p.stock_quantity > 0 AND NOT EXISTS (SELECT 1 FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE si.product_id = p.id AND date(s.sold_at) >= date(?, '-90 days')) THEN 1 ELSE 0 END) AS slow_count FROM products p`, endDate
  );
  return { sales: totals?.sales ?? 0, cost: totals?.cost ?? 0, grossProfit: (totals?.sales ?? 0) - (totals?.cost ?? 0), expenses: totals?.expenses ?? 0, netProfit: (totals?.sales ?? 0) - (totals?.cost ?? 0) - (totals?.expenses ?? 0), saleCount: totals?.sale_count ?? 0, orderCount: totals?.orders ?? 0, stockValue: stock?.value ?? 0, slowMovingCount: stock?.slow_count ?? 0, bestSellers };
}

export async function listExpenses() {
  const db = await getDatabase();
  return db.getAllAsync<{ id: string; title: string; category: string; amount: number; spent_at: string; notes: string }>('SELECT id, title, category, amount, spent_at, notes FROM expenses ORDER BY spent_at DESC');
}

export async function saveExpense(input: { title: string; category: string; amount: number; spentAt: string; notes: string }): Promise<void> {
  if (!input.title.trim() || !Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Enter an expense title and a positive amount.');
  const db = await getDatabase(); const timestamp = now();
  await db.runAsync('INSERT INTO expenses (id, title, category, amount, notes, spent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', newId('exp'), input.title.trim(), input.category, input.amount, input.notes.trim(), input.spentAt, timestamp);
}
