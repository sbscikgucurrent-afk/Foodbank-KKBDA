const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

function runSeed() {
  const DATA_DIR = path.join(__dirname, '..', '..', 'data');
  const DB_FILE = path.join(DATA_DIR, 'foodbank.json');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('🌱 Starting JOM KENYANG database seed...');

  const salt = bcrypt.genSaltSync(10);
  const nowStr = '2026-09-02 08:00:00';

  // 1. Settings
  const system_settings = [
    { id: 1, setting_key: 'institution_name', setting_value: 'Kolej Komuniti Bandar Darulaman', description: 'Nama Institusi Pendidikan', updated_at: nowStr },
    { id: 2, setting_key: 'unit_name', setting_value: 'Unit Ambilan dan Pembangunan Pelajar (UAPP)', description: 'Unit Pengurusan Foodbank', updated_at: nowStr },
    { id: 3, setting_key: 'foodbank_name', setting_value: 'Jom Kenyang — Dapur Siswa', description: 'Nama Rasmi Foodbank', updated_at: nowStr },
    { id: 4, setting_key: 'daily_collection_limit', setting_value: '1', description: 'Had Pengambilan Maksimum Pelajar Sehari', updated_at: nowStr },
    { id: 5, setting_key: 'max_items_per_visit', setting_value: '3', description: 'Had Maksimum Bilangan Item Setiap Sesi', updated_at: nowStr },
    { id: 6, setting_key: 'low_stock_threshold', setting_value: '20', description: 'Paras Amaran Stok Rendah', updated_at: nowStr },
    { id: 7, setting_key: 'expiry_alert_days', setting_value: '30', description: 'Tempoh Hari Amaran Tarikh Luput', updated_at: nowStr },
    { id: 8, setting_key: 'currency_symbol', setting_value: 'RM', description: 'Mata Wang Utama', updated_at: nowStr },
    { id: 9, setting_key: 'kiosk_idle_seconds', setting_value: '30', description: 'Masa Had Reset Automatik Kiosk (Saat)', updated_at: nowStr }
  ];

  // 2. Programmes
  const programmes = [
    { id: 1, programme_code: 'STE', programme_name: 'Sijil Teknologi Elektrik', status: 'ACTIVE', created_at: nowStr },
    { id: 2, programme_code: 'STM', programme_name: 'Sijil Teknologi Maklumat', status: 'ACTIVE', created_at: nowStr },
    { id: 3, programme_code: 'STA', programme_name: 'Sijil Teknologi Automotif', status: 'ACTIVE', created_at: nowStr },
    { id: 4, programme_code: 'STS', programme_name: 'Sijil Teknologi Senibina', status: 'ACTIVE', created_at: nowStr },
    { id: 5, programme_code: 'DTKP', programme_name: 'Diploma Teknologi Kenderaan Perdagangan', status: 'ACTIVE', created_at: nowStr }
  ];

  // 3. Users
  const users = [
    { id: 1, username: 'superadmin', email: 'superadmin@kkbda.edu.my', password_hash: bcrypt.hashSync('admin123', salt), role: 'superadmin', name: 'Ts. Dr. Ahmad Fikri Bin Zainal (Super Admin)', status: 'ACTIVE', last_login: '2026-09-02 08:30:00', created_at: nowStr },
    { id: 2, username: 'uappadmin', email: 'uapp@kkbda.edu.my', password_hash: bcrypt.hashSync('uapp123', salt), role: 'uappadmin', name: 'Puan Siti Rahmah Binti Osman (Pegawai UAPP)', status: 'ACTIVE', last_login: '2026-09-02 09:00:00', created_at: nowStr },
    { id: 3, username: 'operator', email: 'operator@kkbda.edu.my', password_hash: bcrypt.hashSync('operator123', salt), role: 'operator', name: 'Encik Muhammad Haziq Bin Radzi (Petugas Dapur Siswa)', status: 'ACTIVE', last_login: '2026-09-02 09:15:00', created_at: nowStr },
    { id: 4, username: 'student001', email: 'aisyah@student.kkbda.edu.my', password_hash: bcrypt.hashSync('student123', salt), role: 'student', name: 'Nur Aisyah Binti Ahmad', status: 'ACTIVE', last_login: null, created_at: nowStr }
  ];

  // 4. Categories
  const food_categories = [
    { id: 1, name: 'Beverage', description: 'Minuman segera, susu sedia diminum dan malt coklat', status: 'ACTIVE' },
    { id: 2, name: 'Snack', description: 'Snek ringan berkhasiat', status: 'ACTIVE' },
    { id: 3, name: 'Breakfast', description: 'Bijirin dan sajian mudah sarapan pagi', status: 'ACTIVE' },
    { id: 4, name: 'Ready-to-Eat', description: 'Makanan sedia dimakan dan mi segera', status: 'ACTIVE' },
    { id: 5, name: 'Biscuits', description: 'Biskut kraker, biskut krim dan wafer', status: 'ACTIVE' },
    { id: 6, name: 'Cereal', description: 'Oat, bijirin bar dan kepingan jagung', status: 'ACTIVE' },
    { id: 7, name: 'Bread', description: 'Roti sandwich, ban berinti dan pastri', status: 'ACTIVE' },
    { id: 8, name: 'Other', description: 'Keperluan makanan asas lain', status: 'ACTIVE' }
  ];

  // 5. Food Items
  const food_items = [
    { id: 1, item_code: 'FB001', name: 'Milo 3-in-1 (Sachet)', category_id: 1, description: 'Pek minuman malt coklat bertenaga', unit: 'Sachet', minimum_stock: 30, maximum_stock: 300, estimated_unit_cost: 1.20, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 2, item_code: 'FB002', name: 'Biskut Hup Seng Cream Crackers', category_id: 5, description: 'Kraker berkrim rangup berkhasiat', unit: 'Pek', minimum_stock: 25, maximum_stock: 200, estimated_unit_cost: 2.50, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 3, item_code: 'FB003', name: 'Nestum Grains & More 3-in-1', category_id: 3, description: 'Bijirin sarapan pagi berkhasiat serat tinggi', unit: 'Sachet', minimum_stock: 20, maximum_stock: 200, estimated_unit_cost: 1.10, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 4, item_code: 'FB004', name: 'Roti Gardenia Classic', category_id: 7, description: 'Roti putih lembut segar', unit: 'Buku', minimum_stock: 15, maximum_stock: 100, estimated_unit_cost: 3.20, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 5, item_code: 'FB005', name: 'Susu UHT Dutch Lady Coklat 200ml', category_id: 1, description: 'Susu segar berperisa coklat', unit: 'Kotak', minimum_stock: 25, maximum_stock: 250, estimated_unit_cost: 2.00, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 6, item_code: 'FB006', name: 'Maggi Mi Goreng Asli', category_id: 4, description: 'Mi segera goreng perisa istimewa', unit: 'Pek', minimum_stock: 30, maximum_stock: 300, estimated_unit_cost: 1.50, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 7, item_code: 'FB007', name: 'Oat Krunch Biskut Coklat', category_id: 5, description: 'Biskut oat rangup cip coklat', unit: 'Pek', minimum_stock: 20, maximum_stock: 150, estimated_unit_cost: 2.80, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 8, item_code: 'FB008', name: 'Yeo’s Minuman Kacang Soya 250ml', category_id: 1, description: 'Minuman kacang soya kaya protein', unit: 'Kotak', minimum_stock: 20, maximum_stock: 200, estimated_unit_cost: 1.80, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 9, item_code: 'FB009', name: 'Koko Krunch Cereal Bar 25g', category_id: 6, description: 'Bar bijirin gandum coklat rangup', unit: 'Pek', minimum_stock: 25, maximum_stock: 250, estimated_unit_cost: 1.60, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 10, item_code: 'FB010', name: 'Julie’s Peanut Butter Sandwich', category_id: 5, description: 'Biskut sandwic mentega kacang', unit: 'Pek', minimum_stock: 20, maximum_stock: 180, estimated_unit_cost: 2.90, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 11, item_code: 'FB011', name: 'Sardin Ayam Brand Mini 155g', category_id: 4, description: 'Ikan sardin premium dalam sos tomato enak', unit: 'Tin', minimum_stock: 15, maximum_stock: 120, estimated_unit_cost: 4.50, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 12, item_code: 'FB012', name: 'Kopi O Hang Tuah uncang', category_id: 1, description: 'Kopi O tradisional aroma asli', unit: 'Uncang', minimum_stock: 20, maximum_stock: 150, estimated_unit_cost: 0.90, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 13, item_code: 'FB013', name: 'Biskut Oreo Vanilla Mini Pack', category_id: 2, description: 'Biskut sandwic coklat krim vanila', unit: 'Pek', minimum_stock: 20, maximum_stock: 150, estimated_unit_cost: 2.20, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 14, item_code: 'FB014', name: 'Roti Bun Gardenia Coklat', category_id: 7, description: 'Ban gebu berinti krim coklat', unit: 'Pek', minimum_stock: 15, maximum_stock: 100, estimated_unit_cost: 1.30, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr },
    { id: 15, item_code: 'FB015', name: 'Nestle Koko Krunch Breakfast Cereal', category_id: 3, description: 'Mangkuk bijirin mini sarapan', unit: 'Mangkuk', minimum_stock: 15, maximum_stock: 120, estimated_unit_cost: 2.70, status: 'ACTIVE', created_at: nowStr, updated_at: nowStr }
  ];

  // 6. 30 Demo Students
  const rawStudents = [
    ['KKBDA001', 'Nur Aisyah Binti Ahmad', '050214-02-5542', 2, 3, 'A', '013-4567891', 'aisyah@student.kkbda.edu.my', 'TOKEN-KKBDA001-9F38A'],
    ['KKBDA002', 'Muhammad Faris Bin Zakaria', '040819-08-6123', 1, 4, 'B', '017-8901234', 'faris@student.kkbda.edu.my', 'TOKEN-KKBDA002-3B71C'],
    ['KKBDA003', 'Siti Hajar Binti Mohamad', '051120-02-5884', 2, 2, 'A', '011-2345678', 'hajar@student.kkbda.edu.my', 'TOKEN-KKBDA003-8D29F'],
    ['KKBDA004', 'Danish Iskandar Bin Azman', '060105-02-6331', 3, 1, 'C', '019-9876543', 'danish@student.kkbda.edu.my', 'TOKEN-KKBDA004-1E44A'],
    ['KKBDA005', 'Amirul Hakim Bin Rosli', '040512-07-5119', 5, 4, 'A', '012-3456789', 'amirul@student.kkbda.edu.my', 'TOKEN-KKBDA005-7A92K'],
    ['KKBDA006', 'Fatin Nabilah Binti Yusof', '050318-02-5440', 4, 3, 'B', '014-5678901', 'fatin@student.kkbda.edu.my', 'TOKEN-KKBDA006-4C18M'],
    ['KKBDA007', 'Wan Muhammad Luqman Bin Wan Hassan', '041209-03-6225', 1, 3, 'A', '018-9012345', 'luqman@student.kkbda.edu.my', 'TOKEN-KKBDA007-9H55P'],
    ['KKBDA008', 'Nurul Izzah Binti Kamaruddin', '050723-02-5992', 2, 2, 'B', '016-7890123', 'izzah@student.kkbda.edu.my', 'TOKEN-KKBDA008-2V88T'],
    ['KKBDA009', 'Hariz Haikal Bin Mustaffa', '050930-02-6773', 3, 2, 'A', '011-8765432', 'hariz@student.kkbda.edu.my', 'TOKEN-KKBDA009-6Q31X'],
    ['KKBDA010', 'Nur Safiyyah Binti Zulkifli', '040404-02-5116', 4, 4, 'A', '013-8901234', 'safiyyah@student.kkbda.edu.my', 'TOKEN-KKBDA010-5W20Y'],
    ['KKBDA011', 'Adam Harith Bin Razali', '060211-02-6007', 1, 1, 'C', '017-6543210', 'adam@student.kkbda.edu.my', 'TOKEN-KKBDA011-3P90Z'],
    ['KKBDA012', 'Ainur Mardhiah Binti Shuib', '050615-08-5668', 2, 3, 'A', '019-1234567', 'ainur@student.kkbda.edu.my', 'TOKEN-KKBDA012-7L44R'],
    ['KKBDA013', 'Muhammad Iman Bin Shahrul', '041010-02-6559', 5, 4, 'B', '012-8765432', 'iman@student.kkbda.edu.my', 'TOKEN-KKBDA013-8S12E'],
    ['KKBDA014', 'Nur Damia Binti Khalid', '050808-02-5224', 4, 2, 'A', '014-9876543', 'damia@student.kkbda.edu.my', 'TOKEN-KKBDA014-9G67W'],
    ['KKBDA015', 'Syed Naufal Bin Syed Ali', '040321-01-5337', 3, 4, 'A', '018-2345678', 'naufal@student.kkbda.edu.my', 'TOKEN-KKBDA015-1N83K'],
    ['KKBDA016', 'Nur Farah Diana Binti Azhar', '050505-02-5770', 2, 3, 'B', '016-3456789', 'farah@student.kkbda.edu.my', 'TOKEN-KKBDA016-2J49L'],
    ['KKBDA017', 'Muhammad Afiq Bin Johari', '060129-02-6883', 1, 1, 'A', '011-3456789', 'afiq@student.kkbda.edu.my', 'TOKEN-KKBDA017-3K82U'],
    ['KKBDA018', 'Puteri Balqis Binti Megat Ismail', '050117-08-5334', 4, 3, 'A', '013-2345678', 'balqis@student.kkbda.edu.my', 'TOKEN-KKBDA018-4M76N'],
    ['KKBDA019', 'Izzat Rayyan Bin Sabri', '040925-02-6441', 3, 3, 'B', '017-3456789', 'izzat@student.kkbda.edu.my', 'TOKEN-KKBDA019-5H19O'],
    ['KKBDA020', 'Siti Khadijah Binti Othman', '051212-02-5006', 2, 1, 'C', '019-8765432', 'khadijah@student.kkbda.edu.my', 'TOKEN-KKBDA020-6B54P'],
    ['KKBDA021', 'Muhammad Haziq Bin Abdullah', '040707-02-6229', 5, 3, 'A', '012-9876543', 'haziq@student.kkbda.edu.my', 'TOKEN-KKBDA021-7D38Q'],
    ['KKBDA022', 'Nur Syamimi Binti Halim', '050428-02-5662', 1, 2, 'B', '014-3456789', 'syamimi@student.kkbda.edu.my', 'TOKEN-KKBDA022-8F92R'],
    ['KKBDA023', 'Aiman Daniel Bin Nazri', '060303-02-6115', 3, 1, 'B', '018-7654321', 'aiman@student.kkbda.edu.my', 'TOKEN-KKBDA023-9X23S'],
    ['KKBDA024', 'Nurul Husna Binti Badlishah', '041114-08-5880', 4, 4, 'B', '016-8765432', 'husna@student.kkbda.edu.my', 'TOKEN-KKBDA024-1Y74T'],
    ['KKBDA025', 'Muhammad Zaim Bin Khairi', '050220-02-6997', 2, 3, 'A', '011-9876543', 'zaim@student.kkbda.edu.my', 'TOKEN-KKBDA025-2Z85U'],
    ['KKBDA026', 'Sarah Alisya Binti Badrul', '050909-02-5332', 1, 2, 'A', '013-9876543', 'sarah@student.kkbda.edu.my', 'TOKEN-KKBDA026-3A96V'],
    ['KKBDA027', 'Khairul Anuar Bin Mokhtar', '040618-02-6663', 5, 4, 'A', '017-8765432', 'khairul@student.kkbda.edu.my', 'TOKEN-KKBDA027-4C07W'],
    ['KKBDA028', 'Anis Syuhada Binti Mansor', '050305-02-5118', 3, 2, 'B', '019-2345678', 'anis@student.kkbda.edu.my', 'TOKEN-KKBDA028-5E18X'],
    ['KKBDA029', 'Luqman Hakim Bin Jalil', '060202-02-6449', 4, 1, 'A', '012-7654321', 'luqmanh@student.kkbda.edu.my', 'TOKEN-KKBDA029-6G29Y'],
    ['KKBDA030', 'Nur Rabiatul Binti Adnan', '041005-08-5444', 2, 4, 'A', '014-8765432', 'rabiatul@student.kkbda.edu.my', 'TOKEN-KKBDA030-7J40Z']
  ];

  const students = rawStudents.map((st, idx) => ({
    id: idx + 1,
    student_id: st[0],
    name: st[1],
    ic_number: st[2],
    programme_id: st[3],
    semester: st[4],
    class_group: st[5],
    phone: st[6],
    email: st[7],
    status: 'ACTIVE',
    qr_token: st[8],
    created_at: nowStr,
    updated_at: nowStr
  }));

  // 7. Batches & Stock In Transactions
  const batchDefs = [
    { itemId: 1, batch: 'B-MILO-26A', qtyRec: 150, qtyRem: 45, expiry: '2026-09-08', recDate: '2026-08-01', cost: 1.20, src: 'Peruntukan KPT' },
    { itemId: 1, batch: 'B-MILO-26B', qtyRec: 200, qtyRem: 120, expiry: '2027-06-30', recDate: '2026-08-20', cost: 1.20, src: 'Sumbangan Alumni KKBDA' },
    { itemId: 2, batch: 'B-CRACK-26A', qtyRec: 100, qtyRem: 12, expiry: '2026-09-22', recDate: '2026-08-05', cost: 2.50, src: 'Peruntukan KPT' },
    { itemId: 2, batch: 'B-CRACK-26B', qtyRec: 100, qtyRem: 80, expiry: '2027-08-15', recDate: '2026-08-25', cost: 2.50, src: 'Penderma Korporat' },
    { itemId: 3, batch: 'B-NEST-26A', qtyRec: 120, qtyRem: 65, expiry: '2027-04-10', recDate: '2026-08-10', cost: 1.10, src: 'Peruntukan KPT' },
    { itemId: 4, batch: 'B-ROTI-26A', qtyRec: 40, qtyRem: 8, expiry: '2026-09-06', recDate: '2026-09-01', cost: 3.20, src: 'Pembekal Tempatan' },
    { itemId: 5, batch: 'B-SUSU-26A', qtyRec: 150, qtyRem: 95, expiry: '2027-01-15', recDate: '2026-08-15', cost: 2.00, src: 'Peruntukan KPT' },
    { itemId: 6, batch: 'B-MAGGI-26A', qtyRec: 180, qtyRem: 110, expiry: '2027-05-20', recDate: '2026-08-12', cost: 1.50, src: 'Peruntukan KPT' },
    { itemId: 7, batch: 'B-OAT-26A', qtyRec: 80, qtyRem: 42, expiry: '2026-09-28', recDate: '2026-08-18', cost: 2.80, src: 'Sumbangan Staf KKBDA' },
    { itemId: 8, batch: 'B-SOYA-26A', qtyRec: 120, qtyRem: 78, expiry: '2027-03-30', recDate: '2026-08-15', cost: 1.80, src: 'Peruntukan KPT' },
    { itemId: 9, batch: 'B-KOKO-26A', qtyRec: 150, qtyRem: 90, expiry: '2027-07-10', recDate: '2026-08-20', cost: 1.60, src: 'Sumbangan Luar' },
    { itemId: 10, batch: 'B-JULIE-26A', qtyRec: 90, qtyRem: 55, expiry: '2027-02-28', recDate: '2026-08-10', cost: 2.90, src: 'Peruntukan KPT' },
    { itemId: 11, batch: 'B-SARD-26A', qtyRec: 60, qtyRem: 9, expiry: '2028-01-01', recDate: '2026-08-01', cost: 4.50, src: 'Peruntukan KPT' },
    { itemId: 12, batch: 'B-KOPI-26A', qtyRec: 100, qtyRem: 60, expiry: '2027-10-15', recDate: '2026-08-15', cost: 0.90, src: 'Sumbangan NGO' },
    { itemId: 13, batch: 'B-OREO-26A', qtyRec: 80, qtyRem: 48, expiry: '2027-04-20', recDate: '2026-08-20', cost: 2.20, src: 'Peruntukan KPT' },
    { itemId: 14, batch: 'B-BUN-26A', qtyRec: 50, qtyRem: 14, expiry: '2026-09-07', recDate: '2026-09-01', cost: 1.30, src: 'Pembekal Tempatan' },
    { itemId: 15, batch: 'B-BOWL-26A', qtyRec: 70, qtyRem: 38, expiry: '2027-03-15', recDate: '2026-08-10', cost: 2.70, src: 'Peruntukan KPT' }
  ];

  const inventory_batches = [];
  const stock_transactions = [];
  let txCount = 1;

  for (let i = 0; i < batchDefs.length; i++) {
    const b = batchDefs[i];
    const batchId = i + 1;
    inventory_batches.push({
      id: batchId,
      food_item_id: b.itemId,
      batch_number: b.batch,
      quantity_received: b.qtyRec,
      quantity_remaining: b.qtyRem,
      expiry_date: b.expiry,
      received_date: b.recDate,
      unit_cost: b.cost,
      source: b.src,
      status: 'ACTIVE',
      created_at: `${b.recDate} 09:00:00`
    });

    const txCode = `SIN-2026-${String(txCount++).padStart(6, '0')}`;
    stock_transactions.push({
      id: stock_transactions.length + 1,
      transaction_code: txCode,
      transaction_type: 'STOCK_IN',
      food_item_id: b.itemId,
      batch_id: batchId,
      quantity: b.qtyRec,
      balance_after: b.qtyRec,
      student_id: null,
      operator_id: 2,
      remarks: `Penerimaan stok awal dari ${b.src}`,
      created_at: `${b.recDate} 09:00:00`
    });
  }

  // 8. Distribution Records (18 historical records)
  const distribution_transactions = [];
  const distribution_items = [];
  let distCount = 1;
  let soutCount = 1;

  const dates = [
    '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29',
    '2026-09-01', '2026-09-02'
  ];

  for (let i = 0; i < 18; i++) {
    const std = students[i];
    const dateStr = dates[i % dates.length];
    const timeStr = `${String(9 + (i % 7)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00`;
    const createdAt = `${dateStr} ${timeStr}`;

    const distCode = `FDB-2026-${String(distCount++).padStart(6, '0')}`;
    const isOverride = i === 15 ? 1 : 0;
    const overrideReason = isOverride ? 'Kelulusan Khas UAPP untuk sesi amali petang' : null;

    const selectedBatches = [
      inventory_batches[i % inventory_batches.length],
      inventory_batches[(i + 3) % inventory_batches.length],
      ...(i % 2 === 0 ? [inventory_batches[(i + 7) % inventory_batches.length]] : [])
    ];

    const distTxId = distribution_transactions.length + 1;
    distribution_transactions.push({
      id: distTxId,
      transaction_code: distCode,
      student_id: std.id,
      operator_id: 3,
      total_items: selectedBatches.length,
      override_used: isOverride,
      override_reason: overrideReason,
      created_at: createdAt
    });

    for (const b of selectedBatches) {
      const diId = distribution_items.length + 1;
      distribution_items.push({
        id: diId,
        distribution_transaction_id: distTxId,
        food_item_id: b.food_item_id,
        batch_id: b.id,
        quantity: 1
      });

      const soutCode = `SOUT-2026-${String(soutCount++).padStart(6, '0')}`;
      stock_transactions.push({
        id: stock_transactions.length + 1,
        transaction_code: soutCode,
        transaction_type: 'STOCK_OUT',
        food_item_id: b.food_item_id,
        batch_id: b.id,
        quantity: -1,
        balance_after: b.quantity_remaining,
        student_id: std.id,
        operator_id: 3,
        remarks: `Pengambilan makanan oleh pelajar ${std.name} (${distCode})`,
        created_at: createdAt
      });
    }
  }

  // 9. Inventory Adjustments
  const inventory_adjustments = [
    {
      id: 1,
      food_item_id: 4,
      batch_id: 6,
      adjustment_type: 'Damaged',
      quantity: -2,
      reason: 'Bungkusan kemek semasa pemindahan stor',
      authorized_by: 'Puan Siti Rahmah (Admin UAPP)',
      operator_id: 2,
      created_at: '2026-09-01 14:30:00'
    }
  ];

  stock_transactions.push({
    id: stock_transactions.length + 1,
    transaction_code: 'ADJ-2026-000001',
    transaction_type: 'DAMAGED',
    food_item_id: 4,
    batch_id: 6,
    quantity: -2,
    balance_after: 8,
    student_id: null,
    operator_id: 2,
    remarks: 'Pelarasan stok: Bungkusan rosak/kemek',
    created_at: '2026-09-01 14:30:00'
  });

  // 10. Audit Logs
  const audit_logs = [
    { id: 1, user_id: 2, action: 'INITIAL_SETUP', module: 'SYSTEM', record_id: 'SYS-001', description: 'Inisialisasi sistem JOM KENYANG dan penetapan tetapan asas', ip_address: '127.0.0.1', created_at: '2026-09-01 08:00:00' },
    { id: 2, user_id: 2, action: 'CREATE_BATCH', module: 'STOCK_IN', record_id: 'SIN-2026-000001', description: 'Penerimaan stok awal 15 item makanan ke dalam pangkalan data', ip_address: '127.0.0.1', created_at: '2026-09-01 08:30:00' },
    { id: 3, user_id: 3, action: 'DISTRIBUTION', module: 'DISTRIBUTION', record_id: 'FDB-2026-000001', description: 'Agihan bantuan makanan kepada pelajar Nur Aisyah (KKBDA001)', ip_address: '127.0.0.1', created_at: '2026-09-01 10:15:00' },
    { id: 4, user_id: 2, action: 'STOCK_ADJUSTMENT', module: 'INVENTORY_ADJUSTMENT', record_id: 'ADJ-2026-000001', description: 'Pelarasan stok rosak untuk Roti Gardenia Classic (-2 buku)', ip_address: '127.0.0.1', created_at: '2026-09-01 14:30:00' }
  ];

  // 11. Notifications
  const notifications = [
    { id: 1, type: 'CRITICAL_STOCK', title: 'Stok Kritikal: Roti Gardenia Classic', message: 'Baki stok semasa hanya 8 buku (Minimum: 15). Sila buat pesanan segera.', status: 'UNREAD', created_at: '2026-09-02 08:30:00' },
    { id: 2, type: 'EXPIRING_SOON', title: 'Tarikh Luput Mendekati: Milo 3-in-1 (Batch B-MILO-26A)', message: 'Batch ini akan luput pada 08/09/2026 (6 hari lagi). Baki 45 sachet.', status: 'UNREAD', created_at: '2026-09-02 08:45:00' },
    { id: 3, type: 'LOW_STOCK', title: 'Stok Rendah: Sardin Ayam Brand Mini', message: 'Baki stok semasa hanya 9 tin (Minimum: 15).', status: 'UNREAD', created_at: '2026-09-02 09:15:00' },
    { id: 4, type: 'SYSTEM', title: 'Sistem JOM KENYANG Sedia Digunakan', message: 'Sistem pengurusan digital Jom Kenyang — Dapur Siswa beroperasi sepenuhnya.', status: 'UNREAD', created_at: '2026-09-02 08:00:00' }
  ];

  const dbData = {
    users,
    programmes,
    students,
    food_categories,
    food_items,
    inventory_batches,
    stock_transactions,
    distribution_transactions,
    distribution_items,
    inventory_adjustments,
    system_settings,
    audit_logs,
    notifications,
    counters: {
      users: users.length,
      programmes: programmes.length,
      students: students.length,
      food_categories: food_categories.length,
      food_items: food_items.length,
      inventory_batches: inventory_batches.length,
      stock_transactions: stock_transactions.length,
      distribution_transactions: distribution_transactions.length,
      distribution_items: distribution_items.length,
      inventory_adjustments: inventory_adjustments.length,
      system_settings: system_settings.length,
      audit_logs: audit_logs.length,
      notifications: notifications.length
    }
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
  console.log('✅ JOM KENYANG JSON DB Seed complete!');
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
