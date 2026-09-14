import { NextRequest, NextResponse } from 'next/server';
import { recordInventoryAdjustment } from '@/lib/services/inventory';
import { getCurrentUser } from '@/lib/services/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const result = recordInventoryAdjustment({
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
