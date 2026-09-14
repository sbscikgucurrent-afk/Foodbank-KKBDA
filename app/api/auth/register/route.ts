import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { createSession } from '@/lib/services/auth';
import { logAudit } from '@/lib/services/audit';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDatabase();

    const name = (body.name || '').trim();
    const rawIc = (body.ic_number || '').trim();
    const icDigits = rawIc.replace(/[^0-9]/g, '');
    let studentId = (body.student_id || '').trim().toUpperCase();
    const programmeId = Number(body.programme_id || 1);
    const semester = Number(body.semester || 1);
    const classGroup = (body.class_group || 'A').trim().toUpperCase();
    const phone = (body.phone || '').trim();
    const passwordPlain = (body.password || body.ic_number || 'student123').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Sila masukkan nama penuh pelajar.' }, { status: 400 });
    }

    if (!rawIc || icDigits.length < 6) {
      return NextResponse.json({ success: false, error: 'Sila masukkan nombor kad pengenalan yang sah (cth: 050214-02-5542).' }, { status: 400 });
    }

    // Auto generate Student ID if not provided
    if (!studentId) {
      const allStudents = db.prepare(`SELECT student_id FROM students`).all() as any[];
      let nextNum = allStudents.length + 1;
      studentId = `KKBDA${String(nextNum).padStart(3, '0')}`;
      while (allStudents.some(s => (s.student_id || '').toUpperCase() === studentId)) {
        nextNum++;
        studentId = `KKBDA${String(nextNum).padStart(3, '0')}`;
      }
    }

    const email = (body.email || `${studentId.toLowerCase()}@student.kkbda.edu.my`).trim().toLowerCase();

    // Check if IC already registered
    const existingStudents = db.prepare(`SELECT * FROM students`).all() as any[];
    const icConflict = existingStudents.find(s => {
      const sIcDigits = (s.ic_number || '').replace(/[^0-9]/g, '');
      return sIcDigits === icDigits || (s.student_id || '').toUpperCase() === studentId;
    });

    if (icConflict) {
      return NextResponse.json({ 
        success: false, 
        error: `No. Kad Pengenalan (${rawIc}) atau ID Pelajar (${studentId}) telah berdaftar dalam sistem.` 
      }, { status: 400 });
    }

    // Generate QR Token
    const qrToken = `TOKEN-${studentId}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 1. Insert into students table
    const stmtStudent = db.prepare(`
      INSERT INTO students (student_id, name, ic_number, programme_id, semester, class_group, phone, email, status, qr_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `);

    const studentRes = stmtStudent.run(
      studentId,
      name,
      rawIc,
      programmeId,
      semester,
      classGroup,
      phone,
      email,
      qrToken
    );

    // 2. Hash password & Insert into users table
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(passwordPlain, salt);

    const stmtUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, name, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `);

    const userRes = stmtUser.run(
      studentId,
      email,
      hash,
      'student',
      name
    );

    const newUserId = Number(userRes.lastInsertRowid || studentRes.lastInsertRowid || 1);

    // 3. Log Audit
    logAudit({
      userId: newUserId,
      action: 'REGISTER_STUDENT',
      module: 'AUTH',
      recordId: studentId,
      description: `Pendaftaran pelajar baharu: ${name} (${studentId}, IC: ${rawIc})`
    });

    // 4. Create Session
    await createSession({
      id: newUserId,
      username: studentId,
      role: 'student',
      name: name,
      student_id: studentId
    });

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berjaya!',
      user: {
        id: newUserId,
        username: studentId,
        name: name,
        role: 'student',
        student_id: studentId
      }
    });

  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Ralat semasa mendaftar akaun.' }, { status: 500 });
  }
}
