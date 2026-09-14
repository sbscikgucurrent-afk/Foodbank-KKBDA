import { NextRequest, NextResponse } from 'next/server';
import { getFoodItems, getFoodCategories, createFoodItem } from '@/lib/services/inventory';
import { getCurrentUser } from '@/lib/services/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const category_id = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined;
  const status = searchParams.get('status') || undefined;
  const stock_filter = (searchParams.get('stock_filter') as any) || undefined;

  const items = getFoodItems({ search, category_id, status, stock_filter });
  const categories = getFoodCategories();

  return NextResponse.json({ items, categories });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const result = createFoodItem({
      ...body,
      userId: user?.id
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
