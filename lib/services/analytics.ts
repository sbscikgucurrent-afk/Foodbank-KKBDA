import { getDatabase } from '@/lib/db';
import { DashboardKPIs, RestockRecommendation } from '@/lib/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, parseISO, differenceInDays } from 'date-fns';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export function getDateRangeFromPeriod(period: string, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  let start = startOfMonth(now);
  let end = endOfMonth(now);

  switch (period) {
    case 'today':
      start = now;
      end = now;
      break;
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'semester':
      // 6-month semester window
      start = subDays(now, 180);
      end = now;
      break;
    case 'year':
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    case 'custom':
      if (customStart && customEnd) {
        return { startDate: customStart, endDate: customEnd };
      }
      break;
  }

  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd')
  };
}

export function getDashboardKPIs(period: string = 'month', customStart?: string, customEnd?: string): DashboardKPIs {
  const db = getDatabase();
  const { startDate, endDate } = getDateRangeFromPeriod(period, customStart, customEnd);
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;

  // 1. Total Registered Students
  const totalStudents = (db.prepare(`SELECT COUNT(*) as count FROM students WHERE status = 'ACTIVE'`).get() as { count: number }).count;

  // 2. Unique Students Served in period
  const studentsServed = (db.prepare(`
    SELECT COUNT(DISTINCT student_id) as count 
    FROM distribution_transactions 
    WHERE created_at BETWEEN ? AND ?
  `).get(startDateTime, endDateTime) as { count: number }).count;

  // 3. Active Food Items
  const foodItemsCount = (db.prepare(`SELECT COUNT(*) as count FROM food_items WHERE status = 'ACTIVE'`).get() as { count: number }).count;

  // 4. Current Total Stock
  const currentTotalStock = (db.prepare(`
    SELECT COALESCE(SUM(quantity_remaining), 0) as total 
    FROM inventory_batches 
    WHERE status = 'ACTIVE'
  `).get() as { total: number }).total;

  // 5. Stock In during period
  const stockInPeriod = (db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total 
    FROM stock_transactions 
    WHERE transaction_type = 'STOCK_IN' AND created_at BETWEEN ? AND ?
  `).get(startDateTime, endDateTime) as { total: number }).total;

  // 6. Stock Out during period
  const stockOutPeriod = (db.prepare(`
    SELECT COALESCE(ABS(SUM(quantity)), 0) as total 
    FROM stock_transactions 
    WHERE transaction_type = 'STOCK_OUT' AND created_at BETWEEN ? AND ?
  `).get(startDateTime, endDateTime) as { total: number }).total;

  // 7. Low Stock Items count
  const lowStockCount = (db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT fi.id, fi.minimum_stock, COALESCE(SUM(ib.quantity_remaining), 0) as stock
      FROM food_items fi
      LEFT JOIN inventory_batches ib ON ib.food_item_id = fi.id AND ib.status = 'ACTIVE'
      WHERE fi.status = 'ACTIVE'
      GROUP BY fi.id
      HAVING stock <= fi.minimum_stock
    )
  `).get() as { count: number }).count;

  // 8. Expiring Soon count (<= 30 days)
  const expiringSoonCount = (db.prepare(`
    SELECT COUNT(DISTINCT food_item_id) as count 
    FROM inventory_batches 
    WHERE status = 'ACTIVE' AND quantity_remaining > 0 
      AND expiry_date <= date('now', '+30 days')
  `).get() as { count: number }).count;

  // 9. Estimated Inventory Value
  const estimatedInvValue = (db.prepare(`
    SELECT COALESCE(SUM(ib.quantity_remaining * ib.unit_cost), 0) as total
    FROM inventory_batches ib
    WHERE ib.status = 'ACTIVE'
  `).get() as { total: number }).total;

  // 10. Estimated Distributed Value in period
  const estimatedDistValue = (db.prepare(`
    SELECT COALESCE(SUM(di.quantity * ib.unit_cost), 0) as total
    FROM distribution_transactions dt
    JOIN distribution_items di ON di.distribution_transaction_id = dt.id
    JOIN inventory_batches ib ON di.batch_id = ib.id
    WHERE dt.created_at BETWEEN ? AND ?
  `).get(startDateTime, endDateTime) as { total: number }).total;

  return {
    total_students: totalStudents,
    students_served: studentsServed,
    food_items_count: foodItemsCount,
    current_total_stock: currentTotalStock,
    stock_in_period: stockInPeriod,
    stock_out_period: stockOutPeriod,
    low_stock_count: lowStockCount,
    expiring_soon_count: expiringSoonCount,
    estimated_inventory_value: Math.round(estimatedInvValue * 100) / 100,
    estimated_distributed_value: Math.round(estimatedDistValue * 100) / 100,
  };
}

