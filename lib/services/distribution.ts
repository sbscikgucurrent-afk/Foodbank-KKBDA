import { getDatabase } from '@/lib/db';
import { DistributionTransaction, Student } from '@/lib/types';
import { logAudit } from './audit';
import { format, isSameDay, parseISO } from 'date-fns';

export interface DistributeItemRequest {
  food_item_id: number;
  quantity: number;
}

export interface DistributionVerificationResult {
  allowed: boolean;
  student: Student | null;
  daily_limit_reached: boolean;
  last_collection_today?: {
    time: string;
    transaction_code: string;
  } | null;
  error?: string;
}

export function verifyStudentForDistribution(identifier: string): DistributionVerificationResult {
  const db = getDatabase();
  const clean = identifier.trim();

  // Look up student by student_id or qr_token
  const student = db.prepare(`
    SELECT s.*, p.programme_name, p.programme_code
    FROM students s
    JOIN programmes p ON s.programme_id = p.id
    WHERE s.student_id = ? OR s.qr_token = ? OR s.id = ?
  `).get(clean, clean, clean) as Student | undefined;

  if (!student) {
    return {
      allowed: false,
      student: null,
      daily_limit_reached: false,
      error: 'Rekod pelajar tidak dijumpai dalam pangkalan data.'
    };
  }

  if (student.status !== 'ACTIVE') {
    return {
      allowed: false,
      student,
      daily_limit_reached: false,
      error: 'Pelajar ini berstatus TIDAK AKTIF dan tidak layak membuat pengambilan makanan.'
    };
  }

  // Daily collection info (Informative only - Tiada Had Pengambilan)
  const todayStart = format(new Date(), 'yyyy-MM-dd') + ' 00:00:00';
  const todayEnd = format(new Date(), 'yyyy-MM-dd') + ' 23:59:59';

  const todayTx = db.prepare(`
    SELECT * FROM distribution_transactions
    WHERE student_id = ? AND created_at BETWEEN ? AND ?
    ORDER BY created_at DESC LIMIT 1
  `).get(student.id, todayStart, todayEnd) as DistributionTransaction | undefined;

  return {
    allowed: true,
    student,
    daily_limit_reached: false,
    last_collection_today: todayTx ? {
      time: todayTx.created_at,
      transaction_code: todayTx.transaction_code
    } : null
  };
}

