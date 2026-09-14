import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || undefined;
  const food_item_id = searchParams.get('food_item_id') ? Number(searchParams.get('food_item_id')) : undefined;

  let query = `
    SELECT 
      st.*,
      fi.name as food_item_name,
      fi.item_code,
      fi.unit,
      ib.batch_number,
      s.name as student_name,
      s.student_id as student_code,
      u.name as operator_name
    FROM stock_transactions st
    JOIN food_items fi ON st.food_item_id = fi.id
    LEFT JOIN inventory_batches ib ON st.batch_id = ib.id
    LEFT JOIN students s ON st.student_id = s.id
    LEFT JOIN users u ON st.operator_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (type && type !== 'ALL') {
    query += ` AND st.transaction_type = ?`;
    params.push(type);
  }

  if (food_item_id) {
    query += ` AND st.food_item_id = ?`;
    params.push(food_item_id);
  }

  query += ` ORDER BY st.created_at DESC LIMIT 200`;

  const rows = db.prepare(query).all(...params);
  return NextResponse.json({ transactions: rows });
}
