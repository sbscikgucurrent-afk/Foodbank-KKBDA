import { getDatabase } from '@/lib/db';
import { AuditLog } from '@/lib/types';

export function logAudit(params: {
  userId?: number | null;
  action: string;
  module: string;
  recordId?: string | null;
  description: string;
  ipAddress?: string | null;
}): void {
  try {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      params.userId || null,
      params.action,
      params.module,
      params.recordId || null,
      params.description,
      params.ipAddress || '127.0.0.1'
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

export function getAuditLogs(options?: {
  module?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): { logs: AuditLog[]; total: number } {
  const db = getDatabase();
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  
  let query = `
    SELECT a.*, u.name as user_name, u.role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.module && options.module !== 'ALL') {
    query += ` AND a.module = ?`;
    params.push(options.module);
  }

  if (options?.search) {
    query += ` AND (a.description LIKE ? OR a.action LIKE ? OR u.name LIKE ? OR a.record_id LIKE ?)`;
    const searchPattern = `%${options.search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  const countQuery = query.replace('SELECT a.*, u.name as user_name, u.role', 'SELECT COUNT(*) as total');
  const countRow = db.prepare(countQuery).get(...params) as { total: number };

  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const logs = db.prepare(query).all(...params) as AuditLog[];
  return { logs, total: countRow ? countRow.total : 0 };
}
