import { NextResponse } from 'next/server';
import { logout, getCurrentUser } from '@/lib/services/auth';
import { logAudit } from '@/lib/services/audit';

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    logAudit({
      userId: user.id,
      action: 'LOGOUT',
      module: 'AUTH',
      description: `Pengguna ${user.name} (${user.username}) telah log keluar`
    });
  }
  await logout();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
  return NextResponse.json({ success: true, user });
}
