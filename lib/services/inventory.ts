import { getDatabase } from '@/lib/db';
import { FoodItem, InventoryBatch, FoodCategory, StockTransaction, InventoryAdjustment } from '@/lib/types';
import { logAudit } from './audit';
import { differenceInDays, parseISO } from 'date-fns';

export function getFoodCategories(): FoodCategory[] {
  const db = getDatabase();
  const query = `
    SELECT fc.*, 
      (SELECT COUNT(*) FROM food_items fi WHERE fi.category_id = fc.id AND fi.status = 'ACTIVE') as item_count
    FROM food_categories fc
    ORDER BY fc.name ASC
  `;
  return db.prepare(query).all() as FoodCategory[];
}

export function getFoodItems(options?: {
  category_id?: number;
  search?: string;
  status?: string;
  stock_filter?: 'ALL' | 'LOW' | 'CRITICAL' | 'EXPIRING';
}): FoodItem[] {
  const db = getDatabase();
  let query = `
    SELECT 
      fi.*,
      fc.name as category_name,
      COALESCE((SELECT SUM(ib.quantity_remaining) FROM inventory_batches ib WHERE ib.food_item_id = fi.id AND ib.status = 'ACTIVE'), 0) as current_stock,
      COALESCE((SELECT SUM(ib.quantity_received) FROM inventory_batches ib WHERE ib.food_item_id = fi.id), 0) as total_received,
      COALESCE((
        SELECT ABS(SUM(st.quantity)) 
        FROM stock_transactions st 
        WHERE st.food_item_id = fi.id AND st.transaction_type = 'STOCK_OUT'
      ), 0) as total_distributed,
      (
        SELECT MIN(ib.expiry_date) 
        FROM inventory_batches ib 
        WHERE ib.food_item_id = fi.id AND ib.status = 'ACTIVE' AND ib.quantity_remaining > 0
      ) as earliest_expiry
    FROM food_items fi
    JOIN food_categories fc ON fi.category_id = fc.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.category_id) {
    query += ` AND fi.category_id = ?`;
    params.push(options.category_id);
  }

  if (options?.search) {
    query += ` AND (fi.name LIKE ? OR fi.item_code LIKE ? OR fc.name LIKE ?)`;
    const searchPattern = `%${options.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (options?.status && options.status !== 'ALL') {
    query += ` AND fi.status = ?`;
    params.push(options.status);
  }

  query += ` ORDER BY fi.item_code ASC`;

  const items = db.prepare(query).all(...params) as FoodItem[];
  const today = new Date();

  return items.map(item => {
    const stock = Number(item.current_stock || 0);
    const minStock = item.minimum_stock;

    // Stock Status
    let stock_status: 'NORMAL' | 'LOW' | 'CRITICAL' = 'NORMAL';
    if (stock <= 0 || stock <= Math.floor(minStock * 0.4)) {
      stock_status = 'CRITICAL';
    } else if (stock <= minStock) {
      stock_status = 'LOW';
    }

    // Expiry Status
    let expiry_status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXPIRED' = 'NORMAL';
    if (item.earliest_expiry) {
      const expDate = parseISO(item.earliest_expiry);
      const daysLeft = differenceInDays(expDate, today);

      if (daysLeft < 0) {
        expiry_status = 'EXPIRED';
      } else if (daysLeft <= 7) {
        expiry_status = 'CRITICAL';
      } else if (daysLeft <= 30) {
        expiry_status = 'WARNING';
      }
    }

    return {
      ...item,
      stock_status,
      expiry_status
    };
  }).filter(item => {
    if (!options?.stock_filter || options.stock_filter === 'ALL') return true;
    if (options.stock_filter === 'LOW') return item.stock_status === 'LOW' || item.stock_status === 'CRITICAL';
    if (options.stock_filter === 'CRITICAL') return item.stock_status === 'CRITICAL';
    if (options.stock_filter === 'EXPIRING') return item.expiry_status === 'CRITICAL' || item.expiry_status === 'WARNING' || item.expiry_status === 'EXPIRED';
    return true;
  });
}

export function getFoodItemById(id: number | string): FoodItem | null {
  const db = getDatabase();
  const query = `
    SELECT 
      fi.*,
      fc.name as category_name,
      COALESCE((SELECT SUM(ib.quantity_remaining) FROM inventory_batches ib WHERE ib.food_item_id = fi.id AND ib.status = 'ACTIVE'), 0) as current_stock,
      COALESCE((SELECT SUM(ib.quantity_received) FROM inventory_batches ib WHERE ib.food_item_id = fi.id), 0) as total_received,
      COALESCE((
        SELECT ABS(SUM(st.quantity)) 
        FROM stock_transactions st 
        WHERE st.food_item_id = fi.id AND st.transaction_type = 'STOCK_OUT'
      ), 0) as total_distributed,
      (
        SELECT MIN(ib.expiry_date) 
        FROM inventory_batches ib 
        WHERE ib.food_item_id = fi.id AND ib.status = 'ACTIVE' AND ib.quantity_remaining > 0
      ) as earliest_expiry
    FROM food_items fi
    JOIN food_categories fc ON fi.category_id = fc.id
    WHERE fi.id = ? OR fi.item_code = ?
  `;
  const item = db.prepare(query).get(id, id) as FoodItem | undefined;
  if (!item) return null;

  const stock = Number(item.current_stock || 0);
  let stock_status: 'NORMAL' | 'LOW' | 'CRITICAL' = 'NORMAL';
  if (stock <= 0 || stock <= Math.floor(item.minimum_stock * 0.4)) {
    stock_status = 'CRITICAL';
  } else if (stock <= item.minimum_stock) {
    stock_status = 'LOW';
  }

  let expiry_status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXPIRED' = 'NORMAL';
  if (item.earliest_expiry) {
    const daysLeft = differenceInDays(parseISO(item.earliest_expiry), new Date());
    if (daysLeft < 0) expiry_status = 'EXPIRED';
    else if (daysLeft <= 7) expiry_status = 'CRITICAL';
    else if (daysLeft <= 30) expiry_status = 'WARNING';
  }

  return { ...item, stock_status, expiry_status };
}

export function getItemBatches(foodItemId: number): InventoryBatch[] {
  const db = getDatabase();
  const query = `
    SELECT ib.*, fi.name as food_item_name, fi.item_code
    FROM inventory_batches ib
    JOIN food_items fi ON ib.food_item_id = fi.id
    WHERE ib.food_item_id = ? AND ib.quantity_remaining > 0 AND ib.status = 'ACTIVE'
    ORDER BY ib.expiry_date ASC
  `;
  return db.prepare(query).all(foodItemId) as InventoryBatch[];
}

export function createFoodItem(data: {
  item_code: string;
  name: string;
  category_id: number;
  description?: string;
  unit: string;
  image_url?: string;
  minimum_stock: number;
  maximum_stock?: number;
  estimated_unit_cost?: number;
  userId?: number;
}): { success: boolean; item?: FoodItem; error?: string } {
  const db = getDatabase();
  try {
    const code = data.item_code.trim().toUpperCase();
    const stmt = db.prepare(`
      INSERT INTO food_items (item_code, name, category_id, description, unit, minimum_stock, maximum_stock, estimated_unit_cost, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `);

    const res = stmt.run(
      code,
      data.name.trim(),
      data.category_id,
      data.description || '',
      data.unit.trim(),
      data.minimum_stock || 20,
      data.maximum_stock || 200,
      data.estimated_unit_cost || 0.0,
      data.image_url || ''
    );

    const newItem = getFoodItemById(res.lastInsertRowid as number);

    logAudit({
      userId: data.userId,
      action: 'ADD_FOOD_ITEM',
      module: 'INVENTORY',
      recordId: code,
      description: `Pendaftaran item makanan baru: ${data.name} (${code})`
    });

    return { success: true, item: newItem || undefined };
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'Kod Item Makanan telah wujud.' };
    }
    return { success: false, error: err.message || 'Gagal mencipta item makanan.' };
  }
}

