import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 2;

const initialSchema = `
CREATE TABLE categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#8055D8',
  created_at TEXT NOT NULL
);

CREATE TABLE products (
  id TEXT PRIMARY KEY NOT NULL,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  cost_price REAL NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  selling_price REAL NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  recipient_tags TEXT NOT NULL DEFAULT '[]',
  occasion_tags TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  emoji TEXT NOT NULL DEFAULT '🎁',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (reserved_quantity <= stock_quantity)
);
CREATE INDEX products_name_index ON products(name COLLATE NOCASE);
CREATE INDEX products_category_index ON products(category_id);

CREATE TABLE customers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  normalized_phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX customers_name_index ON customers(name COLLATE NOCASE);

CREATE TABLE orders (
  id TEXT PRIMARY KEY NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('emergency', 'normal')),
  due_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  subtotal REAL NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount REAL NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total REAL NOT NULL DEFAULT 0 CHECK (total >= 0),
  reserved_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX orders_status_index ON orders(status);
CREATE INDEX orders_due_index ON orders(due_at);
CREATE INDEX orders_customer_index ON orders(customer_id);

CREATE TABLE gift_bundles (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  selling_price REAL NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  discount REAL NOT NULL DEFAULT 0 CHECK (discount >= 0),
  occasion_tags TEXT NOT NULL DEFAULT '[]',
  recipient_tags TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE gift_bundle_items (
  id TEXT PRIMARY KEY NOT NULL,
  bundle_id TEXT NOT NULL REFERENCES gift_bundles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE(bundle_id, product_id)
);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE RESTRICT,
  bundle_id TEXT REFERENCES gift_bundles(id) ON DELETE RESTRICT,
  bundle_line_id TEXT,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  unit_cost REAL NOT NULL CHECK (unit_cost >= 0),
  CHECK ((product_id IS NOT NULL AND bundle_id IS NULL) OR (product_id IS NULL AND bundle_id IS NOT NULL))
);
CREATE INDEX order_items_order_index ON order_items(order_id);

CREATE TABLE sales (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  total REAL NOT NULL CHECK (total >= 0),
  cost_total REAL NOT NULL CHECK (cost_total >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT NOT NULL DEFAULT '',
  sold_at TEXT NOT NULL
);
CREATE INDEX sales_date_index ON sales(sold_at);
CREATE TABLE sale_items (
  id TEXT PRIMARY KEY NOT NULL,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE RESTRICT,
  bundle_id TEXT REFERENCES gift_bundles(id) ON DELETE RESTRICT,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  unit_cost REAL NOT NULL CHECK (unit_cost >= 0)
);

CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('restock', 'adjustment', 'sale', 'order_reserve', 'order_release', 'order_complete', 'bundle_sale')),
  quantity_delta INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL CHECK (quantity_after >= 0),
  reference_id TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX stock_movements_product_date_index ON stock_movements(product_id, created_at);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  amount REAL NOT NULL CHECK (amount >= 0),
  notes TEXT NOT NULL DEFAULT '',
  spent_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX expenses_date_index ON expenses(spent_at);

CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let version = versionRow?.user_version ?? 0;

  if (version < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(initialSchema);
      await db.execAsync('PRAGMA user_version = 1;');
    });
    version = 1;
  }

  if (version < 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync('ALTER TABLE products ADD COLUMN photo_uri TEXT;');
      await db.execAsync('PRAGMA user_version = 2;');
    });
    version = 2;
  }

  if (version !== DATABASE_VERSION) {
    throw new Error(`Unsupported GiftGenie database version: ${version}`);
  }
}
