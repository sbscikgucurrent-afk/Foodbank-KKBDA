import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, updateUser, resetUserPassword, toggleUserStatus } from '@/lib/services/users';
import { getCurrentUser } from '@/lib/services/auth';

export async function GET() {
  const users = getUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();

    if (body.action === 'reset_password') {
      const res = resetUserPassword(body.userId, body.newPassword, currentUser?.id);
      return NextResponse.json(res);
    }

    if (body.action === 'toggle_status') {
      const res = toggleUserStatus(body.userId, currentUser?.id);
      return NextResponse.json(res);
    }

    if (body.action === 'update' || body.userId) {
      const res = updateUser(Number(body.userId), {
        ...body,
        password_plain: body.password || body.password_plain,
        currentUserId: currentUser?.id
      });
      return NextResponse.json(res);
    }

    const res = createUser({
      ...body,
      password_plain: body.password || body.password_plain,
      currentUserId: currentUser?.id
    });

    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();
    const userId = Number(body.id || body.userId);
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'ID pengguna tidak sah.' }, { status: 400 });
    }

    const res = updateUser(userId, {
      ...body,
      password_plain: body.password || body.password_plain,
      currentUserId: currentUser?.id
    });

    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
