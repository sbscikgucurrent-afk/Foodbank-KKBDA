import { getDatabase } from '@/lib/db';
import { User, UserRole } from '@/lib/types';
import bcrypt from 'bcryptjs';
import { logAudit } from './audit';

export function getUsers(): User[] {
  const db = getDatabase();
  const query = `
    SELECT id, username, email, role, name, status, last_login, created_at
    FROM users
    ORDER BY id ASC
  `;
  return db.prepare(query).all() as User[];
}

export function createUser(data: {
  username: string;
  email: string;
  password_plain: string;
  role: UserRole;
  name: string;
  currentUserId?: number;
}): { success: boolean; user?: User; error?: string } {
  const db = getDatabase();
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(data.password_plain, salt);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, name, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `);

    const res = stmt.run(
      data.username.trim().toLowerCase(),
      data.email.trim().toLowerCase(),
      hash,
      data.role,
      data.name.trim()
    );

    const newUser = db.prepare(`
      SELECT id, username, email, role, name, status, last_login, created_at
      FROM users WHERE id = ?
    `).get(res.lastInsertRowid) as User;

    logAudit({
      userId: data.currentUserId,
      action: 'ADD_USER',
      module: 'USERS',
      recordId: data.username,
      description: `Cipta pengguna sistem: ${data.name} (${data.role})`
    });

    return { success: true, user: newUser };
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'Nama pengguna atau emel telah wujud.' };
    }
    return { success: false, error: err.message || 'Gagal mencipta pengguna.' };
  }
}

export function resetUserPassword(userId: number, newPasswordPlain: string, currentUserId?: number): { success: boolean; error?: string } {
  const db = getDatabase();
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPasswordPlain, salt);

    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, userId);
    const u = db.prepare(`SELECT username FROM users WHERE id = ?`).get(userId) as { username: string };

    logAudit({
      userId: currentUserId,
      action: 'RESET_PASSWORD',
      module: 'USERS',
      recordId: u?.username,
      description: `Reset kata laluan untuk pengguna ${u?.username}`
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function toggleUserStatus(userId: number, currentUserId?: number): { success: boolean; status?: string; error?: string } {
  const db = getDatabase();
  try {
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as User | undefined;
    if (!user) return { success: false, error: 'Pengguna tidak dijumpai.' };

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    db.prepare(`UPDATE users SET status = ? WHERE id = ?`).run(newStatus, userId);

    logAudit({
      userId: currentUserId,
      action: 'TOGGLE_STATUS',
      module: 'USERS',
      recordId: user.username,
      description: `Tukar status pengguna ${user.username} kepada ${newStatus}`
    });

    return { success: true, status: newStatus };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function updateUser(userId: number, data: {
  username?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  status?: string;
  password_plain?: string;
  currentUserId?: number;
}): { success: boolean; user?: User; error?: string } {
  const db = getDatabase();
  try {
    const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as User | undefined;
    if (!existing) return { success: false, error: 'Pengguna tidak dijumpai.' };

    const username = (data.username || existing.username).trim().toLowerCase();
    const name = (data.name || existing.name).trim();
    const email = (data.email !== undefined ? data.email : existing.email).trim().toLowerCase();
    const role = (data.role || existing.role);
    const status = (data.status || existing.status);

    if (data.password_plain && data.password_plain.trim()) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(data.password_plain.trim(), salt);
      db.prepare(`UPDATE users SET username = ?, name = ?, email = ?, role = ?, status = ?, password_hash = ? WHERE id = ?`)
        .run(username, name, email, role, status, hash, userId);
    } else {
      db.prepare(`UPDATE users SET username = ?, name = ?, email = ?, role = ?, status = ? WHERE id = ?`)
        .run(username, name, email, role, status, userId);
    }

    logAudit({
      userId: data.currentUserId,
      action: 'UPDATE_USER',
      module: 'USERS',
      recordId: username,
      description: `Kemaskini maklumat pengguna: ${name} (${username}, ${role})`
    });

    const updated = db.prepare(`SELECT id, username, email, role, name, status, last_login, created_at FROM users WHERE id = ?`).get(userId) as User;
    return { success: true, user: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengemaskini pengguna.' };
  }
}
