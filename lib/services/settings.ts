import { getDatabase } from '@/lib/db';
import { SystemSetting } from '@/lib/types';
import { logAudit } from './audit';

export function getSystemSettings(): Record<string, string> {
  const db = getDatabase();
  const rows = db.prepare(`SELECT setting_key, setting_value FROM system_settings`).all() as { setting_key: string; setting_value: string }[];
  return Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));
}

export function updateSystemSettings(settings: Record<string, string>, userId?: number): { success: boolean; error?: string } {
  const db = getDatabase();
  try {
    const stmt = db.prepare(`
      INSERT INTO system_settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_at = CURRENT_TIMESTAMP
    `);

    const updateMany = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(key, String(value));
      }

      logAudit({
        userId,
        action: 'UPDATE_SETTINGS',
        module: 'SETTINGS',
        description: 'Kemaskini tetapan sistem JOM KENYANG'
      });
    });

    updateMany();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan tetapan.' };
  }
}
