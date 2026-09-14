'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { History, FileSpreadsheet, Layers, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TransactionLedgerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) setCurrentUser(d.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));

    fetch('/api/inventory?status=ACTIVE')
      .then(res => res.json())
      .then(d => setFoodItems(d.items || []))
      .catch(() => {});
  }, [router]);

  const loadLedger = () => {
    setLoading(true);
    let url = `/api/stock/ledger?type=${selectedType}`;
    if (selectedItemId) url += `&food_item_id=${selectedItemId}`;

    fetch(url)
      .then(res => res.json())
      .then(d => {
        setTransactions(d.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadLedger();
  }, [selectedType, selectedItemId]);

  const exportToExcel = () => {
    const rows = transactions.map(t => ({
      'No. Transaksi': t.transaction_code,
      'Tarikh & Masa': t.created_at,
      'Jenis Transaksi': t.transaction_type,
      'Item Makanan': t.food_item_name,
      'Kod Item': t.item_code,
      'No. Batch': t.batch_number || '-',
      'Kuantiti Perubahan': t.quantity,
      'Unit': t.unit,
      'Baki Selepas': t.balance_after,
      'Pelajar (Penerima)': t.student_name || '-',
      'Petugas': t.operator_name || '-',
      'Catatan / Justifikasi': t.remarks || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lejar Transaksi');
    XLSX.writeFile(wb, `Lejar_Transaksi_Foodbank_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns: Column<any>[] = [
    {
      key: 'transaction_code',
      header: 'No. Transaksi',
      render: (t) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {t.transaction_code}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Tarikh & Masa',
      render: (t) => (
        <span className="font-mono text-xs text-slate-700 whitespace-nowrap">
          {t.created_at}
        </span>
      )
    },
    {
      key: 'transaction_type',
      header: 'Jenis Transaksi',
      render: (t) => <StatusBadge status={t.transaction_type} size="sm" />
    },
    {
      key: 'food_item_name',
      header: 'Item Makanan',
      render: (t) => (
        <div>
          <span className="font-bold text-slate-900">{t.food_item_name}</span>
          <span className="text-[10px] text-slate-400 block font-mono">{t.item_code} {t.batch_number ? `• ${t.batch_number}` : ''}</span>
        </div>
      )
    },
    {
      key: 'quantity',
      header: 'Kuantiti',
      render: (t) => (
        <span className={`font-extrabold text-sm ${t.quantity > 0 ? 'text-blue-700' : 'text-orange-700'}`}>
          {t.quantity > 0 ? `+${t.quantity}` : t.quantity} {t.unit}
        </span>
      )
    },
    {
      key: 'balance_after',
      header: 'Baki Selepas',
      render: (t) => (
        <span className="font-bold text-emerald-800 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {t.balance_after} {t.unit}
        </span>
      )
    },
    {
      key: 'student_name',
      header: 'Pelajar / Pihak Terlibat',
      render: (t) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs">{t.student_name || 'Operasi Stor'}</span>
          {t.student_code && <span className="text-[10px] text-slate-400 block font-mono">{t.student_code}</span>}
        </div>
      )
    },
    {
      key: 'operator_name',
      header: 'Pegawai / Petugas',
      render: (t) => <span className="text-slate-600 text-xs">{t.operator_name || 'Admin'}</span>
    },
    {
      key: 'remarks',
      header: 'Catatan & Justifikasi',
      render: (t) => <span className="text-[11px] text-slate-500 max-w-xs truncate block">{t.remarks || '-'}</span>
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="LEJAR TRANSAKSI INVENTORI (TRANSACTION HISTORY)" 
          subtitle="Audit Trail Kekal Semua Pergerakan Stok Masuk, Keluar & Pelarasan" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
              >
                <option value="ALL">Semua Jenis Transaksi</option>
                <option value="STOCK_IN">Stock In (Terimaan)</option>
                <option value="STOCK_OUT">Stock Out (Agihan Pelajar)</option>
                <option value="ADJUSTMENT">Pelarasan (Adjustment)</option>
                <option value="DAMAGED">Rosak / Kemek</option>
                <option value="EXPIRED">Telah Luput</option>
              </select>

              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium max-w-xs"
              >
                <option value="">Semua Item Makanan</option>
                {foodItems.map(i => (
                  <option key={i.id} value={i.id}>{i.item_code} - {i.name}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Menunjukkan {transactions.length} rekod transaksi lejar
            </div>
          </div>

          <DataTable
            data={transactions}
            columns={columns}
            keyField="id"
            searchPlaceholder="Cari no. transaksi, nama item, pelajar, catatan..."
            onExportExcel={exportToExcel}
          />
        </main>
      </div>
    </div>
  );
}