export function updateFoodItem(
  id: number | string,
  data: {
    item_code?: string;
    name?: string;
    category_id?: number;
    description?: string;
    unit?: string;
    image_url?: string;
    minimum_stock?: number;
    maximum_stock?: number;
    estimated_unit_cost?: number;
    status?: string;
    userId?: number;
  }
): { success: boolean; item?: FoodItem; error?: string } {
  const db = getDatabase();
  try {
    const existing = getFoodItemById(id);
    if (!existing) {
      return { success: false, error: 'Item makanan tidak dijumpai.' };
    }

    const code = (data.item_code !== undefined ? data.item_code : existing.item_code).trim().toUpperCase();
    const name = (data.name !== undefined ? data.name : existing.name).trim();
    const category_id = data.category_id !== undefined ? Number(data.category_id) : existing.category_id;
    const description = data.description !== undefined ? data.description : (existing.description || '');
    const unit = (data.unit !== undefined ? data.unit : existing.unit).trim();
    const image_url = data.image_url !== undefined ? data.image_url : (existing.image_url || '');
    const minimum_stock = data.minimum_stock !== undefined ? Number(data.minimum_stock) : existing.minimum_stock;
    const maximum_stock = data.maximum_stock !== undefined ? Number(data.maximum_stock) : (existing.maximum_stock || 200);
    const estimated_unit_cost = data.estimated_unit_cost !== undefined ? Number(data.estimated_unit_cost) : (existing.estimated_unit_cost || 0);
    const status = data.status || existing.status || 'ACTIVE';

    const stmt = db.prepare(`
      UPDATE food_items 
      SET item_code = ?, name = ?, category_id = ?, description = ?, unit = ?, minimum_stock = ?, maximum_stock = ?, estimated_unit_cost = ?, image_url = ?, status = ?
      WHERE id = ?
    `);

    stmt.run(
      code,
      name,
      category_id,
      description,
      unit,
      minimum_stock,
      maximum_stock,
      estimated_unit_cost,
      image_url,
      status,
      existing.id
    );

    const updated = getFoodItemById(existing.id);

    logAudit({
      userId: data.userId,
      action: 'UPDATE_FOOD_ITEM',
      module: 'INVENTORY',
      recordId: code,
      description: `Kemaskini item makanan: ${name} (${code})`
    });

    return { success: true, item: updated || undefined };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengemaskini item makanan.' };
  }
}

