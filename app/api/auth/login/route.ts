import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession } from '@/lib/services/auth';
import { logAudit } from '@/lib/services/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || '').trim();
    const password = body.password ? body.password.trim() : undefined;
    const isStudentLogin = body.isStudentLogin || body.role === 'student' || (!password && identifier);

    if (!identifier) {
      return NextResponse.json({ 
        success: false, 
        error: isStudentLogin ? 'Sila masukkan No. Kad Pengenalan atau ID Pelajar anda.' : 'Sila masukkan ID Pengguna dan kata laluan.' 
      }, { status: 400 });
    }

    if (!isStudentLogin && !password) {
      return NextResponse.json({ success: false, error: 'Sila masukkan kata laluan.' }, { status: 400 });
    }

    const authResult = await authenticateUser(identifier, isStudentLogin ? undefined : password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ success: false, error: authResult.error || 'Log masuk gagal.' }, { status: 401 });
    }

    const user = authResult.user;
    await createSession({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      student_id: user.role === 'student' ? (user.student_id || user.username) : undefined
    });

    logAudit({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      description: `Pengguna ${user.name} (${user.username}) berjaya log masuk dengan peranan ${user.role}`
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Ralat pelayan semasa log masuk.' }, { status: 500 });
  }
}
