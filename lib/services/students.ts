import { getDatabase } from '@/lib/db';
import { Student } from '@/lib/types';
import { logAudit } from './audit';

export function getStudents(options?: {
  search?: string;
  programme_id?: number;
  semester?: number;
  status?: string;
  limit?: number;
  offset?: number;
}): { students: Student[]; total: number } {
  const db = getDatabase();
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  let query = `
    SELECT s.*, p.programme_name, p.programme_code,
      (SELECT COUNT(*) FROM distribution_transactions dt WHERE dt.student_id = s.id) as total_visits,
      (SELECT COALESCE(SUM(di.quantity), 0) 
       FROM distribution_transactions dt 
       JOIN distribution_items di ON di.distribution_transaction_id = dt.id 
       WHERE dt.student_id = s.id) as total_items_received,
      (SELECT MAX(dt.created_at) FROM distribution_transactions dt WHERE dt.student_id = s.id) as last_visit,
      (SELECT MIN(dt.created_at) FROM distribution_transactions dt WHERE dt.student_id = s.id) as first_visit
    FROM students s
    JOIN programmes p ON s.programme_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.search) {
    query += ` AND (s.student_id LIKE ? OR s.name LIKE ? OR s.ic_number LIKE ? OR s.phone LIKE ? OR s.email LIKE ?)`;
    const searchPattern = `%${options.search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (options?.programme_id) {
    query += ` AND s.programme_id = ?`;
    params.push(options.programme_id);
  }

  if (options?.semester) {
    query += ` AND s.semester = ?`;
    params.push(options.semester);
  }

  if (options?.status && options.status !== 'ALL') {
    query += ` AND s.status = ?`;
    params.push(options.status);
  }

  const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
  const countRow = db.prepare(countQuery).get(...params) as { total: number };

  query += ` ORDER BY s.student_id ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const students = db.prepare(query).all(...params) as Student[];
  return { students, total: countRow ? countRow.total : 0 };
}

export function getStudentById(id: number | string): Student | null {
  const db = getDatabase();
  const query = `
    SELECT s.*, p.programme_name, p.programme_code,
      (SELECT COUNT(*) FROM distribution_transactions dt WHERE dt.student_id = s.id) as total_visits,
      (SELECT COALESCE(SUM(di.quantity), 0) 
       FROM distribution_transactions dt 
       JOIN distribution_items di ON di.distribution_transaction_id = dt.id 
       WHERE dt.student_id = s.id) as total_items_received,
      (SELECT MAX(dt.created_at) FROM distribution_transactions dt WHERE dt.student_id = s.id) as last_visit,
      (SELECT MIN(dt.created_at) FROM distribution_transactions dt WHERE dt.student_id = s.id) as first_visit
    FROM students s
    JOIN programmes p ON s.programme_id = p.id
    WHERE s.id = ? OR s.student_id = ? OR s.qr_token = ?
  `;
  return (db.prepare(query).get(id, id, id) as Student) || null;
}

export function getStudentCollectionHistory(studentId: number | string): any[] {
  const db = getDatabase();
  const query = `
    SELECT 
      dt.id as transaction_id,
      dt.transaction_code,
      dt.created_at,
      COALESCE(u.name, 'Petugas Dapur') as operator_name,
      COALESCE(fi.name, 'Pakej Bantuan Makanan') as food_item_name,
      COALESCE(fi.item_code, 'FDB') as item_code,
      COALESCE(fi.unit, 'Pek') as unit,
      COALESCE(di.quantity, dt.total_items, 1) as quantity,
      COALESCE(b.batch_number, 'Umum') as batch_number
    FROM distribution_transactions dt
    LEFT JOIN distribution_items di ON di.distribution_transaction_id = dt.id
    LEFT JOIN food_items fi ON di.food_item_id = fi.id
    LEFT JOIN inventory_batches b ON di.batch_id = b.id
    LEFT JOIN users u ON dt.operator_id = u.id
    WHERE dt.student_id = ?
    ORDER BY dt.created_at DESC
  `;
  return db.prepare(query).all(studentId);
}

import bcrypt from 'bcryptjs';

export function createStudent(data: {
  student_id: string;
  name: string;
  ic_number: string;
  programme_id: number;
  semester: number;
  class_group?: string;
  phone?: string;
  email?: string;
  userId?: number;
}): { success: boolean; student?: Student; error?: string } {
  const db = getDatabase();
  try {
    const cleanId = data.student_id.trim().toUpperCase();
    const qrToken = `TOKEN-${cleanId}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const stmt = db.prepare(`
      INSERT INTO students (student_id, name, ic_number, programme_id, semester, class_group, phone, email, status, qr_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `);

    const result = stmt.run(
      cleanId,
      data.name.trim(),
      data.ic_number.trim(),
      data.programme_id,
      data.semester || 1,
      data.class_group || 'A',
      data.phone || '',
      data.email || `${cleanId.toLowerCase()}@student.kkbda.edu.my`,
      qrToken
    );

    const newStudent = getStudentById(result.lastInsertRowid as number);

    // Create user login account if not already present
    try {
      const existingUser = db.prepare(`SELECT id FROM users WHERE username = ?`).get(cleanId);
      if (!existingUser) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(data.ic_number.trim() || 'student123', salt);
        db.prepare(`
          INSERT INTO users (username, email, password_hash, role, name, status)
          VALUES (?, ?, ?, 'student', ?, 'ACTIVE')
        `).run(
          cleanId,
          data.email || `${cleanId.toLowerCase()}@student.kkbda.edu.my`,
          hash,
          data.name.trim()
        );
      }
    } catch (_) {}

    logAudit({
      userId: data.userId,
      action: 'ADD_STUDENT',
      module: 'STUDENTS',
      recordId: cleanId,
      description: `Pendaftaran pelajar baru: ${data.name} (${cleanId})`
    });

    return { success: true, student: newStudent || undefined };
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'ID Pelajar atau Nombor IC telah wujud dalam sistem.' };
    }
    return { success: false, error: err.message || 'Gagal mendaftar pelajar.' };
  }
}

