import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  const db = getDatabase();
  const notifications = db.prepare(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30`).all();
  return NextResponse.json({ notifications });
}

export async function POST() {
  const db = getDatabase();
  db.prepare(`UPDATE notifications SET status = 'READ'`).run();
  return NextResponse.json({ success: true });
}
