import { NextRequest, NextResponse } from 'next/server';
import { getFoodItemById, getItemBatches, updateFoodItem, deleteFoodItem } from '@/lib/services/inventory';
import { getCurrentUser } from '@/lib/services/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const item = getFoodItemById(params.id);
  if (!item) {
    return NextResponse.json({ success: false, error: 'Item makanan tidak dijumpai.' }, { status: 404 });
  }

  const batches = getItemBatches(item.id);
  return NextResponse.json({ success: true, item, batches });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const result = updateFoodItem(params.id, {
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const result = deleteFoodItem(params.id, user?.id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
