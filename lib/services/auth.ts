import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/lib/db';
import { User, UserRole } from '@/lib/types';

const SESSION_COOKIE_NAME = 'madani_foodbank_session';

export interface SessionPayload {
  id: number;
  username: string;
  role: UserRole;
  name: string;
  student_id?: string;
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const cookieStore = cookies();
  const token = Buffer.from(JSON.stringify({
    ...payload,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  })).toString('base64');

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60
  });
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const payload = JSON.parse(raw);

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function authenticateStudentDirect(identifier: string): Promise<{ success: boolean; user?: User; student?: any; error?: string }> {
  const db = getDatabase();
  const rawIdent = (identifier || '').trim();
  const lowerIdent = rawIdent.toLowerCase();
  const digitsOnlyIdent = rawIdent.replace(/[^0-9]/g, '');

  if (!rawIdent) {
    return { success: false, error: 'Sila masukkan No. Kad Pengenalan atau ID Pelajar anda.' };
  }

  // 1. Search students table by IC Number, Student ID, Email, Name, or QR Token
  const allStudents = db.prepare(`SELECT * FROM students`).all() as any[];
  
  const scoredStudents = allStudents.map(s => {
    const sId = (s.student_id || '').toLowerCase();
    const sIc = (s.ic_number || '').toLowerCase();
    const sIcDigits = sIc.replace(/[^0-9]/g, '');
    const sEmail = (s.email || '').toLowerCase();
    const sToken = (s.qr_token || '').toLowerCase();
    const sName = (s.name || '').toLowerCase().trim();

    let score = 0;
    if (sIc === lowerIdent || (digitsOnlyIdent.length >= 6 && sIcDigits === digitsOnlyIdent)) score = 100;
    else if (sId === lowerIdent) score = 95;
    else if (sToken === lowerIdent) score = 90;
    else if (sEmail === lowerIdent) score = 85;
    else if (sName === lowerIdent) score = 80;
    else if (sName.startsWith(lowerIdent)) score = 75;
    else if (sName.includes(lowerIdent)) score = 70;
    else if (lowerIdent.includes(sName)) score = 65;
    else {
      const stopWords = ['bin', 'binti', 'bt', 'b', 'anak'];
      const queryWords = lowerIdent.split(/\s+/).filter(w => w.length >= 2 && !stopWords.includes(w));
      if (queryWords.length > 0 && queryWords.every(w => sName.includes(w))) {
        score = 60;
      } else if (queryWords.length > 0 && queryWords.some(w => sName.includes(w))) {
        score = 30;
      }
    }
    return { student: s, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

  const student = scoredStudents[0]?.student;

  if (!student) {
    return { success: false, error: `No. Kad Pengenalan / Pelajar (${rawIdent}) tidak dijumpai. Sila pastikan anda telah mendaftar akaun.` };
  }

  if (student.status !== 'ACTIVE') {
    return { success: false, error: 'Akaun pelajar ini berstatus TIDAK AKTIF. Sila hubungi pegawai UAPP.' };
  }

  // Get or create user record for student
  const allUsers = db.prepare(`SELECT * FROM users`).all() as User[];
  let user = allUsers.find(u => 
    (u.username && u.username.toLowerCase() === (student.student_id || '').toLowerCase()) ||
    (u.email && student.email && u.email.toLowerCase() === student.email.toLowerCase())
  );

  if (!user) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('student123', salt);
    
    const insertRes = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, name, status)
      VALUES (?, ?, ?, 'student', ?, 'ACTIVE')
    `).run(
      student.student_id, 
      student.email || `${student.student_id.toLowerCase()}@student.kkbda.edu.my`, 
      hash, 
      student.name
    );
    
    user = {
      id: insertRes.lastInsertRowid || student.id,
      username: student.student_id,
      email: student.email || `${student.student_id.toLowerCase()}@student.kkbda.edu.my`,
      role: 'student',
      name: student.name,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };
  }

  db.prepare(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`).run(user.id);
  const userObj = { ...user, student_id: student.student_id, name: student.name, role: 'student' as UserRole };
  delete userObj.password_hash;
  return { success: true, user: userObj, student };
}

export async function authenticateUser(identifier: string, passwordPlain?: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const db = getDatabase();
  const rawIdent = (identifier || '').trim();
  const lowerIdent = rawIdent.toLowerCase();
  const digitsOnlyIdent = rawIdent.replace(/[^0-9]/g, '');

  if (!rawIdent) {
    return { success: false, error: 'Sila masukkan ID Pengguna atau No. Kad Pengenalan.' };
  }

  // If no password provided, attempt direct student IC authentication
  if (!passwordPlain) {
    return authenticateStudentDirect(rawIdent);
  }

  // 1. Search students table by IC Number, Student ID, Email, Name, or QR Token
  const allStudents = db.prepare(`SELECT * FROM students WHERE status = 'ACTIVE'`).all() as any[];
  
  // Rank students based on match precision
  const scoredStudents = allStudents.map(s => {
    const sId = (s.student_id || '').toLowerCase();
    const sIc = (s.ic_number || '').toLowerCase();
    const sIcDigits = sIc.replace(/[^0-9]/g, '');
    const sEmail = (s.email || '').toLowerCase();
    const sToken = (s.qr_token || '').toLowerCase();
    const sName = (s.name || '').toLowerCase().trim();

    let score = 0;
    if (sIc === lowerIdent || (digitsOnlyIdent.length >= 6 && sIcDigits === digitsOnlyIdent)) score = 100;
    else if (sId === lowerIdent) score = 95;
    else if (sToken === lowerIdent) score = 90;
    else if (sEmail === lowerIdent) score = 85;
    else if (sName === lowerIdent) score = 80;
    else if (sName.startsWith(lowerIdent)) score = 75;
    else if (sName.includes(lowerIdent)) score = 70;
    else if (lowerIdent.includes(sName)) score = 65;
    else {
      const stopWords = ['bin', 'binti', 'bt', 'b', 'anak'];
      const queryWords = lowerIdent.split(/\s+/).filter(w => w.length >= 2 && !stopWords.includes(w));
      if (queryWords.length > 0 && queryWords.every(w => sName.includes(w))) {
        score = 60;
      } else if (queryWords.length > 0 && queryWords.some(w => sName.includes(w))) {
        score = 30;
      }
    }
    return { student: s, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

  let student = scoredStudents[0]?.student;

  // 2. Search users table by username or email
  let user = db.prepare(`
    SELECT * FROM users 
    WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND status = 'ACTIVE'
  `).get(lowerIdent, lowerIdent) as User | undefined;

  // If found student record, link or get/create corresponding user
  if (student) {
    if (!user) {
      const allUsers = db.prepare(`SELECT * FROM users`).all() as User[];
      user = allUsers.find(u => 
        (u.username && u.username.toLowerCase() === (student.student_id || '').toLowerCase()) ||
        (u.email && student.email && u.email.toLowerCase() === student.email.toLowerCase())
      );
    }

    if (!user) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('student123', salt);
      
      const insertRes = db.prepare(`
        INSERT INTO users (username, email, password_hash, role, name, status)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE')
      `).run(student.student_id, student.email || `${student.student_id.toLowerCase()}@student.kkbda.edu.my`, hash, 'student', student.name);
      
      user = {
        id: insertRes.lastInsertRowid || student.id,
        username: student.student_id,
        email: student.email || `${student.student_id.toLowerCase()}@student.kkbda.edu.my`,
        password_hash: hash,
        role: 'student',
        name: student.name,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };
    } else {
      user.role = 'student';
      if (!user.name) user.name = student.name;
    }
  }

  if (!user) {
    return { success: false, error: 'Nama Pelajar, No. Kad Pengenalan atau ID Pengguna tidak dijumpai.' };
  }

  // 3. Verify Password
  let isPasswordCorrect = false;

  // Admin & Staff password verification: only 'admin' with password '5808'
  if (user.role !== 'student') {
    if (user.username === 'admin' && passwordPlain === '5808') {
      isPasswordCorrect = true;
    } else if (user.password_hash && bcrypt.compareSync(passwordPlain, user.password_hash)) {
      isPasswordCorrect = true;
    }
  } else {
    // Flexible student password verification (IC Number, Clean IC, Last 4 digits of IC, Student ID)
    const passDigits = passwordPlain.replace(/[^0-9]/g, '');
    const passClean = passwordPlain.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    if (student) {
      const studentIcDigits = (student.ic_number || '').replace(/[^0-9]/g, '');
      const studentIdClean = (student.student_id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      // Match IC number as password
      if (passDigits && studentIcDigits === passDigits) isPasswordCorrect = true;
      // Match Student ID as password
      if (passClean === studentIdClean) isPasswordCorrect = true;
      // Match last 4/6 digits of IC as password
      if (passDigits && passDigits.length >= 4 && studentIcDigits.endsWith(passDigits)) isPasswordCorrect = true;
    }

    // Common student fallback passwords
    if (['student123', '123456', 'password', 'kkbda123', 'siswa123'].includes(passwordPlain.toLowerCase())) {
      isPasswordCorrect = true;
    }

    // Bcrypt hash check
    if (!isPasswordCorrect && user.password_hash) {
      isPasswordCorrect = bcrypt.compareSync(passwordPlain, user.password_hash);
    }
  }

  if (!isPasswordCorrect) {
    return { success: false, error: 'Kata laluan salah. Sila cuba lagi.' };
  }

  db.prepare(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`).run(user.id);
  const userObj = { ...user };
  delete userObj.password_hash;
  return { success: true, user: userObj };
}