export function deleteFoodItem(
  id: number | string,
  userId?: number
): { success: boolean; error?: string } {
  const db = getDatabase();
  try {
    const existing = getFoodItemById(id);
    if (!existing) {
      return { success: false, error: 'Item makanan tidak dijumpai.' };
    }

    db.prepare(`UPDATE food_items SET status = 'INACTIVE' WHERE id = ?`).run(existing.id);

    logAudit({
      userId,
      action: 'DELETE_FOOD_ITEM',
      module: 'INVENTORY',
      recordId: existing.item_code,
      description: `Nyahaktifkan item makanan: ${existing.name} (${existing.item_code})`
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memadam item makanan.' };
  }
}

export function setFoodItemStockDirect(data: {
  food_item_id: number;
  new_stock: number;
  reason?: string;
  authorized_by?: string;
  userId?: number;
}): { success: boolean; transaction_code?: string; new_stock?: number; difference?: number; error?: string } {
  const newStock = Math.max(0, Number(data.new_stock));

  try {
    const item = getFoodItemById(data.food_item_id);
    if (!item) return { success: false, error: 'Item makanan tidak dijumpai.' };

    const currentStock = Number(item.current_stock || 0);
    const diff = newStock - currentStock;

    if (diff === 0) {
      return { success: true, new_stock: newStock, difference: 0 };
    }

    if (diff > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const future = new Date(today);
      future.setMonth(future.getMonth() + 6);
      const expStr = future.toISOString().split('T')[0];
      const batchNum = `B-${item.item_code}-${today.getFullYear().toString().slice(-2)}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-EDIT`;

      const res = recordStockIn({
        food_item_id: item.id,
        batch_number: batchNum,
        quantity: diff,
        expiry_date: expStr,
        received_date: todayStr,
        source: 'Kemaskini Baki Terus',
        remarks: data.reason || `Kemaskini baki stok daripada ${currentStock} ke ${newStock} ${item.unit}`,
        userId: data.userId
      });

      return { 
        success: res.success, 
        transaction_code: res.transaction_code, 
        new_stock: newStock, 
        difference: diff, 
        error: res.error 
      };
    } else {
      const res = recordInventoryAdjustment({
        food_item_id: item.id,
        adjustment_type: 'Correction',
        quantity: diff,
        reason: data.reason || `Kemaskini baki stok daripada ${currentStock} ke ${newStock} ${item.unit}`,
        authorized_by: data.authorized_by || 'Pentadbir UAPP',
        userId: data.userId
      });

      return { 
        success: res.success, 
        transaction_code: res.transaction_code, 
        new_stock: newStock, 
        difference: diff, 
        error: res.error 
      };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengemaskini baki stok.' };
  }
}

export function recordStockIn(data: {
  food_item_id: number;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  received_date: string;
  unit_cost?: number;
  source?: string;
  remarks?: string;
  userId?: number;
}): { success: boolean; transaction_code?: string; error?: string } {
  const db = getDatabase();
  
  if (data.quantity <= 0) {
    return { success: false, error: 'Kuantiti Stock In mestilah lebih daripada sifar (0).' };
  }

  const transaction = db.transaction(() => {
    const item = db.prepare(`SELECT * FROM food_items WHERE id = ?`).get(data.food_item_id) as FoodItem;
    if (!item) throw new Error('Item makanan tidak dijumpai.');

    // 1. Insert Inventory Batch
    const batchRes = db.prepare(`
      INSERT INTO inventory_batches (food_item_id, batch_number, quantity_received, quantity_remaining, expiry_date, received_date, unit_cost, source, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      data.food_item_id,
      data.batch_number.trim(),
      data.quantity,
      data.quantity,
      data.expiry_date,
      data.received_date,
      data.unit_cost || item.estimated_unit_cost || 0,
      data.source || 'Peruntukan KPT'
    );

    const batchId = batchRes.lastInsertRowid as number;

    // 2. Generate Transaction Code
    const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM stock_transactions WHERE transaction_type = 'STOCK_IN'`).get() as { cnt: number };
    const txCode = `SIN-${new Date().getFullYear()}-${String(countRow.cnt + 1).padStart(6, '0')}`;

    // 3. Calculate new total stock balance
    const balanceRow = db.prepare(`
      SELECT COALESCE(SUM(quantity_remaining), 0) as current_bal 
      FROM inventory_batches 
      WHERE food_item_id = ? AND status = 'ACTIVE'
    `).get(data.food_item_id) as { current_bal: number };

    // 4. Record in Stock Transactions Ledger
    db.prepare(`
      INSERT INTO stock_transactions (transaction_code, transaction_type, food_item_id, batch_id, quantity, balance_after, operator_id, remarks)
      VALUES (?, 'STOCK_IN', ?, ?, ?, ?, ?, ?)
    `).run(
      txCode,
      data.food_item_id,
      batchId,
      data.quantity,
      balanceRow.current_bal,
      data.userId || null,
      data.remarks || `Penerimaan stok dari ${data.source || 'Pembekal'}`
    );

    // 5. Audit Log
    logAudit({
      userId: data.userId,
      action: 'STOCK_IN',
      module: 'STOCK_IN',
      recordId: txCode,
      description: `Stock In ${data.quantity} unit ${item.name} (${item.item_code}) [Batch: ${data.batch_number}]`
    });

    return txCode;
  });

  try {
    const txCode = transaction();
    return { success: true, transaction_code: txCode };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memproses Stock In.' };
  }
}

export function recordInventoryAdjustment(data: {
  food_item_id: number;
  batch_id?: number | null;
  adjustment_type: 'Damaged' | 'Expired' | 'Lost' | 'Counting Error' | 'Correction' | 'Stock Count Discrepancy';
  quantity: number; // positive or negative
  reason: string;
  authorized_by: string;
  userId?: number;
}): { success: boolean; transaction_code?: string; error?: string } {
  const db = getDatabase();

  if (data.quantity === 0) {
    return { success: false, error: 'Kuantiti pelarasan tidak boleh sifar.' };
  }

  const transaction = db.transaction(() => {
    const item = db.prepare(`SELECT * FROM food_items WHERE id = ?`).get(data.food_item_id) as FoodItem;
    if (!item) throw new Error('Item makanan tidak dijumpai.');

    // Adjust batches
    let primaryBatchId = data.batch_id;
    if (data.quantity < 0) {
      let remainingToDeduct = Math.abs(data.quantity);
      const activeBatches = db.prepare(`
        SELECT id, quantity_remaining 
        FROM inventory_batches 
        WHERE food_item_id = ? AND quantity_remaining > 0 AND status = 'ACTIVE'
        ORDER BY expiry_date ASC
      `).all(data.food_item_id) as { id: number; quantity_remaining: number }[];

      if (activeBatches.length > 0 && !primaryBatchId) {
        primaryBatchId = activeBatches[0].id;
      }

      for (const b of activeBatches) {
        if (remainingToDeduct <= 0) break;
        const deduct = Math.min(b.quantity_remaining, remainingToDeduct);
        const newQty = Math.max(0, b.quantity_remaining - deduct);
        const newStatus = newQty <= 0 ? 'DEPLETED' : 'ACTIVE';
        db.prepare(`
          UPDATE inventory_batches 
          SET quantity_remaining = ?, status = ? 
          WHERE id = ?
        `).run(newQty, newStatus, b.id);
        remainingToDeduct -= deduct;
      }
    } else if (data.quantity > 0) {
      const activeBatches = db.prepare(`
        SELECT id, quantity_remaining 
        FROM inventory_batches 
        WHERE food_item_id = ? AND status = 'ACTIVE'
        ORDER BY expiry_date DESC LIMIT 1
      `).all(data.food_item_id) as { id: number; quantity_remaining: number }[];

      if (activeBatches.length > 0) {
        primaryBatchId = activeBatches[0].id;
        const newQty = activeBatches[0].quantity_remaining + data.quantity;
        db.prepare(`
          UPDATE inventory_batches 
          SET quantity_remaining = ?, status = 'ACTIVE' 
          WHERE id = ?
        `).run(newQty, 'ACTIVE', activeBatches[0].id);
      }
    }

    // Record adjustment entry
    db.prepare(`
      INSERT INTO inventory_adjustments (food_item_id, batch_id, adjustment_type, quantity, reason, authorized_by, operator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.food_item_id,
      primaryBatchId || null,
      data.adjustment_type,
      data.quantity,
      data.reason,
      data.authorized_by,
      data.userId || null
    );

    // Ledger Transaction Code
    const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM stock_transactions WHERE transaction_type IN ('ADJUSTMENT', 'EXPIRED', 'DAMAGED', 'CORRECTION')`).get() as { cnt: number };
    const txCode = `ADJ-${new Date().getFullYear()}-${String(countRow.cnt + 1).padStart(6, '0')}`;

    const balanceRow = db.prepare(`
      SELECT COALESCE(SUM(quantity_remaining), 0) as current_bal 
      FROM inventory_batches 
      WHERE food_item_id = ? AND status = 'ACTIVE'
    `).get(data.food_item_id) as { current_bal: number };

    db.prepare(`
      INSERT INTO stock_transactions (transaction_code, transaction_type, food_item_id, batch_id, quantity, balance_after, operator_id, remarks)
      VALUES (?, 'ADJUSTMENT', ?, ?, ?, ?, ?, ?)
    `).run(
      txCode,
      data.food_item_id,
      primaryBatchId || null,
      data.quantity,
      balanceRow.current_bal,
      data.userId || null,
      `Pelarasan: ${data.adjustment_type} (${data.reason}) | Kuasa: ${data.authorized_by}`
    );

    logAudit({
      userId: data.userId,
      action: 'STOCK_ADJUSTMENT',
      module: 'INVENTORY_ADJUSTMENT',
      recordId: txCode,
      description: `Pelarasan stok ${data.quantity > 0 ? '+' : ''}${data.quantity} ${item.name} (${data.adjustment_type}). Sebab: ${data.reason}`
    });

    return txCode;
  });

  try {
    const txCode = transaction();
    return { success: true, transaction_code: txCode };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memproses pelarasan inventori.' };
  }
}

export function getExpiryMonitoringList(): any[] {
  const db = getDatabase();
  const today = new Date();
  const query = `
    SELECT 
      ib.id as batch_id,
      ib.batch_number,
      ib.quantity_remaining,
      ib.expiry_date,
      ib.received_date,
      ib.source,
      fi.id as food_item_id,
      fi.name as food_item_name,
      fi.item_code,
      fi.unit,
      fc.name as category_name
    FROM inventory_batches ib
    JOIN food_items fi ON ib.food_item_id = fi.id
    JOIN food_categories fc ON fi.category_id = fc.id
    WHERE ib.quantity_remaining > 0 AND ib.status = 'ACTIVE'
    ORDER BY ib.expiry_date ASC
  `;
  const batches = db.prepare(query).all() as any[];

  return batches.map(b => {
    const expDate = parseISO(b.expiry_date);
    const daysLeft = differenceInDays(expDate, today);

    let status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXPIRED' = 'NORMAL';
    if (daysLeft < 0) status = 'EXPIRED';
    else if (daysLeft <= 7) status = 'CRITICAL';
    else if (daysLeft <= 30) status = 'WARNING';

    return {
      ...b,
      days_left: daysLeft,
      status
    };
  });
}

export function updateInventoryBatch(
  id: number,
  data: {
    batch_number?: string;
    quantity_remaining?: number;
    quantity_received?: number;
    expiry_date?: string;
    received_date?: string;
    source?: string;
    unit_cost?: number;
    status?: string;
    userId?: number;
  }
): { success: boolean; batch?: InventoryBatch; error?: string } {
  const db = getDatabase();
  try {
    const existing = db.prepare(`SELECT * FROM inventory_batches WHERE id = ?`).get(id) as InventoryBatch | undefined;
    if (!existing) {
      return { success: false, error: 'Batch inventori tidak dijumpai.' };
    }

    const batch_number = (data.batch_number !== undefined ? data.batch_number : existing.batch_number).trim();
    const quantity_remaining = data.quantity_remaining !== undefined ? Number(data.quantity_remaining) : existing.quantity_remaining;
    const quantity_received = data.quantity_received !== undefined ? Number(data.quantity_received) : existing.quantity_received;
    const expiry_date = data.expiry_date || existing.expiry_date;
    const received_date = data.received_date || existing.received_date;
    const source = data.source !== undefined ? data.source.trim() : (existing.source || 'Peruntukan KPT');
    const unit_cost = data.unit_cost !== undefined ? Number(data.unit_cost) : (existing.unit_cost || 0);
    const status = data.status || (quantity_remaining <= 0 ? 'DEPLETED' : existing.status || 'ACTIVE');

    db.prepare(`
      UPDATE inventory_batches
      SET batch_number = ?, quantity_remaining = ?, quantity_received = ?, expiry_date = ?, received_date = ?, source = ?, unit_cost = ?, status = ?
      WHERE id = ?
    `).run(
      batch_number,
      quantity_remaining,
      quantity_received,
      expiry_date,
      received_date,
      source,
      unit_cost,
      status,
      id
    );

    logAudit({
      userId: data.userId,
      action: 'UPDATE_INVENTORY_BATCH',
      module: 'INVENTORY',
      recordId: batch_number,
      description: `Kemaskini maklumat batch ${batch_number}: Baki ${quantity_remaining}, Luput ${expiry_date}`
    });

    const updated = db.prepare(`SELECT * FROM inventory_batches WHERE id = ?`).get(id) as InventoryBatch;
    return { success: true, batch: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengemaskini batch.' };
  }
}

export function deleteInventoryBatch(
  id: number,
  userId?: number
): { success: boolean; error?: string } {
  const db = getDatabase();
  try {
    const existing = db.prepare(`SELECT * FROM inventory_batches WHERE id = ?`).get(id) as InventoryBatch | undefined;
    if (!existing) {
      return { success: false, error: 'Batch inventori tidak dijumpai.' };
    }

    db.prepare(`UPDATE inventory_batches SET status = 'INACTIVE', quantity_remaining = 0 WHERE id = ?`).run(id);

    logAudit({
      userId,
      action: 'DELETE_INVENTORY_BATCH',
      module: 'INVENTORY',
      recordId: existing.batch_number,
      description: `Nyahaktifkan batch ${existing.batch_number}`
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memadam batch.' };
  }
}
