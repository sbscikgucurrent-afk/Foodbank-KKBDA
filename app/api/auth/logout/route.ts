import { NextResponse } from 'next/server';
import { logout, getCurrentUser } from '@/lib/services/auth';
import { logAudit } from '@/lib/services/audit';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      logAudit({
        userId: user.id,
        action: 'LOGOUT',
        module: 'AUTH',
        description: `Pengguna ${user.name} (${user.username}) telah log keluar`
      });
    }
  } catch (e) {}

  await logout();
  const response = NextResponse.json({ success: true, message: 'Berjaya log keluar' });
  response.cookies.set('madani_foodbank_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0)
  });
  return response;
}

export async function GET() {
  return POST();
}
