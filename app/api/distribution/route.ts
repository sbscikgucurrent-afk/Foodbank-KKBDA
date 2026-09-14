import { NextRequest, NextResponse } from 'next/server';
import { processFoodDistribution, getRecentDistributions } from '@/lib/services/distribution';
import { getCurrentUser } from '@/lib/services/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;

  const distributions = getRecentDistributions({ search, limit });
  return NextResponse.json({ distributions });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const operatorId = user?.id || body.operator_id || 3;

    const result = processFoodDistribution({
      student_id: body.student_id,
      operator_id: operatorId,
      items: body.items,
      override: body.override,
      override_reason: body.override_reason
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