export function getChartDailyDistribution(startDate: string, endDate: string) {
  const db = getDatabase();
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;

  const query = `
    SELECT 
      strftime('%d/%m', created_at) as date_label,
      date(created_at) as raw_date,
      COUNT(id) as total_visits,
      SUM(total_items) as total_items
    FROM distribution_transactions
    WHERE created_at BETWEEN ? AND ?
    GROUP BY date(created_at)
    ORDER BY date(created_at) ASC
  `;
  return db.prepare(query).all(startDateTime, endDateTime);
}

export function getChartStockInVsOut(startDate: string, endDate: string) {
  const db = getDatabase();
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;

  const query = `
    SELECT 
      strftime('%d/%m', created_at) as date_label,
      date(created_at) as raw_date,
      SUM(CASE WHEN transaction_type = 'STOCK_IN' THEN quantity ELSE 0 END) as stock_in,
      SUM(CASE WHEN transaction_type = 'STOCK_OUT' THEN ABS(quantity) ELSE 0 END) as stock_out
    FROM stock_transactions
    WHERE created_at BETWEEN ? AND ?
    GROUP BY date(created_at)
    ORDER BY date(created_at) ASC
  `;
  return db.prepare(query).all(startDateTime, endDateTime);
}

export function getChartDistributionByCategory(startDate: string, endDate: string) {
  const db = getDatabase();
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;

  const query = `
    SELECT 
      fc.name as category,
      SUM(di.quantity) as total_quantity
    FROM distribution_transactions dt
    JOIN distribution_items di ON di.distribution_transaction_id = dt.id
    JOIN food_items fi ON di.food_item_id = fi.id
    JOIN food_categories fc ON fi.category_id = fc.id
    WHERE dt.created_at BETWEEN ? AND ?
    GROUP BY fc.id
    ORDER BY total_quantity DESC
  `;
  return db.prepare(query).all(startDateTime, endDateTime);
}

export function getChartStudentsByProgramme(startDate: string, endDate: string) {
  const db = getDatabase();
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;

  const query = `
    SELECT 
      p.programme_name as programme,
      p.programme_code,
      COUNT(DISTINCT dt.student_id) as students_count,
      COUNT(dt.id) as visits_count
    FROM distribution_transactions dt
    JOIN students s ON dt.student_id = s.id
    JOIN programmes p ON s.programme_id = p.id
    WHERE dt.created_at BETWEEN ? AND ?
    GROUP BY p.id
    ORDER BY students_count DESC
  `;
  return db.prepare(query).all(startDateTime, endDateTime);
}

export function getChartTopDistributedItems(startDate: string, endDate: string) {
  const db = getDatabase();
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;

  const query = `
    SELECT 
      fi.name as item_name,
      fi.item_code,
      fi.unit,
      SUM(di.quantity) as total_distributed
    FROM distribution_transactions dt
    JOIN distribution_items di ON di.distribution_transaction_id = dt.id
    JOIN food_items fi ON di.food_item_id = fi.id
    WHERE dt.created_at BETWEEN ? AND ?
    GROUP BY fi.id
    ORDER BY total_distributed DESC
    LIMIT 10
  `;
  return db.prepare(query).all(startDateTime, endDateTime);
}

export function getChartMonthlyUsage() {
  const db = getDatabase();
  const query = `
    SELECT 
      strftime('%m/%Y', created_at) as month_year,
      strftime('%Y-%m', created_at) as sort_key,
      COUNT(DISTINCT student_id) as unique_students,
      COUNT(id) as total_visits,
      SUM(total_items) as total_items
    FROM distribution_transactions
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY sort_key ASC
    LIMIT 12
  `;
  return db.prepare(query).all();
}

