import { NextRequest, NextResponse } from 'next/server';
import { getStudentById, updateStudent, toggleStudentStatus, deleteStudent, getStudentCollectionHistory } from '@/lib/services/students';
import { getCurrentUser } from '@/lib/services/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const student = getStudentById(params.id);
  if (!student) {
    return NextResponse.json({ success: false, error: 'Pelajar tidak dijumpai.' }, { status: 404 });
  }

  const history = getStudentCollectionHistory(student.id);
  return NextResponse.json({ success: true, student, history });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    if (body.action === 'toggle_status') {
      const result = toggleStudentStatus(Number(params.id), user?.id);
      return NextResponse.json(result);
    }

    const result = updateStudent(Number(params.id), {
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
    const result = deleteStudent(Number(params.id), user?.id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
