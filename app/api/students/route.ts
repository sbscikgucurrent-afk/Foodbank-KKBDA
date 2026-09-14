import { NextRequest, NextResponse } from 'next/server';
import { getStudents, createStudent } from '@/lib/services/students';
import { getCurrentUser } from '@/lib/services/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const programme_id = searchParams.get('programme_id') ? Number(searchParams.get('programme_id')) : undefined;
  const semester = searchParams.get('semester') ? Number(searchParams.get('semester')) : undefined;
  const status = searchParams.get('status') || undefined;

  const result = getStudents({ search, programme_id, semester, status, limit: 200 });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const result = createStudent({
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
