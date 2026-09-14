export type UserRole = 'superadmin' | 'uappadmin' | 'operator' | 'student';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  last_login?: string | null;
  created_at: string;
  student_id?: string;
}

export interface Programme {
  id: number;
  programme_code: string;
  programme_name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Student {
  id: number;
  student_id: string; // e.g. KKBDA001
  name: string;
  ic_number: string;
  programme_id: number;
  programme_name?: string;
  programme_code?: string;
  semester: number;
  class_group: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  qr_token: string;
  created_at: string;
  updated_at: string;
  total_visits?: number;
  total_items_received?: number;
  last_visit?: string | null;
  first_visit?: string | null;
}

export interface FoodCategory {
  id: number;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  item_count?: number;
}

export interface FoodItem {
  id: number;
  item_code: string; // e.g. FB001
  name: string;
  category_id: number;
  category_name?: string;
  description?: string;
  unit: string; // Sachet, Pek, Tin, Kotak, etc.
  image_url?: string;
  minimum_stock: number;
  maximum_stock: number;
  estimated_unit_cost: number;
  status: 'ACTIVE' | 'INACTIVE';
  current_stock?: number;
  total_received?: number;
  total_distributed?: number;
  earliest_expiry?: string | null;
  expiry_status?: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXPIRED';
  stock_status?: 'NORMAL' | 'LOW' | 'CRITICAL';
  created_at: string;
  updated_at: string;
}

export interface InventoryBatch {
  id: number;
  food_item_id: number;
  food_item_name?: string;
  item_code?: string;
  batch_number: string;
  quantity_received: number;
  quantity_remaining: number;
  expiry_date: string; // YYYY-MM-DD
  received_date: string; // YYYY-MM-DD
  unit_cost: number;
  source: string; // Pembekal / Penderma / Peruntukan KPT
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED';
  created_at: string;
}

export type TransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'EXPIRED' | 'DAMAGED' | 'CORRECTION';

export interface StockTransaction {
  id: number;
  transaction_code: string; // SIN-2026-000001 / SOUT-2026-000001 / ADJ-2026-000001
  transaction_type: TransactionType;
  food_item_id: number;
  food_item_name?: string;
  item_code?: string;
  unit?: string;
  batch_id?: number | null;
  batch_number?: string | null;
  quantity: number; // positive for in, negative for out/expired/damaged
  balance_after: number;
  student_id?: number | null;
  student_name?: string | null;
  student_code?: string | null;
  operator_id?: number | null;
  operator_name?: string | null;
  remarks?: string | null;
  created_at: string;
}

export interface DistributionTransaction {
  id: number;
  transaction_code: string; // FDB-2026-000001
  student_id: number;
  student_name?: string;
  student_code?: string;
  programme_name?: string;
  semester?: number;
  operator_id: number;
  operator_name?: string;
  total_items: number;
  override_used: number; // 0 or 1
  override_reason?: string | null;
  created_at: string;
  items?: DistributionItem[];
}

export interface DistributionItem {
  id: number;
  distribution_transaction_id: number;
  food_item_id: number;
  food_item_name?: string;
  item_code?: string;
  unit?: string;
  batch_id: number;
  batch_number?: string;
  quantity: number;
}

export interface InventoryAdjustment {
  id: number;
  food_item_id: number;
  food_item_name?: string;
  batch_id?: number | null;
  adjustment_type: 'Damaged' | 'Expired' | 'Lost' | 'Counting Error' | 'Correction' | 'Stock Count Discrepancy';
  quantity: number; // e.g. -2 or +5
  reason: string;
  authorized_by: string;
  operator_id?: number;
  created_at: string;
}

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  user_name?: string | null;
  role?: string | null;
  action: string;
  module: string;
  record_id?: string | null;
  description: string;
  ip_address?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  type: 'LOW_STOCK' | 'CRITICAL_STOCK' | 'EXPIRING_SOON' | 'EXPIRED' | 'LIMIT_WARNING' | 'SYSTEM';
  title: string;
  message: string;
  status: 'UNREAD' | 'READ';
  created_at: string;
}

export interface DashboardKPIs {
  total_students: number;
  students_served: number;
  food_items_count: number;
  current_total_stock: number;
  stock_in_period: number;
  stock_out_period: number;
  low_stock_count: number;
  expiring_soon_count: number;
  estimated_inventory_value: number;
  estimated_distributed_value: number;
}

export interface RestockRecommendation {
  food_item_id: number;
  item_code: string;
  food_name: string;
  current_stock: number;
  minimum_stock: number;
  monthly_distribution: number;
  average_daily_usage: number;
  estimated_days_remaining: number;
  recommended_purchase_quantity: number;
  unit: string;
  status: 'RESTOCK REQUIRED' | 'CRITICAL' | 'ADEQUATE';
}