export function processFoodDistribution(data: {
  student_id: number;
  operator_id: number;
  items: DistributeItemRequest[];
  override?: boolean;
  override_reason?: string;
}): {
  success: boolean;
  transaction?: DistributionTransaction;
  error?: string;
} {
  const db = getDatabase();

  if (!data.items || data.items.length === 0) {
    return { success: false, error: 'Sila pilih sekurang-kurangnya 1 item makanan.' };
  }

  const totalQuantity = data.items.reduce((sum, i) => sum + i.quantity, 0);
  if (totalQuantity <= 0) {
    return { success: false, error: 'Jumlah kuantiti mestilah lebih daripada 0.' };
  }

  // Execute atomic transaction (Tiada Had Pengambilan)
  const executeTransaction = db.transaction(() => {
    // 1. Verify Student Status
    const student = db.prepare(`SELECT * FROM students WHERE id = ?`).get(data.student_id) as Student | undefined;
    if (!student || student.status !== 'ACTIVE') {
      throw new Error('Pelajar tidak sah atau tidak aktif.');
    }

    // 3. Check and Allocate Batches via FEFO (First-Expire, First-Out)
    const allocations: {
      food_item_id: number;
      food_item_name: string;
      item_code: string;
      batch_id: number;
      batch_number: string;
      unit: string;
      quantity: number;
    }[] = [];

    for (const req of data.items) {
      if (req.quantity <= 0) continue;

      let foodItem = db.prepare(`SELECT * FROM food_items WHERE id = ?`).get(req.food_item_id) as any;
      if (!foodItem) {
        const allItems = db.prepare(`SELECT * FROM food_items`).all() as any[];
        foodItem = allItems.find(fi => Number(fi.id) === Number(req.food_item_id));
      }
      if (!foodItem || foodItem.status === 'INACTIVE') {
        throw new Error(`Item makanan [ID: ${req.food_item_id}] tidak aktif atau tidak dijumpai.`);
      }

      // Fetch active batches with remaining stock sorted by earliest expiry
      const batches = db.prepare(`
        SELECT * FROM inventory_batches
        WHERE food_item_id = ? AND quantity_remaining > 0 AND status = 'ACTIVE'
        ORDER BY expiry_date ASC
      `).all(req.food_item_id) as any[];

      const totalAvailable = batches.reduce((sum, b) => sum + b.quantity_remaining, 0);
      if (totalAvailable < req.quantity) {
        throw new Error(`STOK TIDAK MENCUKUPI: ${foodItem.name} (${foodItem.item_code}) baki tersedia: ${totalAvailable}, diminta: ${req.quantity}.`);
      }

      let remainingToDeduct = req.quantity;
      for (const batch of batches) {
        if (remainingToDeduct <= 0) break;

        const deductFromBatch = Math.min(batch.quantity_remaining, remainingToDeduct);
        allocations.push({
          food_item_id: foodItem.id,
          food_item_name: foodItem.name,
          item_code: foodItem.item_code,
          batch_id: batch.id,
          batch_number: batch.batch_number,
          unit: foodItem.unit,
          quantity: deductFromBatch
        });

        // Deduct from batch
        const newBatchRemaining = batch.quantity_remaining - deductFromBatch;
        const newBatchStatus = newBatchRemaining === 0 ? 'DEPLETED' : 'ACTIVE';
        db.prepare(`
          UPDATE inventory_batches 
          SET quantity_remaining = ?, status = ?
          WHERE id = ?
        `).run(newBatchRemaining, newBatchStatus, batch.id);

        remainingToDeduct -= deductFromBatch;
      }
    }

    // 4. Create Distribution Transaction
    const distCount = db.prepare(`SELECT COUNT(*) as cnt FROM distribution_transactions`).get() as { cnt: number };
    const distCode = `FDB-${new Date().getFullYear()}-${String(distCount.cnt + 1).padStart(6, '0')}`;

    const distRes = db.prepare(`
      INSERT INTO distribution_transactions (transaction_code, student_id, operator_id, total_items, override_used, override_reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      distCode,
      data.student_id,
      data.operator_id,
      totalQuantity,
      data.override ? 1 : 0,
      data.override ? data.override_reason : null
    );

    const distTxId = distRes.lastInsertRowid as number;

    // 5. Create Distribution Items & Stock Out Transactions
    let soutCount = db.prepare(`SELECT COUNT(*) as cnt FROM stock_transactions WHERE transaction_type = 'STOCK_OUT'`).get() as { cnt: number };
    let currentSoutIndex = soutCount.cnt;

    for (const alloc of allocations) {
      // Insert distribution item
      db.prepare(`
        INSERT INTO distribution_items (distribution_transaction_id, food_item_id, batch_id, quantity)
        VALUES (?, ?, ?, ?)
      `).run(distTxId, alloc.food_item_id, alloc.batch_id, alloc.quantity);

      // Insert stock transaction
      currentSoutIndex++;
      const soutCode = `SOUT-${new Date().getFullYear()}-${String(currentSoutIndex).padStart(6, '0')}`;
      
      const balanceRow = db.prepare(`
        SELECT COALESCE(SUM(quantity_remaining), 0) as current_bal 
        FROM inventory_batches 
        WHERE food_item_id = ? AND status = 'ACTIVE'
      `).get(alloc.food_item_id) as { current_bal: number };

      db.prepare(`
        INSERT INTO stock_transactions (transaction_code, transaction_type, food_item_id, batch_id, quantity, balance_after, student_id, operator_id, remarks)
        VALUES (?, 'STOCK_OUT', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        soutCode,
        alloc.food_item_id,
        alloc.batch_id,
        -alloc.quantity,
        balanceRow.current_bal,
        data.student_id,
        data.operator_id,
        `Agihan Foodbank kepada pelajar: ${student.name} (${student.student_id}) [${distCode}]`
      );
    }

    // 6. Audit Log
    logAudit({
      userId: data.operator_id,
      action: data.override ? 'DISTRIBUTION_WITH_OVERRIDE' : 'DISTRIBUTION',
      module: 'DISTRIBUTION',
      recordId: distCode,
      description: `Agihan ${totalQuantity} item kepada ${student.name} (${student.student_id})${data.override ? ` [OVERRIDE: ${data.override_reason}]` : ''}`
    });

    // 7. Return complete transaction record
    const createdTx = db.prepare(`
      SELECT dt.*, s.name as student_name, s.student_id as student_code, u.name as operator_name
      FROM distribution_transactions dt
      JOIN students s ON dt.student_id = s.id
      JOIN users u ON dt.operator_id = u.id
      WHERE dt.id = ?
    `).get(distTxId) as DistributionTransaction;

    return {
      ...createdTx,
      items: allocations as any
    };
  });

  try {
    const result = executeTransaction();
    return { success: true, transaction: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memproses agihan makanan.' };
  }
}

export function getRecentDistributions(options?: { limit?: number; search?: string }): DistributionTransaction[] {
  const db = getDatabase();
  const limit = options?.limit || 20;

  let query = `
    SELECT 
      dt.*,
      s.name as student_name,
      s.student_id as student_code,
      p.programme_name,
      p.programme_code,
      u.name as operator_name
    FROM distribution_transactions dt
    JOIN students s ON dt.student_id = s.id
    JOIN programmes p ON s.programme_id = p.id
    JOIN users u ON dt.operator_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.search) {
    query += ` AND (s.name LIKE ? OR s.student_id LIKE ? OR dt.transaction_code LIKE ?)`;
    const searchPattern = `%${options.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY dt.created_at DESC LIMIT ?`;
  params.push(limit);

  const list = db.prepare(query).all(...params) as DistributionTransaction[];

  // Fetch items for each transaction
  const itemStmt = db.prepare(`
    SELECT di.*, fi.name as food_item_name, fi.item_code, fi.unit, ib.batch_number
    FROM distribution_items di
    JOIN food_items fi ON di.food_item_id = fi.id
    JOIN inventory_batches ib ON di.batch_id = ib.id
    WHERE di.distribution_transaction_id = ?
  `);

  return list.map(tx => ({
    ...tx,
    items: itemStmt.all(tx.id) as any
  }));
}