export function updateStudent(id: number, data: {
  name: string;
  ic_number: string;
  programme_id: number;
  semester: number;
  class_group?: string;
  phone?: string;
  email?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  userId?: number;
}): { success: boolean; student?: Student; error?: string } {
  const db = getDatabase();
  try {
    db.prepare(`
      UPDATE students 
      SET name = ?, ic_number = ?, programme_id = ?, semester = ?, class_group = ?, phone = ?, email = ?, status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.name.trim(),
      data.ic_number.trim(),
      data.programme_id,
      data.semester,
      data.class_group || 'A',
      data.phone || '',
      data.email || '',
      data.status || 'ACTIVE',
      id
    );

    const updated = getStudentById(id);

    // Sync corresponding user account if exists
    if (updated?.student_id) {
      try {
        const u = db.prepare(`SELECT id FROM users WHERE username = ?`).get(updated.student_id) as any;
        if (u) {
          db.prepare(`UPDATE users SET name = ?, email = ?, status = ? WHERE id = ?`).run(
            data.name.trim(),
            data.email || '',
            data.status || 'ACTIVE',
            u.id
          );
        }
      } catch (_) {}
    }

    logAudit({
      userId: data.userId,
      action: 'UPDATE_STUDENT',
      module: 'STUDENTS',
      recordId: updated?.student_id,
      description: `Kemaskini maklumat pelajar: ${data.name} (${updated?.student_id})`
    });

    return { success: true, student: updated || undefined };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengemaskini maklumat pelajar.' };
  }
}

export function toggleStudentStatus(id: number, userId?: number): { success: boolean; status?: string; error?: string } {
  const db = getDatabase();
  try {
    const student = getStudentById(id);
    if (!student) return { success: false, error: 'Pelajar tidak dijumpai.' };

    const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    db.prepare(`UPDATE students SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStatus, id);

    logAudit({
      userId,
      action: 'TOGGLE_STATUS',
      module: 'STUDENTS',
      recordId: student.student_id,
      description: `Status pelajar ${student.name} ditukar kepada ${newStatus}`
    });

    return { success: true, status: newStatus };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function deleteStudent(id: number, userId?: number): { success: boolean; error?: string } {
  const db = getDatabase();
  try {
    const student = getStudentById(id);
    if (!student) return { success: false, error: 'Pelajar tidak dijumpai.' };

    db.prepare(`DELETE FROM students WHERE id = ?`).run(id);

    // Also delete corresponding student user account if exists
    if (student.student_id) {
      try {
        db.prepare(`DELETE FROM users WHERE username = ? OR username = ?`).run(student.student_id, student.student_id.toLowerCase());
      } catch (_) {}
    }

    logAudit({
      userId,
      action: 'DELETE_STUDENT',
      module: 'STUDENTS',
      recordId: student.student_id,
      description: `Padam rekod pelajar: ${student.name} (${student.student_id})`
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memadam rekod pelajar.' };
  }
}
