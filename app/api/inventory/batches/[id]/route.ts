import { NextRequest, NextResponse } from 'next/server';
import { updateInventoryBatch, deleteInventoryBatch } from '@/lib/services/inventory';
import { getCurrentUser } from '@/lib/services/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const batchId = Number(params.id);
    if (!batchId || isNaN(batchId)) {
      return NextResponse.json({ success: false, error: 'ID Batch tidak sah.' }, { status: 400 });
    }

    const body = await req.json();
    const res = updateInventoryBatch(batchId, {
      ...body,
      userId: user?.id
    });

    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const batchId = Number(params.id);
    if (!batchId || isNaN(batchId)) {
      return NextResponse.json({ success: false, error: 'ID Batch tidak sah.' }, { status: 400 });
    }

    const res = deleteInventoryBatch(batchId, user?.id);
    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