export function getRestockRecommendations(): RestockRecommendation[] {
  const db = getDatabase();
  const items = db.prepare(`
    SELECT 
      fi.id as food_item_id,
      fi.item_code,
      fi.name as food_name,
      fi.minimum_stock,
      fi.unit,
      COALESCE((SELECT SUM(ib.quantity_remaining) FROM inventory_batches ib WHERE ib.food_item_id = fi.id AND ib.status = 'ACTIVE'), 0) as current_stock,
      COALESCE((
        SELECT ABS(SUM(st.quantity)) 
        FROM stock_transactions st 
        WHERE st.food_item_id = fi.id AND st.transaction_type = 'STOCK_OUT' AND st.created_at >= date('now', '-30 days')
      ), 0) as monthly_distribution
    FROM food_items fi
    WHERE fi.status = 'ACTIVE'
  `).all() as any[];

  return items.map(item => {
    const monthlyDist = Number(item.monthly_distribution || 0);
    const currentStock = Number(item.current_stock || 0);
    const minStock = Number(item.minimum_stock || 20);

    const avgDailyUsage = Math.max(0.5, Math.round((monthlyDist / 30) * 10) / 10);
    const estimatedDaysRemaining = avgDailyUsage > 0 ? Math.floor(currentStock / avgDailyUsage) : 999;

    let recPurchase = 0;
    let status: 'RESTOCK REQUIRED' | 'CRITICAL' | 'ADEQUATE' = 'ADEQUATE';

    if (currentStock <= Math.floor(minStock * 0.4) || estimatedDaysRemaining <= 5) {
      status = 'CRITICAL';
      recPurchase = Math.max(50, (minStock * 2) - currentStock);
    } else if (currentStock <= minStock || estimatedDaysRemaining <= 14) {
      status = 'RESTOCK REQUIRED';
      recPurchase = Math.max(30, (minStock * 1.5) - currentStock);
    }

    return {
      food_item_id: item.food_item_id,
      item_code: item.item_code,
      food_name: item.food_name,
      current_stock: currentStock,
      minimum_stock: minStock,
      monthly_distribution: monthlyDist,
      average_daily_usage: avgDailyUsage,
      estimated_days_remaining: estimatedDaysRemaining,
      recommended_purchase_quantity: Math.ceil(recPurchase),
      unit: item.unit,
      status
    };
  }).sort((a, b) => {
    const order = { 'CRITICAL': 1, 'RESTOCK REQUIRED': 2, 'ADEQUATE': 3 };
    return order[a.status] - order[b.status];
  });
}

export function getScorecardMetrics() {
  const db = getDatabase();
  const totalStudentsAssisted = (db.prepare(`SELECT COUNT(DISTINCT student_id) as cnt FROM distribution_transactions`).get() as { cnt: number }).cnt;
  const totalVisits = (db.prepare(`SELECT COUNT(*) as cnt FROM distribution_transactions`).get() as { cnt: number }).cnt;
  const totalItemsDistributed = (db.prepare(`SELECT COALESCE(SUM(total_items), 0) as cnt FROM distribution_transactions`).get() as { cnt: number }).cnt;
  const totalStockReceived = (db.prepare(`SELECT COALESCE(SUM(quantity), 0) as cnt FROM stock_transactions WHERE transaction_type = 'STOCK_IN'`).get() as { cnt: number }).cnt;
  const stockRemaining = (db.prepare(`SELECT COALESCE(SUM(quantity_remaining), 0) as cnt FROM inventory_batches WHERE status = 'ACTIVE'`).get() as { cnt: number }).cnt;
  
  const estimatedValueDistributed = (db.prepare(`
    SELECT COALESCE(SUM(di.quantity * ib.unit_cost), 0) as val
    FROM distribution_transactions dt
    JOIN distribution_items di ON di.distribution_transaction_id = dt.id
    JOIN inventory_batches ib ON di.batch_id = ib.id
  `).get() as { val: number }).val;

  const expiredCount = (db.prepare(`SELECT COUNT(*) as cnt FROM inventory_batches WHERE status = 'EXPIRED' OR (expiry_date < date('now') AND quantity_remaining > 0)`).get() as { cnt: number }).cnt;
  const damagedItems = (db.prepare(`SELECT COALESCE(ABS(SUM(quantity)), 0) as cnt FROM stock_transactions WHERE transaction_type = 'DAMAGED'`).get() as { cnt: number }).cnt;

  const repeatVisits = totalVisits - totalStudentsAssisted;
  const utilizationRate = totalStockReceived > 0 ? Math.round((totalItemsDistributed / totalStockReceived) * 100) : 0;

  return {
    total_students_assisted: totalStudentsAssisted,
    total_visits: totalVisits,
    total_items_distributed: totalItemsDistributed,
    total_stock_received: totalStockReceived,
    stock_remaining: stockRemaining,
    estimated_value_distributed: Math.round(estimatedValueDistributed * 100) / 100,
    expired_items: expiredCount,
    damaged_items: damagedItems,
    utilization_rate: utilizationRate,
    repeat_visits: Math.max(0, repeatVisits)
  };
}
