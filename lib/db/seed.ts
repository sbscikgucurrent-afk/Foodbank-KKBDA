import { getDatabase } from './index';
import bcrypt from 'bcryptjs';

export function runSeed() {
  const db = getDatabase();

  console.log('🌱 Starting JOM KENYANG database seed...');

  // 1. Seed System Settings
  const insertSetting = db.prepare(`
    INSERT OR REPLACE INTO system_settings (setting_key, setting_value, description)
    VALUES (?, ?, ?)
  `);

  const settings = [
    ['institution_name', 'Kolej Komuniti Bandar Darulaman', 'Nama Institusi Pendidikan'],
    ['unit_name', 'Unit Ambilan dan Pembangunan Pelajar (UAPP)', 'Unit Pengurusan Foodbank'],
    ['foodbank_name', 'Jom Kenyang — Dapur Siswa', 'Nama Rasmi Foodbank'],
    ['daily_collection_limit', '1', 'Had Pengambilan Maksimum Pelajar Sehari'],
    ['max_items_per_visit', '3', 'Had Maksimum Bilangan Item Setiap Sesi'],
    ['low_stock_threshold', '20', 'Paras Amaran Stok Rendah'],
    ['expiry_alert_days', '30', 'Tempoh Hari Amaran Tarikh Luput'],
    ['currency_symbol', 'RM', 'Mata Wang Utama'],
    ['kiosk_idle_seconds', '30', 'Masa Had Reset Automatik Kiosk (Saat)']
  ];

  for (const [k, v, d] of settings) {
    insertSetting.run(k, v, d);
  }

  // 2. Seed Programmes
  const insertProgramme = db.prepare(`
    INSERT OR IGNORE INTO programmes (programme_code, programme_name, status)
    VALUES (?, ?, 'ACTIVE')
  `);

  const programmes = [
    ['SKE', 'Sijil Teknologi Elektrik'],
    ['STM', 'Sijil Teknologi Maklumat'],
    ['STS', 'Sijil Teknologi Senibina'],
    ['SAU', 'Sijil Teknologi Automotif'],
    ['DCV', 'Diploma Teknologi Kenderaan Perdagangan']
  ];

  for (const [code, name] of programmes) {
    insertProgramme.run(code, name);
  }

  // 3. Seed Users
  const salt = bcrypt.genSaltSync(10);
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, role, name, status)
    VALUES (?, ?, ?, ?, ?, 'ACTIVE')
  `);

  const users = [
    ['superadmin', 'superadmin@kkbda.edu.my', bcrypt.hashSync('admin123', salt), 'superadmin', 'Ts. Dr. Ahmad Fikri Bin Zainal (Super Admin)'],
    ['uappadmin', 'uapp@kkbda.edu.my', bcrypt.hashSync('uapp123', salt), 'uappadmin', 'Puan Siti Rahmah Binti Osman (Pegawai UAPP)'],
    ['operator', 'operator@kkbda.edu.my', bcrypt.hashSync('operator123', salt), 'operator', 'Encik Muhammad Haziq Bin Radzi (Petugas Dapur Siswa)'],
    ['student001', 'aisyah@student.kkbda.edu.my', bcrypt.hashSync('student123', salt), 'student', 'Nur Aisyah Binti Ahmad']
  ];

  for (const [username, email, pass, role, name] of users) {
    insertUser.run(username, email, pass, role, name);
  }

  // 4. Seed Categories
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO food_categories (name, description, status)
    VALUES (?, ?, 'ACTIVE')
  `);

  const categories = [
    ['Beverage', 'Minuman segera, susu sedia diminum dan malt coklat'],
    ['Snack', 'Snek ringan berkhasiat'],
    ['Breakfast', 'Bijirin dan sajian mudah sarapan pagi'],
    ['Ready-to-Eat', 'Makanan sedia dimakan dan mi segera'],
    ['Biscuits', 'Biskut kraker, biskut krim dan wafer'],
    ['Cereal', 'Oat, bijirin bar dan kepingan jagung'],
    ['Bread', 'Roti sandwich, ban berinti dan pastri'],
    ['Other', 'Keperluan makanan asas lain']
  ];

  for (const [catName, catDesc] of categories) {
    insertCategory.run(catName, catDesc);
  }

  // 5. Seed Food Items
  const catRows = db.prepare(`SELECT id, name FROM food_categories`).all() as { id: number; name: string }[];
  const catMap = Object.fromEntries(catRows.map(c => [c.name, c.id]));

  const insertFoodItem = db.prepare(`
    INSERT OR IGNORE INTO food_items (item_code, name, category_id, description, unit, minimum_stock, maximum_stock, estimated_unit_cost, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `);

  const foodItems = [
    ['FB001', 'Milo 3-in-1 (Sachet)', catMap['Beverage'] || 1, 'Pek minuman malt coklat bertenaga', 'Sachet', 30, 300, 1.20],
    ['FB002', 'Biskut Hup Seng Cream Crackers', catMap['Biscuits'] || 5, 'Kraker berkrim rangup berkhasiat', 'Pek', 25, 200, 2.50],
    ['FB003', 'Nestum Grains & More 3-in-1', catMap['Breakfast'] || 3, 'Bijirin sarapan pagi berkhasiat serat tinggi', 'Sachet', 20, 200, 1.10],
    ['FB004', 'Roti Gardenia Classic', catMap['Bread'] || 7, 'Roti putih lembut segar', 'Buku', 15, 100, 3.20],
    ['FB005', 'Susu UHT Dutch Lady Coklat 200ml', catMap['Beverage'] || 1, 'Susu segar berperisa coklat', 'Kotak', 25, 250, 2.00],
    ['FB006', 'Maggi Mi Goreng Asli', catMap['Ready-to-Eat'] || 4, 'Mi segera goreng perisa istimewa', 'Pek', 30, 300, 1.50],
    ['FB007', 'Oat Krunch Biskut Coklat', catMap['Biscuits'] || 5, 'Biskut oat rangup cip coklat', 'Pek', 20, 150, 2.80],
    ['FB008', 'Yeo’s Minuman Kacang Soya 250ml', catMap['Beverage'] || 1, 'Minuman kacang soya kaya protein', 'Kotak', 20, 200, 1.80],
    ['FB009', 'Koko Krunch Cereal Bar 25g', catMap['Cereal'] || 6, 'Bar bijirin gandum coklat rangup', 'Pek', 25, 250, 1.60],
    ['FB010', 'Julie’s Peanut Butter Sandwich', catMap['Biscuits'] || 5, 'Biskut sandwic mentega kacang', 'Pek', 20, 180, 2.90],
    ['FB011', 'Sardin Ayam Brand Mini 155g', catMap['Ready-to-Eat'] || 4, 'Ikan sardin premium dalam sos tomato enak', 'Tin', 15, 120, 4.50],
    ['FB012', 'Kopi O Hang Tuah uncang', catMap['Beverage'] || 1, 'Kopi O tradisional aroma asli', 'Uncang', 20, 150, 0.90],
    ['FB013', 'Biskut Oreo Vanilla Mini Pack', catMap['Snack'] || 2, 'Biskut sandwic coklat krim vanila', 'Pek', 20, 150, 2.20],
    ['FB014', 'Roti Bun Gardenia Coklat', catMap['Bread'] || 7, 'Ban gebu berinti krim coklat', 'Pek', 15, 100, 1.30],
    ['FB015', 'Nestle Koko Krunch Breakfast Cereal', catMap['Breakfast'] || 3, 'Mangkuk bijirin mini sarapan', 'Mangkuk', 15, 120, 2.70]
  ];

  for (const item of foodItems) {
    insertFoodItem.run(...item);
  }

  // 6. Seed Students (30+ students across programmes)
  const progRows = db.prepare(`SELECT id, programme_code FROM programmes`).all() as { id: number; programme_code: string }[];
  const progMap = Object.fromEntries(progRows.map(p => [p.programme_code, p.id]));

  const insertStudent = db.prepare(`
    INSERT OR IGNORE INTO students (student_id, name, ic_number, programme_id, semester, class_group, phone, email, status, qr_token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
  `);

  const studentList = [
    ['KKBDA001', 'Nur Aisyah Binti Ahmad', '050214-02-5542', progMap['STM'] || 2, 3, 'A', '013-4567891', 'aisyah@student.kkbda.edu.my', 'TOKEN-KKBDA001-9F38A'],
    ['KKBDA002', 'Muhammad Faris Bin Zakaria', '040819-08-6123', progMap['STE'] || 1, 4, 'B', '017-8901234', 'faris@student.kkbda.edu.my', 'TOKEN-KKBDA002-3B71C'],
    ['KKBDA003', 'Siti Hajar Binti Mohamad', '051120-02-5884', progMap['STM'] || 2, 2, 'A', '011-2345678', 'hajar@student.kkbda.edu.my', 'TOKEN-KKBDA003-8D29F'],
    ['KKBDA004', 'Danish Iskandar Bin Azman', '060105-02-6331', progMap['STA'] || 3, 1, 'C', '019-9876543', 'danish@student.kkbda.edu.my', 'TOKEN-KKBDA004-1E44A'],
    ['KKBDA005', 'Amirul Hakim Bin Rosli', '040512-07-5119', progMap['DTKP'] || 5, 4, 'A', '012-3456789', 'amirul@student.kkbda.edu.my', 'TOKEN-KKBDA005-7A92K'],
    ['KKBDA006', 'Fatin Nabilah Binti Yusof', '050318-02-5440', progMap['STS'] || 4, 3, 'B', '014-5678901', 'fatin@student.kkbda.edu.my', 'TOKEN-KKBDA006-4C18M'],
    ['KKBDA007', 'Wan Muhammad Luqman Bin Wan Hassan', '041209-03-6225', progMap['STE'] || 1, 3, 'A', '018-9012345', 'luqman@student.kkbda.edu.my', 'TOKEN-KKBDA007-9H55P'],
    ['KKBDA008', 'Nurul Izzah Binti Kamaruddin', '050723-02-5992', progMap['STM'] || 2, 2, 'B', '016-7890123', 'izzah@student.kkbda.edu.my', 'TOKEN-KKBDA008-2V88T'],
    ['KKBDA009', 'Hariz Haikal Bin Mustaffa', '050930-02-6773', progMap['STA'] || 3, 2, 'A', '011-8765432', 'hariz@student.kkbda.edu.my', 'TOKEN-KKBDA009-6Q31X'],
    ['KKBDA010', 'Nur Safiyyah Binti Zulkifli', '040404-02-5116', progMap['STS'] || 4, 4, 'A', '013-8901234', 'safiyyah@student.kkbda.edu.my', 'TOKEN-KKBDA010-5W20Y'],
    ['KKBDA011', 'Adam Harith Bin Razali', '060211-02-6007', progMap['STE'] || 1, 1, 'C', '017-6543210', 'adam@student.kkbda.edu.my', 'TOKEN-KKBDA011-3P90Z'],
    ['KKBDA012', 'Ainur Mardhiah Binti Shuib', '050615-08-5668', progMap['STM'] || 2, 3, 'A', '019-1234567', 'ainur@student.kkbda.edu.my', 'TOKEN-KKBDA012-7L44R'],
    ['KKBDA013', 'Muhammad Iman Bin Shahrul', '041010-02-6559', progMap['DTKP'] || 5, 4, 'B', '012-8765432', 'iman@student.kkbda.edu.my', 'TOKEN-KKBDA013-8S12E'],
    ['KKBDA014', 'Nur Damia Binti Khalid', '050808-02-5224', progMap['STS'] || 4, 2, 'A', '014-9876543', 'damia@student.kkbda.edu.my', 'TOKEN-KKBDA014-9G67W'],
    ['KKBDA015', 'Syed Naufal Bin Syed Ali', '040321-01-5337', progMap['STA'] || 3, 4, 'A', '018-2345678', 'naufal@student.kkbda.edu.my', 'TOKEN-KKBDA015-1N83K'],
    ['KKBDA016', 'Nur Farah Diana Binti Azhar', '050505-02-5770', progMap['STM'] || 2, 3, 'B', '016-3456789', 'farah@student.kkbda.edu.my', 'TOKEN-KKBDA016-2J49L'],
    ['KKBDA017', 'Muhammad Afiq Bin Johari', '060129-02-6883', progMap['STE'] || 1, 1, 'A', '011-3456789', 'afiq@student.kkbda.edu.my', 'TOKEN-KKBDA017-3K82U'],
    ['KKBDA018', 'Puteri Balqis Binti Megat Ismail', '050117-08-5334', progMap['STS'] || 4, 3, 'A', '013-2345678', 'balqis@student.kkbda.edu.my', 'TOKEN-KKBDA018-4M76N'],
    ['KKBDA019', 'Izzat Rayyan Bin Sabri', '040925-02-6441', progMap['STA'] || 3, 3, 'B', '017-3456789', 'izzat@student.kkbda.edu.my', 'TOKEN-KKBDA019-5H19O'],
    ['KKBDA020', 'Siti Khadijah Binti Othman', '051212-02-5006', progMap['STM'] || 2, 1, 'C', '019-8765432', 'khadijah@student.kkbda.edu.my', 'TOKEN-KKBDA020-6B54P'],
    ['KKBDA021', 'Muhammad Haziq Bin Abdullah', '040707-02-6229', progMap['DTKP'] || 5, 3, 'A', '012-9876543', 'haziq@student.kkbda.edu.my', 'TOKEN-KKBDA021-7D38Q'],
    ['KKBDA022', 'Nur Syamimi Binti Halim', '050428-02-5662', progMap['STE'] || 1, 2, 'B', '014-3456789', 'syamimi@student.kkbda.edu.my', 'TOKEN-KKBDA022-8F92R'],
    ['KKBDA023', 'Aiman Daniel Bin Nazri', '060303-02-6115', progMap['STA'] || 3, 1, 'B', '018-7654321', 'aiman@student.kkbda.edu.my', 'TOKEN-KKBDA023-9X23S'],
    ['KKBDA024', 'Nurul Husna Binti Badlishah', '041114-08-5880', progMap['STS'] || 4, 4, 'B', '016-8765432', 'husna@student.kkbda.edu.my', 'TOKEN-KKBDA024-1Y74T'],
    ['KKBDA025', 'Muhammad Zaim Bin Khairi', '050220-02-6997', progMap['STM'] || 2, 3, 'A', '011-9876543', 'zaim@student.kkbda.edu.my', 'TOKEN-KKBDA025-2Z85U'],
    ['KKBDA026', 'Sarah Alisya Binti Badrul', '050909-02-5332', progMap['STE'] || 1, 2, 'A', '013-9876543', 'sarah@student.kkbda.edu.my', 'TOKEN-KKBDA026-3A96V'],
    ['KKBDA027', 'Khairul Anuar Bin Mokhtar', '040618-02-6663', progMap['DTKP'] || 5, 4, 'A', '017-8765432', 'khairul@student.kkbda.edu.my', 'TOKEN-KKBDA027-4C07W'],
    ['KKBDA028', 'Anis Syuhada Binti Mansor', '050305-02-5118', progMap['STA'] || 3, 2, 'B', '019-2345678', 'anis@student.kkbda.edu.my', 'TOKEN-KKBDA028-5E18X'],
    ['KKBDA029', 'Luqman Hakim Bin Jalil', '060202-02-6449', progMap['STS'] || 4, 1, 'A', '012-7654321', 'luqmanh@student.kkbda.edu.my', 'TOKEN-KKBDA029-6G29Y'],
    ['KKBDA030', 'Nur Rabiatul Binti Adnan', '041005-08-5444', progMap['STM'] || 2, 4, 'A', '014-8765432', 'rabiatul@student.kkbda.edu.my', 'TOKEN-KKBDA030-7J40Z']
  ];

  for (const std of studentList) {
    insertStudent.run(...std);
  }

  // 7. Seed Batches, Stock In and Ledger Records
  const items = db.prepare(`SELECT id, item_code, name, estimated_unit_cost, minimum_stock FROM food_items`).all() as { id: number; item_code: string; name: string; estimated_unit_cost: number; minimum_stock: number }[];
  const itemMap = Object.fromEntries(items.map(i => [i.item_code, i]));

  const insertBatch = db.prepare(`
    INSERT INTO inventory_batches (food_item_id, batch_number, quantity_received, quantity_remaining, expiry_date, received_date, unit_cost, source, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `);

  const insertStockTx = db.prepare(`
    INSERT INTO stock_transactions (transaction_code, transaction_type, food_item_id, batch_id, quantity, balance_after, student_id, operator_id, remarks, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const opId = (db.prepare(`SELECT id FROM users WHERE username = 'operator'`).get() as { id: number })?.id || 1;
  const adminId = (db.prepare(`SELECT id FROM users WHERE username = 'uappadmin'`).get() as { id: number })?.id || 1;

  // Batches definition
  // We'll create:
  // - Batches expiring in > 6 months (Normal)
  // - Batches expiring in < 30 days (Warning)
  // - Batches expiring in < 7 days (Critical)
  // - Some low-stock items (< minimum_stock)
  const batchDefinitions = [
    // FB001 Milo
    { item: 'FB001', batch: 'B-MILO-26A', qtyRec: 150, qtyRem: 45, expiry: '2026-09-08', recDate: '2026-08-01', cost: 1.20, src: 'Peruntukan KPT' }, // Critical (<7d)
    { item: 'FB001', batch: 'B-MILO-26B', qtyRec: 200, qtyRem: 120, expiry: '2027-06-30', recDate: '2026-08-20', cost: 1.20, src: 'Sumbangan Alumni KKBDA' },

    // FB002 Biskut Cream Crackers
    { item: 'FB002', batch: 'B-CRACK-26A', qtyRec: 100, qtyRem: 12, expiry: '2026-09-22', recDate: '2026-08-05', cost: 2.50, src: 'Peruntukan KPT' }, // Low stock & Warning (<30d)
    { item: 'FB002', batch: 'B-CRACK-26B', qtyRec: 100, qtyRem: 80, expiry: '2027-08-15', recDate: '2026-08-25', cost: 2.50, src: 'Penderma Korporat' },

    // FB003 Nestum
    { item: 'FB003', batch: 'B-NEST-26A', qtyRec: 120, qtyRem: 65, expiry: '2027-04-10', recDate: '2026-08-10', cost: 1.10, src: 'Peruntukan KPT' },

    // FB004 Roti Gardenia (Expiring soon)
    { item: 'FB004', batch: 'B-ROTI-26A', qtyRec: 40, qtyRem: 8, expiry: '2026-09-06', recDate: '2026-09-01', cost: 3.20, src: 'Pembekal Tempatan' }, // Critical & Low stock

    // FB005 Susu UHT
    { item: 'FB005', batch: 'B-SUSU-26A', qtyRec: 150, qtyRem: 95, expiry: '2027-01-15', recDate: '2026-08-15', cost: 2.00, src: 'Peruntukan KPT' },

    // FB006 Maggi Mi Goreng
    { item: 'FB006', batch: 'B-MAGGI-26A', qtyRec: 180, qtyRem: 110, expiry: '2027-05-20', recDate: '2026-08-12', cost: 1.50, src: 'Peruntukan KPT' },

    // FB007 Oat Krunch
    { item: 'FB007', batch: 'B-OAT-26A', qtyRec: 80, qtyRem: 42, expiry: '2026-09-28', recDate: '2026-08-18', cost: 2.80, src: 'Sumbangan Staf KKBDA' }, // Warning (<30d)

    // FB008 Yeo's Soya
    { item: 'FB008', batch: 'B-SOYA-26A', qtyRec: 120, qtyRem: 78, expiry: '2027-03-30', recDate: '2026-08-15', cost: 1.80, src: 'Peruntukan KPT' },

    // FB009 Koko Krunch Bar
    { item: 'FB009', batch: 'B-KOKO-26A', qtyRec: 150, qtyRem: 90, expiry: '2027-07-10', recDate: '2026-08-20', cost: 1.60, src: 'Sumbangan Luar' },

    // FB010 Julie's Peanut Butter
    { item: 'FB010', batch: 'B-JULIE-26A', qtyRec: 90, qtyRem: 55, expiry: '2027-02-28', recDate: '2026-08-10', cost: 2.90, src: 'Peruntukan KPT' },

    // FB011 Sardin Ayam Brand
    { item: 'FB011', batch: 'B-SARD-26A', qtyRec: 60, qtyRem: 9, expiry: '2028-01-01', recDate: '2026-08-01', cost: 4.50, src: 'Peruntukan KPT' }, // Low stock (< minimum 15)

    // FB012 Kopi O Hang Tuah
    { item: 'FB012', batch: 'B-KOPI-26A', qtyRec: 100, qtyRem: 60, expiry: '2027-10-15', recDate: '2026-08-15', cost: 0.90, src: 'Sumbangan NGO' },

    // FB013 Oreo Mini
    { item: 'FB013', batch: 'B-OREO-26A', qtyRec: 80, qtyRem: 48, expiry: '2027-04-20', recDate: '2026-08-20', cost: 2.20, src: 'Peruntukan KPT' },

    // FB014 Roti Bun Coklat
    { item: 'FB014', batch: 'B-BUN-26A', qtyRec: 50, qtyRem: 14, expiry: '2026-09-07', recDate: '2026-09-01', cost: 1.30, src: 'Pembekal Tempatan' }, // Critical & Low stock

    // FB015 Nestle Koko Krunch Bowl
    { item: 'FB015', batch: 'B-BOWL-26A', qtyRec: 70, qtyRem: 38, expiry: '2027-03-15', recDate: '2026-08-10', cost: 2.70, src: 'Peruntukan KPT' }
  ];

  let txCounter = 1;
  const createdBatches: { id: number; food_item_id: number; item_code: string; batch_number: string; unit_cost: number; expiry_date: string }[] = [];

  for (const b of batchDefinitions) {
    const item = itemMap[b.item];
    if (!item) continue;

    const res = insertBatch.run(item.id, b.batch, b.qtyRec, b.qtyRem, b.expiry, b.recDate, b.cost, b.src);
    const batchId = res.lastInsertRowid as number;
    createdBatches.push({ id: batchId, food_item_id: item.id, item_code: b.item, batch_number: b.batch, unit_cost: b.cost, expiry_date: b.expiry });

    // Insert Stock In Transaction
    const sinCode = `SIN-2026-${String(txCounter++).padStart(6, '0')}`;
    insertStockTx.run(
      sinCode,
      'STOCK_IN',
      item.id,
      batchId,
      b.qtyRec,
      b.qtyRec,
      null,
      adminId,
      `Penerimaan stok awal dari ${b.src}`,
      `${b.recDate} 09:00:00`
    );
  }

  // 8. Seed Realistic Distribution Transactions (Past 2 weeks of activity)
  const students = db.prepare(`SELECT id, student_id, name, programme_id FROM students LIMIT 20`).all() as { id: number; student_id: string; name: string; programme_id: number }[];

  const insertDistTx = db.prepare(`
    INSERT INTO distribution_transactions (transaction_code, student_id, operator_id, total_items, override_used, override_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDistItem = db.prepare(`
    INSERT INTO distribution_items (distribution_transaction_id, food_item_id, batch_id, quantity)
    VALUES (?, ?, ?, ?)
  `);

  let distCounter = 1;
  let soutCounter = 1;

  // Generate sample distributions
  const dates = [
    '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29',
    '2026-09-01', '2026-09-02'
  ];

  for (let i = 0; i < students.length; i++) {
    const std = students[i];
    const dateStr = dates[i % dates.length];
    const timeStr = `${String(9 + (i % 7)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00`;
    const createdAt = `${dateStr} ${timeStr}`;

    const distCode = `FDB-2026-${String(distCounter++).padStart(6, '0')}`;
    const isOverride = i === 18 ? 1 : 0;
    const overrideReason = isOverride ? 'Kelulusan Khas UAPP untuk sesi amali petang' : null;

    // Select 2 to 3 items from createdBatches
    const selectedBatches = [
      createdBatches[i % createdBatches.length],
      createdBatches[(i + 3) % createdBatches.length],
      ...(i % 2 === 0 ? [createdBatches[(i + 7) % createdBatches.length]] : [])
    ];

    const distRes = insertDistTx.run(
      distCode,
      std.id,
      opId,
      selectedBatches.length,
      isOverride,
      overrideReason,
      createdAt
    );

    const distId = distRes.lastInsertRowid as number;

    for (const b of selectedBatches) {
      insertDistItem.run(distId, b.food_item_id, b.id, 1);

      // Create Stock Out Transaction
      const soutCode = `SOUT-2026-${String(soutCounter++).padStart(6, '0')}`;
      insertStockTx.run(
        soutCode,
        'STOCK_OUT',
        b.food_item_id,
        b.id,
        -1,
        100, // calculated balance placeholder
        std.id,
        opId,
        `Pengambilan makanan oleh pelajar ${std.name} (${distCode})`,
        createdAt
      );
    }
  }

  // 9. Seed Inventory Adjustments
  const insertAdj = db.prepare(`
    INSERT INTO inventory_adjustments (food_item_id, batch_id, adjustment_type, quantity, reason, authorized_by, operator_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const adjCode = `ADJ-2026-${String(txCounter++).padStart(6, '0')}`;
  const rotiItem = itemMap['FB004'];
  const rotiBatch = createdBatches.find(b => b.item_code === 'FB004');

  if (rotiItem && rotiBatch) {
    insertAdj.run(
      rotiItem.id,
      rotiBatch.id,
      'Damaged',
      -2,
      'Bungkusan kemek semasa pemindahan stor',
      'Puan Siti Rahmah (Admin UAPP)',
      adminId,
      '2026-09-01 14:30:00'
    );

    insertStockTx.run(
      adjCode,
      'DAMAGED',
      rotiItem.id,
      rotiBatch.id,
      -2,
      8,
      null,
      adminId,
      'Pelarasan stok: Bungkusan rosak/kemek',
      '2026-09-01 14:30:00'
    );
  }

  // 10. Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (type, title, message, status, created_at)
    VALUES (?, ?, ?, 'UNREAD', ?)
  `);

  insertNotif.run('CRITICAL_STOCK', 'Stok Kritikal: Roti Gardenia Classic', 'Baki stok semasa hanya 8 buku (Minimum: 15). Sila buat pesanan segera.', '2026-09-02 08:30:00');
  insertNotif.run('EXPIRING_SOON', 'Tarikh Luput Mendekati: Milo 3-in-1 (Batch B-MILO-26A)', 'Batch ini akan luput pada 08/09/2026 (6 hari lagi). Baki 45 sachet.', '2026-09-02 08:45:00');
  insertNotif.run('LOW_STOCK', 'Stok Rendah: Sardin Ayam Brand Mini', 'Baki stok semasa hanya 9 tin (Minimum: 15).', '2026-09-02 09:15:00');
  insertNotif.run('SYSTEM', 'Sistem JOM KENYANG Sedia Digunakan', 'Sistem pengurusan digital Jom Kenyang — Dapur Siswa beroperasi sepenuhnya.', '2026-09-02 08:00:00');

  // 11. Seed Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, '127.0.0.1', ?)
  `);

  insertAudit.run(adminId, 'INITIAL_SETUP', 'SYSTEM', 'SYS-001', 'Inisialisasi sistem JOM KENYANG dan penetapan tetapan asas', '2026-09-01 08:00:00');
  insertAudit.run(adminId, 'CREATE_BATCH', 'STOCK_IN', 'SIN-2026-000001', 'Penerimaan stok awal 15 item makanan ke dalam pangkalan data', '2026-09-01 08:30:00');
  insertAudit.run(opId, 'DISTRIBUTION', 'DISTRIBUTION', 'FDB-2026-000001', 'Agihan bantuan makanan kepada pelajar Nur Aisyah (KKBDA001)', '2026-09-01 10:15:00');
  insertAudit.run(adminId, 'STOCK_ADJUSTMENT', 'ADJUSTMENT', adjCode, 'Pelarasan stok rosak untuk Roti Gardenia Classic (-2 buku)', '2026-09-01 14:30:00');

  console.log('✅ JOM KENYANG database seed completed successfully!');
}

if (require.main === module) {
  runSeed();
}
