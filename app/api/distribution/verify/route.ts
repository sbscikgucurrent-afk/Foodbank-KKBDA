import { NextRequest, NextResponse } from 'next/server';
import { verifyStudentForDistribution } from '@/lib/services/distribution';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get('identifier');

  if (!identifier) {
    return NextResponse.json({ success: false, error: 'Sila masukkan atau imbas ID Pelajar.' }, { status: 400 });
  }

  const result = verifyStudentForDistribution(identifier);
  return NextResponse.json({
    success: result.allowed || result.daily_limit_reached,
    ...result
  });
}
