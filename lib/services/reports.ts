import { getDatabase } from '@/lib/db';
import { format } from 'date-fns';

export interface ReportFilter {
  report_type: string;
  date_from?: string;
  date_to?: string;
  programme_id?: number;
  semester?: number;
  category_id?: number;
  food_item_id?: number;
  student_id?: number;
  operator_id?: number;
  transaction_type?: string;
}

export function generateReportData(filter: ReportFilter) {
  const db = getDatabase();
  const dateFrom = filter.date_from ? `${filter.date_from} 00:00:00` : '2020-01-01 00:00:00';
  const dateTo = filter.date_to ? `${filter.date_to} 23:59:59` : '2030-12-31 23:59:59';

  switch (filter.report_type) {
    case 'student_collection': {
      let q = `
        SELECT 
          dt.transaction_code,
          dt.created_at,
          s.student_id as student_code,
          s.name as student_name,
          p.programme_name,
          s.semester,
          fi.name as food_item,
          fi.item_code,
          di.quantity,
          u.name as operator_name,
          dt.override_used,
          dt.override_reason
        FROM distribution_transactions dt
        JOIN distribution_items di ON di.distribution_transaction_id = dt.id
        JOIN food_items fi ON di.food_item_id = fi.id
        JOIN students s ON dt.student_id = s.id
        JOIN programmes p ON s.programme_id = p.id
        JOIN users u ON dt.operator_id = u.id
        WHERE dt.created_at BETWEEN ? AND ?
      `;
      const params: any[] = [dateFrom, dateTo];
      if (filter.programme_id) { q += ` AND s.programme_id = ?`; params.push(filter.programme_id); }
      if (filter.semester) { q += ` AND s.semester = ?`; params.push(filter.semester); }
      if (filter.food_item_id) { q += ` AND fi.id = ?`; params.push(filter.food_item_id); }
      if (filter.student_id) { q += ` AND s.id = ?`; params.push(filter.student_id); }
      q += ` ORDER BY dt.created_at DESC`;
      return { type: 'student_collection', title: 'LAPORAN PENGAMBILAN MAKANAN PELAJAR', rows: db.prepare(q).all(...params) };
    }

    case 'stock_in': {
      let q = `
        SELECT 
          st.transaction_code,
          st.created_at,
          fi.name as food_item,
          fi.item_code,
          fi.unit,
          st.quantity,
          ib.batch_number,
          ib.expiry_date,
          ib.source,
          ib.unit_cost,
          (st.quantity * ib.unit_cost) as total_cost,
          u.name as received_by,
          st.remarks
        FROM stock_transactions st
        JOIN food_items fi ON st.food_item_id = fi.id
        LEFT JOIN inventory_batches ib ON st.batch_id = ib.id
        LEFT JOIN users u ON st.operator_id = u.id
        WHERE st.transaction_type = 'STOCK_IN' AND st.created_at BETWEEN ? AND ?
      `;
      const params: any[] = [dateFrom, dateTo];
      if (filter.food_item_id) { q += ` AND fi.id = ?`; params.push(filter.food_item_id); }
      if (filter.category_id) { q += ` AND fi.category_id = ?`; params.push(filter.category_id); }
      q += ` ORDER BY st.created_at DESC`;
      return { type: 'stock_in', title: 'LAPORAN TERIMAAN STOK (STOCK IN)', rows: db.prepare(q).all(...params) };
    }

    case 'stock_out': {
      let q = `
        SELECT 
          st.transaction_code,
          st.created_at,
          fi.name as food_item,
          fi.item_code,
          fi.unit,
          ABS(st.quantity) as quantity,
          s.name as student_name,
          s.student_id as student_code,
          u.name as operator_name,
          st.remarks
        FROM stock_transactions st
        JOIN food_items fi ON st.food_item_id = fi.id
        LEFT JOIN students s ON st.student_id = s.id
        LEFT JOIN users u ON st.operator_id = u.id
        WHERE st.transaction_type = 'STOCK_OUT' AND st.created_at BETWEEN ? AND ?
      `;
      const params: any[] = [dateFrom, dateTo];
      if (filter.food_item_id) { q += ` AND fi.id = ?`; params.push(filter.food_item_id); }
      q += ` ORDER BY st.created_at DESC`;
      return { type: 'stock_out', title: 'LAPORAN KELUARAN STOK (STOCK OUT)', rows: db.prepare(q).all(...params) };
    }

    case 'inventory': {
      let q = `
        SELECT 
          fi.item_code,
          fi.name as food_item,
          fc.name as category,
          fi.unit,
          COALESCE(SUM(ib.quantity_remaining), 0) as current_stock,
          fi.minimum_stock,
          fi.estimated_unit_cost,
          (COALESCE(SUM(ib.quantity_remaining), 0) * fi.estimated_unit_cost) as estimated_value,
          MIN(ib.expiry_date) as earliest_expiry,
          fi.status
        FROM food_items fi
        JOIN food_categories fc ON fi.category_id = fc.id
        LEFT JOIN inventory_batches ib ON ib.food_item_id = fi.id AND ib.status = 'ACTIVE'
        WHERE 1=1
      `;
      const params: any[] = [];
      if (filter.category_id) { q += ` AND fi.category_id = ?`; params.push(filter.category_id); }
      q += ` GROUP BY fi.id ORDER BY fi.item_code ASC`;
      return { type: 'inventory', title: 'LAPORAN KEDUDUKAN INVENTORI SEMASA', rows: db.prepare(q).all(...params) };
    }

    case 'expiry': {
      let q = `
        SELECT 
          fi.item_code,
          fi.name as food_item,
          fc.name as category,
          ib.batch_number,
          ib.quantity_remaining,
          fi.unit,
          ib.expiry_date,
          ib.received_date,
          ib.source,
          CAST(JULIANDAY(ib.expiry_date) - JULIANDAY('now') AS INTEGER) as days_remaining
        FROM inventory_batches ib
        JOIN food_items fi ON ib.food_item_id = fi.id
        JOIN food_categories fc ON fi.category_id = fc.id
        WHERE ib.quantity_remaining > 0 AND ib.status = 'ACTIVE'
        ORDER BY ib.expiry_date ASC
      `;
      return { type: 'expiry', title: 'LAPORAN PEMANTAUAN TARIKH LUPUT MAKANAN', rows: db.prepare(q).all() };
    }

    case 'programme_usage': {
      let q = `
        SELECT 
          p.programme_code,
          p.programme_name,
          COUNT(DISTINCT dt.student_id) as total_students_assisted,
          COUNT(dt.id) as total_visits,
          COALESCE(SUM(dt.total_items), 0) as total_items_received
        FROM programmes p
        LEFT JOIN students s ON s.programme_id = p.id
        LEFT JOIN distribution_transactions dt ON dt.student_id = s.id AND dt.created_at BETWEEN ? AND ?
        GROUP BY p.id
        ORDER BY total_students_assisted DESC
      `;
      return { type: 'programme_usage', title: 'LAPORAN PENGGUNAAN FOODBANK MENGIKUT PROGRAM PENGAJIAN', rows: db.prepare(q).all(dateFrom, dateTo) };
    }

    default: {
      // General Distribution / Daily / Weekly / Monthly / Semester / Yearly
      let q = `
        SELECT 
          dt.transaction_code,
          dt.created_at,
          s.student_id as student_code,
          s.name as student_name,
          p.programme_code,
          dt.total_items,
          u.name as operator_name,
          dt.override_used
        FROM distribution_transactions dt
        JOIN students s ON dt.student_id = s.id
        JOIN programmes p ON s.programme_id = p.id
        JOIN users u ON dt.operator_id = u.id
        WHERE dt.created_at BETWEEN ? AND ?
        ORDER BY dt.created_at DESC
      `;
      return { type: filter.report_type || 'distribution', title: `LAPORAN FOODBANK: ${filter.report_type.toUpperCase().replace(/_/g, ' ')}`, rows: db.prepare(q).all(dateFrom, dateTo) };
    }
  }
}
