import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings, updateSystemSettings } from '@/lib/services/settings';
import { getCurrentUser } from '@/lib/services/auth';

export async function GET() {
  const settings = getSystemSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const result = updateSystemSettings(body.settings, user?.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
