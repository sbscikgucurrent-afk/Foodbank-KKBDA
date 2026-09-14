-- MADANI FOODBANK Relational Database Schema
-- Compatible with SQLite & PostgreSQL

PRAGMA foreign_keys = ON;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('superadmin', 'uappadmin', 'operator', 'student')),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Programmes table
CREATE TABLE IF NOT EXISTS programmes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    programme_code TEXT UNIQUE NOT NULL,
    programme_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Students table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL, -- e.g. KKBDA001
    name TEXT NOT NULL,
    ic_number TEXT NOT NULL,
    programme_id INTEGER NOT NULL REFERENCES programmes(id),
    semester INTEGER NOT NULL DEFAULT 1,
    class_group TEXT DEFAULT 'A',
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    qr_token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Food Categories
CREATE TABLE IF NOT EXISTS food_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE'))
);

-- 5. Food Items
CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_code TEXT UNIQUE NOT NULL, -- e.g. FB001
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES food_categories(id),
    description TEXT,
    unit TEXT NOT NULL DEFAULT 'Pek', -- Sachet, Pek, Tin, Kotak, Botol
    minimum_stock INTEGER NOT NULL DEFAULT 20,
    maximum_stock INTEGER NOT NULL DEFAULT 200,
    estimated_unit_cost REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Inventory Batches (FEFO Tracking)
CREATE TABLE IF NOT EXISTS inventory_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_item_id INTEGER NOT NULL REFERENCES food_items(id),
    batch_number TEXT NOT NULL,
    quantity_received INTEGER NOT NULL,
    quantity_remaining INTEGER NOT NULL,
    expiry_date DATE NOT NULL,
    received_date DATE NOT NULL,
    unit_cost REAL NOT NULL DEFAULT 0.0,
    source TEXT NOT NULL DEFAULT 'Peruntukan KPT / Dapur Siswa',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DEPLETED', 'EXPIRED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Stock Transactions Ledger (Immutable)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_code TEXT UNIQUE NOT NULL, -- e.g. SIN-2026-000001, SOUT-2026-000001, ADJ-2026-000001
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED', 'CORRECTION')),
    food_item_id INTEGER NOT NULL REFERENCES food_items(id),
    batch_id INTEGER REFERENCES inventory_batches(id),
    quantity INTEGER NOT NULL, -- +quantity for IN, -quantity for OUT/EXPIRED/DAMAGED
    balance_after INTEGER NOT NULL,
    student_id INTEGER REFERENCES students(id),
    operator_id INTEGER REFERENCES users(id),
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Distribution Transactions (Food distribution sessions)
CREATE TABLE IF NOT EXISTS distribution_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_code TEXT UNIQUE NOT NULL, -- e.g. FDB-2026-000001
    student_id INTEGER NOT NULL REFERENCES students(id),
    operator_id INTEGER NOT NULL REFERENCES users(id),
    total_items INTEGER NOT NULL,
    override_used INTEGER NOT NULL DEFAULT 0,
    override_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Distribution Items Breakdown
CREATE TABLE IF NOT EXISTS distribution_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    distribution_transaction_id INTEGER NOT NULL REFERENCES distribution_transactions(id) ON DELETE CASCADE,
    food_item_id INTEGER NOT NULL REFERENCES food_items(id),
    batch_id INTEGER NOT NULL REFERENCES inventory_batches(id),
    quantity INTEGER NOT NULL DEFAULT 1
);

-- 10. Inventory Adjustments
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_item_id INTEGER NOT NULL REFERENCES food_items(id),
    batch_id INTEGER REFERENCES inventory_batches(id),
    adjustment_type TEXT NOT NULL, -- 'Damaged', 'Expired', 'Lost', 'Counting Error', 'Correction', 'Stock Count Discrepancy'
    quantity INTEGER NOT NULL, -- e.g. -2 or +5
    reason TEXT NOT NULL,
    authorized_by TEXT NOT NULL,
    operator_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Audit Logs (Immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id TEXT,
    description TEXT NOT NULL,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('LOW_STOCK', 'CRITICAL_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'LIMIT_WARNING', 'SYSTEM')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNREAD' CHECK(status IN ('UNREAD', 'READ')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_qr_token ON students(qr_token);
CREATE INDEX IF NOT EXISTS idx_students_programme_id ON students(programme_id);
CREATE INDEX IF NOT EXISTS idx_food_items_code ON food_items(item_code);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category_id);
CREATE INDEX IF NOT EXISTS idx_batches_food_item ON inventory_batches(food_item_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_tx_code ON stock_transactions(transaction_code);
CREATE INDEX IF NOT EXISTS idx_stock_tx_created ON stock_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_tx_food_item ON stock_transactions(food_item_id);
CREATE INDEX IF NOT EXISTS idx_dist_tx_code ON distribution_transactions(transaction_code);
CREATE INDEX IF NOT EXISTS idx_dist_tx_student ON distribution_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_dist_tx_created ON distribution_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
