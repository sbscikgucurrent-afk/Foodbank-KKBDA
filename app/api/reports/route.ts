import { NextRequest, NextResponse } from 'next/server';
import { generateReportData } from '@/lib/services/reports';
import { getFoodCategories, getFoodItems } from '@/lib/services/inventory';
import { getDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const report_type = searchParams.get('report_type') || 'student_collection';
  const date_from = searchParams.get('date_from') || undefined;
  const date_to = searchParams.get('date_to') || undefined;
  const programme_id = searchParams.get('programme_id') ? Number(searchParams.get('programme_id')) : undefined;
  const semester = searchParams.get('semester') ? Number(searchParams.get('semester')) : undefined;
  const category_id = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined;
  const food_item_id = searchParams.get('food_item_id') ? Number(searchParams.get('food_item_id')) : undefined;

  const data = generateReportData({
    report_type,
    date_from,
    date_to,
    programme_id,
    semester,
    category_id,
    food_item_id
  });

  const db = getDatabase();
  const programmes = db.prepare(`SELECT * FROM programmes`).all();
  const categories = getFoodCategories();
  const foodItems = getFoodItems();

  return NextResponse.json({
    report: data,
    programmes,
    categories,
    foodItems
  });
}
