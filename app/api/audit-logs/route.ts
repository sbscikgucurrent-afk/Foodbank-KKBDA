import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/services/audit';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const module = searchParams.get('module') || undefined;
  const search = searchParams.get('search') || undefined;

  const result = getAuditLogs({ module, search, limit: 100 });
  return NextResponse.json(result);
}
