import fs from 'fs';
import path from 'path';

export interface RunResult {
  lastInsertRowid: number;
  changes: number;
}

export interface Statement<T = any> {
  all(...params: any[]): T[];
  get(...params: any[]): T | undefined;
  run(...params: any[]): RunResult;
}

export interface DatabaseInterface {
  prepare(sql: string): Statement;
  exec(sql: string): void;
  transaction<F extends (...args: any[]) => any>(fn: F): F;
  pragma(pragmaSql: string): any;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'foodbank.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Always use pure JS/JSON Relational DB Engine
let nativeDb: any = null;


// In-Memory Relational Engine with JSON persistence fallback
class JsonRelationalDB implements DatabaseInterface {
  private data: {
    users: any[];
    programmes: any[];
    students: any[];
    food_categories: any[];
    food_items: any[];
    inventory_batches: any[];
    stock_transactions: any[];
    distribution_transactions: any[];
    distribution_items: any[];
    inventory_adjustments: any[];
    system_settings: any[];
    audit_logs: any[];
    notifications: any[];
    counters: Record<string, number>;
  };

  constructor() {
    this.data = this.loadData();
  }

  private loadData() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse json db:', err);
      }
    }
    return {
      users: [],
      programmes: [],
      students: [],
      food_categories: [],
      food_items: [],
      inventory_batches: [],
      stock_transactions: [],
      distribution_transactions: [],
      distribution_items: [],
      inventory_adjustments: [],
      system_settings: [],
      audit_logs: [],
      notifications: [],
      counters: {}
    };
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving db:', e);
    }
  }

  public getRawData() {
    return this.data;
  }

  pragma(p: string) {
    return null;
  }

  exec(sql: string) {
    // Schema parser or no-op since tables exist in memory
    return;
  }

  transaction<F extends (...args: any[]) => any>(fn: F): F {
    return ((...args: any[]) => {
      // Snapshot before
      const snapshot = JSON.stringify(this.data);
      try {
        const result = fn(...args);
        this.save();
        return result;
      } catch (err) {
        this.data = JSON.parse(snapshot);
        throw err;
      }
    }) as F;
  }

  prepare(sql: string): Statement {
    const self = this;
    const cleanSql = sql.trim();

    return {
      all(...params: any[]): any[] {
        return self.executeQuery(cleanSql, params);
      },
      get(...params: any[]): any | undefined {
        const rows = self.executeQuery(cleanSql, params);
        return rows[0] || undefined;
      },
      run(...params: any[]): RunResult {
        const res = self.executeMutation(cleanSql, params);
        self.save();
        return res;
      }
    };
  }

  private executeQuery(sql: string, params: any[]): any[] {
    const s = sql.toLowerCase().replace(/\s+/g, ' ');

    // 1. Settings Queries
    if (s.includes('from system_settings')) {
      if (s.includes('where setting_key = ?')) {
        return this.data.system_settings.filter(st => st.setting_key === params[0]);
      }
      return [...this.data.system_settings];
    }

    // 2. Programmes Queries
    if (s.includes('from programmes')) {
      if (s.includes('group by p.id')) {
        // programme usage
        const dateFrom = params[0] || '2020-01-01 00:00:00';
        const dateTo = params[1] || '2030-12-31 23:59:59';
        return this.data.programmes.map(p => {
          const students = this.data.students.filter(st => st.programme_id === p.id);
          const studentIds = new Set(students.map(st => st.id));
          const txs = this.data.distribution_transactions.filter(dt => studentIds.has(dt.student_id) && dt.created_at >= dateFrom && dt.created_at <= dateTo);
          const assistedIds = new Set(txs.map(t => t.student_id));
          const totalItems = txs.reduce((sum, t) => sum + (t.total_items || 0), 0);
          return {
            programme_code: p.programme_code,
            programme_name: p.programme_name,
            programme: p.programme_name,
            total_students_assisted: assistedIds.size,
            students_count: assistedIds.size,
            total_visits: txs.length,
            visits_count: txs.length,
            total_items_received: totalItems
          };
        }).sort((a, b) => b.total_students_assisted - a.total_students_assisted);
      }
      return [...this.data.programmes];
    }

    // 3. Users Queries
    if (s.includes('from users')) {
      if (s.includes('where')) {
        if (s.includes('username') && s.includes('email')) {
          const p0 = String(params[0] || '').toLowerCase();
          const p1 = String(params[1] || params[0] || '').toLowerCase();
          return this.data.users.filter(u => 
            ((u.username && u.username.toLowerCase() === p0) || 
             (u.email && u.email.toLowerCase() === p1) || 
             (u.username && u.username.toLowerCase() === p1) || 
             (u.email && u.email.toLowerCase() === p0)) && 
            u.status === 'ACTIVE'
          );
        }
        if (s.includes('username')) {
          const p0 = String(params[0] || '').toLowerCase();
          const p1 = String(params[1] || '').toLowerCase();
          return this.data.users.filter(u => 
            (u.username && u.username.toLowerCase() === p0) || 
            (p1 && u.username && u.username.toLowerCase() === p1)
          );
        }
        if (s.includes('id = ?') || s.includes('id=?')) {
          return this.data.users.filter(u => u.id === Number(params[0]));
        }
      }
      return [...this.data.users];
    }

    // 4. Food Categories Queries
    if (s.includes('from food_categories')) {
      return this.data.food_categories.map(c => ({
        ...c,
        item_count: this.data.food_items.filter(i => i.category_id === c.id && i.status === 'ACTIVE').length
      }));
    }

    // 5. Food Items Queries
    if (s.includes('from food_items')) {
      let items = this.data.food_items.map(fi => {
        const cat = this.data.food_categories.find(c => c.id === fi.category_id);
        const batches = this.data.inventory_batches.filter(b => b.food_item_id === fi.id && b.status === 'ACTIVE' && b.quantity_remaining > 0);
        const currentStock = batches.reduce((sum, b) => sum + b.quantity_remaining, 0);
        const totalReceived = this.data.inventory_batches.filter(b => b.food_item_id === fi.id).reduce((sum, b) => sum + b.quantity_received, 0);
        const totalDistributed = this.data.stock_transactions.filter(st => st.food_item_id === fi.id && st.transaction_type === 'STOCK_OUT').reduce((sum, st) => sum + Math.abs(st.quantity), 0);
        const sortedBatches = [...batches].sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
        const earliestExpiry = sortedBatches[0]?.expiry_date || null;

        return {
          ...fi,
          category_name: cat?.name || 'Lain-lain',
          category: cat?.name || 'Lain-lain',
          current_stock: currentStock,
          total_received: totalReceived,
          total_distributed: totalDistributed,
          earliest_expiry: earliestExpiry,
          estimated_value: currentStock * (fi.estimated_unit_cost || 0)
        };
      });

      if (s.includes('where fi.id = ? or fi.item_code = ?') || s.includes('where id = ?') || s.includes('fi.id = ?')) {
        return items.filter(i => 
          i.id === Number(params[0]) || 
          String(i.id) === String(params[0]) || 
          i.item_code === String(params[0]) || 
          (params[1] !== undefined && (i.id === Number(params[1]) || String(i.id) === String(params[1]) || i.item_code === String(params[1])))
        );
      }
      if (s.includes('fi.category_id = ?')) {
        const catId = params.find(p => typeof p === 'number');
        if (catId) items = items.filter(i => i.category_id === catId);
      }
      if (s.includes('fi.name like ?') || s.includes('fi.item_code like ?')) {
        const searchPattern = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
        if (searchPattern) {
          const q = searchPattern.replace(/%/g, '').toLowerCase();
          items = items.filter(i => (i.name && i.name.toLowerCase().includes(q)) || (i.item_code && i.item_code.toLowerCase().includes(q)));
        }
      }
      if (s.includes('fi.status = ?') || s.includes('status = ?')) {
        const stat = params.find(p => p === 'ACTIVE' || p === 'INACTIVE');
        if (stat) {
          items = items.filter(i => (i.status || 'ACTIVE') === stat);
        }
      } else if (s.includes("status = 'active'") || s.includes("fi.status = 'active'")) {
        items = items.filter(i => (i.status || 'ACTIVE') === 'ACTIVE');
      }
      if (s.includes('select count(*) as count from food_items where status = \'active\'')) {
        return [{ count: this.data.food_items.filter(i => (i.status || 'ACTIVE') === 'ACTIVE').length }];
      }
      return items;
    }

    // 6. Batches Queries
    if (s.includes('from inventory_batches')) {
      let batches = this.data.inventory_batches.map(b => {
        const item = this.data.food_items.find(i => i.id === b.food_item_id);
        const cat = this.data.food_categories.find(c => c.id === item?.category_id);
        return {
          ...b,
          batch_id: b.id,
          food_item_name: item?.name || '',
          item_code: item?.item_code || '',
          unit: item?.unit || 'Pek',
          category_name: cat?.name || '',
          category: cat?.name || ''
        };
      });

      if (s.includes('food_item_id = ? and quantity_remaining > 0')) {
        return batches.filter(b => b.food_item_id === params[0] && b.quantity_remaining > 0 && b.status === 'ACTIVE')
          .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
      }
      if (s.includes('select coalesce(sum(quantity_remaining), 0) as current_bal from inventory_batches where food_item_id = ?')) {
        const bal = this.data.inventory_batches.filter(b => b.food_item_id === params[0] && b.status === 'ACTIVE').reduce((sum, b) => sum + b.quantity_remaining, 0);
        return [{ current_bal: bal }];
      }
      if (s.includes('select count(distinct food_item_id) as count from inventory_batches')) {
        const nowPlus30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        const count = new Set(this.data.inventory_batches.filter(b => b.status === 'ACTIVE' && b.quantity_remaining > 0 && b.expiry_date <= nowPlus30).map(b => b.food_item_id)).size;
        return [{ count }];
      }
      if (s.includes('select count(*) as cnt from inventory_batches where status = \'expired\'')) {
        const today = new Date().toISOString().split('T')[0];
        const count = this.data.inventory_batches.filter(b => b.status === 'EXPIRED' || (b.expiry_date < today && b.quantity_remaining > 0)).length;
        return [{ cnt: count }];
      }
      if (s.includes('select coalesce(sum(quantity_remaining * unit_cost), 0) as total from inventory_batches') || s.includes('unit_cost')) {
        const val = this.data.inventory_batches.filter(b => b.status === 'ACTIVE').reduce((sum, b) => sum + (b.quantity_remaining * (b.unit_cost || 0)), 0);
        return [{ total: val, val }];
      }
      if (s.includes('select coalesce(sum(quantity_remaining), 0) as total from inventory_batches')) {
        const total = this.data.inventory_batches.filter(b => b.status === 'ACTIVE').reduce((sum, b) => sum + b.quantity_remaining, 0);
        return [{ total, cnt: total }];
      }
      return batches.filter(b => b.quantity_remaining > 0 && b.status === 'ACTIVE').sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
    }

    // 7. Students Queries
    if (s.includes('from students')) {
      let stds = this.data.students.map(st => {
        const p = this.data.programmes.find(pr => pr.id === st.programme_id);
        const dists = this.data.distribution_transactions.filter(dt => dt.student_id === st.id);
        const totalItems = dists.reduce((sum, d) => sum + (d.total_items || 0), 0);
        const dates = dists.map(d => d.created_at).sort();

        return {
          ...st,
          programme_name: p?.programme_name || '',
          programme_code: p?.programme_code || '',
          total_visits: dists.length,
          total_items_received: totalItems,
          last_visit: dates[dates.length - 1] || null,
          first_visit: dates[0] || null
        };
      });

      if (s.includes('select count(*) as count from students where status = \'active\'')) {
        return [{ count: this.data.students.filter(st => st.status === 'ACTIVE').length }];
      }

      // Single student lookup: by id, student_id, qr_token, ic_number, or email
      if (
        s.includes('where s.id = ? or s.student_id = ?') ||
        s.includes('where s.student_id = ? or s.qr_token = ?') ||
        s.includes('where s.id = ?') ||
        s.includes('where s.id=?') ||
        s.includes('where id = ?') ||
        s.includes('where student_id = ?') ||
        s.includes('where qr_token = ?')
      ) {
        const pList = params.map(p => String(p || '').toLowerCase().trim());
        const numList = params.map(p => Number(p)).filter(n => !isNaN(n));
        return stds.filter(st => {
          const stId = (st.student_id || '').toLowerCase();
          const stEmail = (st.email || '').toLowerCase();
          const stToken = (st.qr_token || '').toLowerCase();
          const stIc = (st.ic_number || '').toLowerCase();
          const stIcDigits = stIc.replace(/[^0-9]/g, '');
          const stName = (st.name || '').toLowerCase();

          return pList.includes(stId) || 
                 pList.includes(stEmail) || 
                 pList.includes(stToken) || 
                 pList.includes(stIc) ||
                 pList.includes(stName) ||
                 pList.some(p => p.length >= 6 && stIcDigits === p.replace(/[^0-9]/g, '')) ||
                 numList.includes(st.id);
        });
      }

      // List query with filters (from getStudents)
      let filtered = [...stds];
      let pIdx = 0;

      if (s.includes('s.student_id like ?') || s.includes('like ?')) {
        const searchPattern = String(params[pIdx] || '').replace(/%/g, '').toLowerCase().trim();
        pIdx += 5; // 5 search placeholder parameters
        if (searchPattern) {
          filtered = filtered.filter(st => 
            (st.student_id && st.student_id.toLowerCase().includes(searchPattern)) ||
            (st.name && st.name.toLowerCase().includes(searchPattern)) ||
            (st.ic_number && st.ic_number.replace(/[^0-9]/g, '').includes(searchPattern.replace(/[^0-9]/g, ''))) ||
            (st.phone && st.phone.includes(searchPattern)) ||
            (st.email && st.email.toLowerCase().includes(searchPattern))
          );
        }
      }

      if (s.includes('s.programme_id = ?')) {
        const progId = Number(params[pIdx++]);
        if (progId) filtered = filtered.filter(st => st.programme_id === progId);
      }

      if (s.includes('s.semester = ?')) {
        const sem = Number(params[pIdx++]);
        if (sem) filtered = filtered.filter(st => st.semester === sem);
      }

      if (s.includes('s.status = ?')) {
        const stat = String(params[pIdx++]);
        if (stat && stat !== 'ALL') filtered = filtered.filter(st => st.status === stat);
      }

      if (s.includes('select count(*) as total from')) {
        return [{ total: filtered.length }];
      }

      // Order by student_id ascending
      filtered.sort((a, b) => (a.student_id || '').localeCompare(b.student_id || ''));

      // Pagination
      if (s.includes('limit ? offset ?')) {
        const limit = Number(params[params.length - 2]) || 100;
        const offset = Number(params[params.length - 1]) || 0;
        return filtered.slice(offset, offset + limit);
      }

      return filtered;
    }

    // 8. Distribution Transactions Queries
    if (s.includes('from distribution_transactions')) {
      if (s.includes('count(distinct student_id) as count') || s.includes('count(distinct student_id) as cnt')) {
        const dateFrom = params[0] || '2020-01-01 00:00:00';
        const dateTo = params[1] || '2030-12-31 23:59:59';
        const inWindow = this.data.distribution_transactions.filter(dt => dt.created_at >= dateFrom && dt.created_at <= dateTo);
        const distinct = new Set(inWindow.map(d => d.student_id)).size;
        return [{ count: distinct, cnt: distinct }];
      }
      if (s.includes('sum(total_items) as total_items')) {
        const dateFrom = params[0] || '2020-01-01 00:00:00';
        const dateTo = params[1] || '2030-12-31 23:59:59';
        const txs = this.data.distribution_transactions.filter(dt => dt.created_at >= dateFrom && dt.created_at <= dateTo);
        const byDate: Record<string, { total_visits: number; total_items: number }> = {};
        for (const t of txs) {
          const d = t.created_at.split(' ')[0];
          if (!byDate[d]) byDate[d] = { total_visits: 0, total_items: 0 };
          byDate[d].total_visits += 1;
          byDate[d].total_items += t.total_items || 0;
        }
        return Object.entries(byDate).map(([raw_date, v]) => {
          const parts = raw_date.split('-');
          return {
            date_label: `${parts[2]}/${parts[1]}`,
            raw_date,
            total_visits: v.total_visits,
            total_items: v.total_items
          };
        }).sort((a, b) => a.raw_date.localeCompare(b.raw_date));
      }
      if (s.includes('strftime(\'%m/%y\', created_at) as month_year')) {
        const byMonth: Record<string, { unique: Set<number>; visits: number; items: number }> = {};
        for (const t of this.data.distribution_transactions) {
          const d = t.created_at.substring(0, 7); // YYYY-MM
          if (!byMonth[d]) byMonth[d] = { unique: new Set(), visits: 0, items: 0 };
          byMonth[d].unique.add(t.student_id);
          byMonth[d].visits += 1;
          byMonth[d].items += t.total_items || 0;
        }
        return Object.entries(byMonth).map(([sort_key, v]) => {
          const parts = sort_key.split('-');
          return {
            month_year: `${parts[1]}/${parts[0]}`,
            sort_key,
            unique_students: v.unique.size,
            total_visits: v.visits,
            total_items: v.items
          };
        }).sort((a, b) => a.sort_key.localeCompare(b.sort_key));
      }
      if (s.includes('student_id = ? and created_at between ? and ?')) {
        return this.data.distribution_transactions.filter(dt => dt.student_id === params[0] && dt.created_at >= params[1] && dt.created_at <= params[2]);
      }
      if (s.includes('where dt.student_id = ?') || s.includes('dt.student_id = ?') || (s.includes('student_id') && s.includes('food_items'))) {
        const stdId = Number(params[0]);
        const txs = this.data.distribution_transactions.filter(dt => dt.student_id === stdId || String(dt.student_id) === String(params[0]));
        const history: any[] = [];
        for (const dt of txs) {
          const items = this.data.distribution_items.filter(di => di.distribution_transaction_id === dt.id);
          const op = this.data.users.find(u => u.id === dt.operator_id);
          if (items.length === 0) {
            history.push({
              transaction_id: dt.id,
              transaction_code: dt.transaction_code,
              created_at: dt.created_at,
              operator_name: op?.name || 'Petugas Dapur',
              food_item_name: 'Pakej Bantuan Makanan',
              item_code: 'FDB',
              unit: 'Pek',
              quantity: dt.total_items || 1,
              batch_number: 'Umum'
            });
          } else {
            for (const di of items) {
              const fi = this.data.food_items.find(f => f.id === di.food_item_id);
              const b = this.data.inventory_batches.find(bt => bt.id === di.batch_id);
              history.push({
                transaction_id: dt.id,
                transaction_code: dt.transaction_code,
                created_at: dt.created_at,
                operator_name: op?.name || 'Petugas Dapur',
                food_item_name: fi?.name || 'Item Makanan',
                item_code: fi?.item_code || '',
                unit: fi?.unit || 'Pek',
                quantity: di.quantity,
                batch_number: b?.batch_number || 'Umum'
              });
            }
          }
        }
        return history.sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
      if (s.includes('select count(*) as cnt from distribution_transactions')) {
        return [{ cnt: this.data.distribution_transactions.length }];
      }

      // Enriched list
      return this.data.distribution_transactions.map(dt => {
        const s = this.data.students.find(st => st.id === dt.student_id);
        const p = this.data.programmes.find(pr => pr.id === s?.programme_id);
        const op = this.data.users.find(u => u.id === dt.operator_id);
        return {
          ...dt,
          student_name: s?.name || '',
          student_code: s?.student_id || '',
          programme_name: p?.programme_name || '',
          programme_code: p?.programme_code || '',
          operator_name: op?.name || 'Operator'
        };
      }).sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    // 9. Distribution Items Breakdown
    if (s.includes('from distribution_items')) {
      if (s.includes('where di.distribution_transaction_id = ?')) {
        return this.data.distribution_items.filter(di => di.distribution_transaction_id === params[0]).map(di => {
          const fi = this.data.food_items.find(i => i.id === di.food_item_id);
          const b = this.data.inventory_batches.find(bt => bt.id === di.batch_id);
          return {
            ...di,
            food_item_name: fi?.name || '',
            item_code: fi?.item_code || '',
            unit: fi?.unit || 'Pek',
            batch_number: b?.batch_number || ''
          };
        });
      }
      if (s.includes('fc.name as category') || s.includes('food_categories')) {
        const dateFrom = params[0] || '2020-01-01 00:00:00';
        const dateTo = params[1] || '2030-12-31 23:59:59';
        const byCat: Record<number, number> = {};
        for (const di of this.data.distribution_items) {
          const dt = this.data.distribution_transactions.find(d => d.id === di.distribution_transaction_id);
          if (dt && dt.created_at >= dateFrom && dt.created_at <= dateTo) {
            const fi = this.data.food_items.find(i => i.id === di.food_item_id);
            if (fi) {
              byCat[fi.category_id] = (byCat[fi.category_id] || 0) + di.quantity;
            }
          }
        }
        return Object.entries(byCat).map(([catId, qty]) => {
          const cat = this.data.food_categories.find(c => c.id === Number(catId));
          return { category: cat?.name || 'Lain-lain', total_quantity: qty };
        }).sort((a, b) => b.total_quantity - a.total_quantity);
      }
      if (s.includes('fi.name as item_name') || s.includes('order by total_distributed desc')) {
        const dateFrom = params[0] || '2020-01-01 00:00:00';
        const dateTo = params[1] || '2030-12-31 23:59:59';
        const byItem: Record<number, number> = {};
        for (const di of this.data.distribution_items) {
          const dt = this.data.distribution_transactions.find(d => d.id === di.distribution_transaction_id);
          if (dt && dt.created_at >= dateFrom && dt.created_at <= dateTo) {
            byItem[di.food_item_id] = (byItem[di.food_item_id] || 0) + di.quantity;
          }
        }
        return Object.entries(byItem).map(([itemId, qty]) => {
          const fi = this.data.food_items.find(i => i.id === Number(itemId));
          return { item_name: fi?.name || '', item_code: fi?.item_code || '', unit: fi?.unit || '', total_distributed: qty };
        }).sort((a, b) => b.total_distributed - a.total_distributed).slice(0, 10);
      }
    }

    // 10. Stock Transactions Queries
    if (s.includes('from stock_transactions')) {
      if (s.includes('select count(*) as cnt from stock_transactions where transaction_type = \'stock_in\'')) {
        return [{ cnt: this.data.stock_transactions.filter(t => t.transaction_type === 'STOCK_IN').length }];
      }
      if (s.includes('select count(*) as cnt from stock_transactions where transaction_type = \'stock_out\'')) {
        return [{ cnt: this.data.stock_transactions.filter(t => t.transaction_type === 'STOCK_OUT').length }];
      }
      if (s.includes('select count(*) as cnt from stock_transactions')) {
        return [{ cnt: this.data.stock_transactions.length }];
      }
      if (s.includes('sum(quantity) as total from stock_transactions where transaction_type = \'stock_in\'')) {
        const dateFrom = params[0] || '2020-01-01 00:00:00';
        const dateTo = params[1] || '2030-12-31 23:59:59';
        const total = this.data.stock_transactions
          .filter(t => t.transaction_type === 'STOCK_IN' && t.created_at >= dateFrom && t.created_at <= dateTo)
          .reduce((sum, t) => sum + (t.quantity || 0), 0);
        return [{ total, cnt: total }];
      }
      if (s.includes('sum(quantity) as total from stock_transactions where transaction_type = \'stock_out\'')) {
        const dateFrom = params[0] || '2020-01-01 00:00:00';
        const dateTo = params[1] || '2030-12-31 23:59:59';
        const total = this.data.stock_transactions
          .filter(t => t.transaction_type === 'STOCK_OUT' && t.created_at >= dateFrom && t.created_at <= dateTo)
          .reduce((sum, t) => sum + Math.abs(t.quantity || 0), 0);
        return [{ total, cnt: total }];
      }
      if (s.includes('sum(case when transaction_type = \'stock_in\' then quantity else 0 end) as stock_in')) {
        const dateFrom = params[0] || '2020-01-01 00:00:00';
        const dateTo = params[1] || '2030-12-31 23:59:59';
        const txs = this.data.stock_transactions.filter(t => t.created_at >= dateFrom && t.created_at <= dateTo);
        const byDate: Record<string, { inQty: number; outQty: number }> = {};
        for (const t of txs) {
          const d = t.created_at.split(' ')[0];
          if (!byDate[d]) byDate[d] = { inQty: 0, outQty: 0 };
          if (t.transaction_type === 'STOCK_IN') byDate[d].inQty += t.quantity;
          if (t.transaction_type === 'STOCK_OUT') byDate[d].outQty += Math.abs(t.quantity);
        }
        return Object.entries(byDate).map(([raw_date, v]) => {
          const parts = raw_date.split('-');
          return { date_label: `${parts[2]}/${parts[1]}`, raw_date, stock_in: v.inQty, stock_out: v.outQty };
        }).sort((a, b) => a.raw_date.localeCompare(b.raw_date));
      }

      // Default enriched stock tx list
      return this.data.stock_transactions.map(st => {
        const fi = this.data.food_items.find(i => i.id === st.food_item_id);
        const b = this.data.inventory_batches.find(bt => bt.id === st.batch_id);
        const s = this.data.students.find(std => std.id === st.student_id);
        const u = this.data.users.find(usr => usr.id === st.operator_id);
        return {
          ...st,
          food_item_name: fi?.name || '',
          item_code: fi?.item_code || '',
          unit: fi?.unit || 'Pek',
          batch_number: b?.batch_number || null,
          student_name: s?.name || null,
          student_code: s?.student_id || null,
          operator_name: u?.name || 'Petugas'
        };
      }).sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    // 11. Audit Logs Queries
    if (s.includes('from audit_logs')) {
      if (s.includes('select count(*) as total')) {
        return [{ total: this.data.audit_logs.length }];
      }
      return this.data.audit_logs.map(a => {
        const u = this.data.users.find(usr => usr.id === a.user_id);
        return {
          ...a,
          user_name: u?.name || 'Sistem',
          role: u?.role || 'admin'
        };
      }).sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    // 12. Notifications Queries
    if (s.includes('from notifications')) {
      return [...this.data.notifications].sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    return [];
  }

  private executeMutation(sql: string, params: any[]): RunResult {
    const s = sql.toLowerCase().replace(/\s+/g, ' ');
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const getNextId = (tbl: string) => {
      this.data.counters[tbl] = (this.data.counters[tbl] || 0) + 1;
      return this.data.counters[tbl];
    };

    // System Settings
    if (s.includes('insert into system_settings') || s.includes('insert or replace into system_settings')) {
      const key = params[0];
      const val = String(params[1]);
      const desc = params[2] || '';
      const existing = this.data.system_settings.find(st => st.setting_key === key);
      if (existing) {
        existing.setting_value = val;
        existing.updated_at = nowStr;
      } else {
        const id = getNextId('system_settings');
        this.data.system_settings.push({ id, setting_key: key, setting_value: val, description: desc, updated_at: nowStr });
      }
      return { lastInsertRowid: 1, changes: 1 };
    }

    // Users
    if (s.includes('insert into users') || s.includes('insert or ignore into users')) {
      const id = getNextId('users');
      this.data.users.push({
        id,
        username: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3],
        name: params[4],
        status: 'ACTIVE',
        last_login: null,
        created_at: nowStr
      });
      return { lastInsertRowid: id, changes: 1 };
    }
    if (s.includes('update users set')) {
      const id = params[params.length - 1];
      const u = this.data.users.find(usr => usr.id === Number(id) || String(usr.id) === String(id));
      if (u) {
        if (s.includes('last_login')) {
          u.last_login = nowStr;
        } else if (s.includes('password_hash = ? where id = ?') && params.length === 2) {
          u.password_hash = params[0];
        } else if (s.includes('status = ? where id = ?') && params.length === 2) {
          u.status = params[0];
        } else if (s.includes('username') && s.includes('name')) {
          u.username = String(params[0]).trim().toLowerCase();
          u.name = String(params[1]).trim();
          u.email = String(params[2] || '').trim().toLowerCase();
          u.role = params[3];
          u.status = params[4] || u.status;
          if (params.length >= 7 && params[5]) {
            u.password_hash = params[5];
          }
        }
      }
      return { lastInsertRowid: Number(id) || 1, changes: 1 };
    }

    // Programmes
    if (s.includes('insert or ignore into programmes') || s.includes('insert into programmes')) {
      const id = getNextId('programmes');
      this.data.programmes.push({ id, programme_code: params[0], programme_name: params[1], status: 'ACTIVE', created_at: nowStr });
      return { lastInsertRowid: id, changes: 1 };
    }

    // Food Categories
    if (s.includes('insert or ignore into food_categories') || s.includes('insert into food_categories')) {
      const id = getNextId('food_categories');
      this.data.food_categories.push({ id, name: params[0], description: params[1] || '', status: 'ACTIVE' });
      return { lastInsertRowid: id, changes: 1 };
    }

    // Food Items
    if (s.includes('insert into food_items') || s.includes('insert or ignore into food_items')) {
      const id = getNextId('food_items');
      const hasImage = params.length >= 9;
      this.data.food_items.push({
        id,
        item_code: params[0],
        name: params[1],
        category_id: Number(params[2]),
        description: params[3] || '',
        unit: params[4] || 'Pek',
        minimum_stock: Number(params[5] || 20),
        maximum_stock: Number(params[6] || 200),
        estimated_unit_cost: Number(params[7] || 0.0),
        image_url: hasImage ? (params[8] || '') : '',
        status: 'ACTIVE',
        created_at: nowStr,
        updated_at: nowStr
      });
      return { lastInsertRowid: id, changes: 1 };
    }
    if (s.includes('update food_items set')) {
      const id = params[params.length - 1];
      const item = this.data.food_items.find(fi => fi.id === Number(id) || String(fi.id) === String(id) || fi.item_code === String(id));
      if (item) {
        if (s.includes("status = 'inactive'") || (s.includes('status = ?') && (params[0] === 'INACTIVE' || params[1] === 'INACTIVE'))) {
          item.status = 'INACTIVE';
          // Also deactivate its batches
          this.data.inventory_batches.forEach(b => {
            if (b.food_item_id === item.id) b.status = 'INACTIVE';
          });
        } else if (s.includes('status = ?') && params.length === 2) {
          item.status = params[0];
        } else if (params.length >= 8) {
          item.item_code = params[0];
          item.name = params[1];
          item.category_id = Number(params[2]);
          item.description = params[3] || '';
          item.unit = params[4] || 'Pek';
          item.minimum_stock = Number(params[5]);
          item.maximum_stock = Number(params[6]);
          item.estimated_unit_cost = Number(params[7]);
          if (params.length === 11) {
            item.image_url = params[8] || '';
            item.status = params[9] || item.status;
          } else if (params.length === 10) {
            if (typeof params[8] === 'string' && (params[8].startsWith('http') || params[8].startsWith('data:') || params[8].startsWith('/'))) {
              item.image_url = params[8];
            } else {
              item.status = params[8] || item.status;
            }
          }
        }
        item.updated_at = nowStr;
      }
      return { lastInsertRowid: Number(id) || 1, changes: 1 };
    }
    if (s.includes('delete from food_items')) {
      const id = Number(params[0]);
      this.data.food_items = this.data.food_items.filter(fi => fi.id !== id);
      this.data.inventory_batches = this.data.inventory_batches.filter(b => b.food_item_id !== id);
      return { lastInsertRowid: id, changes: 1 };
    }

    // Students
    if (s.includes('insert into students') || s.includes('insert or ignore into students')) {
      const id = getNextId('students');
      this.data.students.push({
        id,
        student_id: params[0],
        name: params[1],
        ic_number: params[2],
        programme_id: params[3],
        semester: params[4] || 1,
        class_group: params[5] || 'A',
        phone: params[6] || '',
        email: params[7] || '',
        status: 'ACTIVE',
        qr_token: params[8],
        created_at: nowStr,
        updated_at: nowStr
      });
      return { lastInsertRowid: id, changes: 1 };
    }
    if (s.includes('update students set name = ?')) {
      const id = params[8];
      const st = this.data.students.find(s => s.id === id);
      if (st) {
        st.name = params[0];
        st.ic_number = params[1];
        st.programme_id = params[2];
        st.semester = params[3];
        st.class_group = params[4];
        st.phone = params[5];
        st.email = params[6];
        st.status = params[7] || st.status;
        st.updated_at = nowStr;
      }
      return { lastInsertRowid: id, changes: 1 };
    }
    if (s.includes('update students set status')) {
      const id = params[1];
      const st = this.data.students.find(s => s.id === id);
      if (st) {
        st.status = params[0];
        st.updated_at = nowStr;
      }
      return { lastInsertRowid: id, changes: 1 };
    }
    if (s.includes('delete from students')) {
      const id = Number(params[0]);
      this.data.students = this.data.students.filter(st => st.id !== id);
      return { lastInsertRowid: id, changes: 1 };
    }
    if (s.includes('delete from users where username') || s.includes('delete from users where id')) {
      if (s.includes('username')) {
        const u1 = String(params[0] || '').toLowerCase();
        const u2 = String(params[1] || '').toLowerCase();
        this.data.users = this.data.users.filter(u => u.username?.toLowerCase() !== u1 && u.username?.toLowerCase() !== u2);
      } else {
        const uid = Number(params[0]);
        this.data.users = this.data.users.filter(u => u.id !== uid);
      }
      return { lastInsertRowid: 1, changes: 1 };
    }

    // Inventory Batches
    if (s.includes('insert into inventory_batches')) {
      const id = getNextId('inventory_batches');
      this.data.inventory_batches.push({
        id,
        food_item_id: params[0],
        batch_number: params[1],
        quantity_received: params[2],
        quantity_remaining: params[3],
        expiry_date: params[4],
        received_date: params[5],
        unit_cost: params[6] || 0.0,
        source: params[7] || 'Peruntukan KPT',
        status: 'ACTIVE',
        created_at: nowStr
      });
      return { lastInsertRowid: id, changes: 1 };
    }
    if (s.includes('update inventory_batches set')) {
      const id = params[params.length - 1];
      const b = this.data.inventory_batches.find(bt => bt.id === Number(id) || String(bt.id) === String(id));
      if (b) {
        if (s.includes('batch_number = ?')) {
          b.batch_number = String(params[0]).trim();
          b.quantity_remaining = Number(params[1]);
          b.quantity_received = Number(params[2]);
          b.expiry_date = String(params[3]);
          b.received_date = String(params[4]);
          b.source = String(params[5]);
          b.unit_cost = Number(params[6]);
          b.status = params[7] || b.status;
        } else if (s.includes('status = ?') && params.length >= 2) {
          b.status = params[0];
          if (params.length >= 3) b.quantity_remaining = Number(params[1]);
        } else {
          b.quantity_remaining = Number(params[0]);
          if (params.length >= 3) b.status = params[1];
        }
      }
      return { lastInsertRowid: Number(id), changes: 1 };
    }
    if (s.includes('delete from inventory_batches')) {
      const id = Number(params[0]);
      this.data.inventory_batches = this.data.inventory_batches.filter(b => b.id !== id);
      return { lastInsertRowid: id, changes: 1 };
    }

    // Stock Transactions
    if (s.includes('insert into stock_transactions')) {
      const id = getNextId('stock_transactions');
      this.data.stock_transactions.push({
        id,
        transaction_code: params[0],
        transaction_type: params[1],
        food_item_id: params[2],
        batch_id: params[3] || null,
        quantity: params[4],
        balance_after: params[5],
        student_id: params[6] || null,
        operator_id: params[7] || null,
        remarks: params[8] || '',
        created_at: params[9] || nowStr
      });
      return { lastInsertRowid: id, changes: 1 };
    }

    // Distribution Transactions
    if (s.includes('insert into distribution_transactions')) {
      const id = getNextId('distribution_transactions');
      this.data.distribution_transactions.push({
        id,
        transaction_code: params[0],
        student_id: params[1],
        operator_id: params[2],
        total_items: params[3],
        override_used: params[4] || 0,
        override_reason: params[5] || null,
        created_at: params[6] || nowStr
      });
      return { lastInsertRowid: id, changes: 1 };
    }

    // Distribution Items
    if (s.includes('insert into distribution_items')) {
      const id = getNextId('distribution_items');
      this.data.distribution_items.push({
        id,
        distribution_transaction_id: params[0],
        food_item_id: params[1],
        batch_id: params[2],
        quantity: params[3] || 1
      });
      return { lastInsertRowid: id, changes: 1 };
    }

    // Inventory Adjustments
    if (s.includes('insert into inventory_adjustments')) {
      const id = getNextId('inventory_adjustments');
      this.data.inventory_adjustments.push({
        id,
        food_item_id: params[0],
        batch_id: params[1] || null,
        adjustment_type: params[2],
        quantity: params[3],
        reason: params[4],
        authorized_by: params[5],
        operator_id: params[6] || null,
        created_at: params[7] || nowStr
      });
      return { lastInsertRowid: id, changes: 1 };
    }

    // Audit Logs
    if (s.includes('insert into audit_logs')) {
      const id = getNextId('audit_logs');
      this.data.audit_logs.push({
        id,
        user_id: params[0] || null,
        action: params[1],
        module: params[2],
        record_id: params[3] || null,
        description: params[4],
        ip_address: params[5] || '127.0.0.1',
        created_at: params[6] || nowStr
      });
      return { lastInsertRowid: id, changes: 1 };
    }

    // Notifications
    if (s.includes('insert into notifications')) {
      const id = getNextId('notifications');
      this.data.notifications.push({
        id,
        type: params[0],
        title: params[1],
        message: params[2],
        status: params[3] || 'UNREAD',
        created_at: params[4] || nowStr
      });
      return { lastInsertRowid: id, changes: 1 };
    }
    if (s.includes('update notifications set status = \'read\'')) {
      this.data.notifications.forEach(n => { n.status = 'READ'; });
      return { lastInsertRowid: 1, changes: this.data.notifications.length };
    }

    return { lastInsertRowid: 0, changes: 0 };
  }
}

let dbSingleton: DatabaseInterface | null = null;

export function getDatabase(): DatabaseInterface {
  if (!dbSingleton) {
    if (nativeDb) {
      dbSingleton = nativeDb as DatabaseInterface;
    } else {
      dbSingleton = new JsonRelationalDB();
    }
  }
  return dbSingleton;
}

export default getDatabase;
