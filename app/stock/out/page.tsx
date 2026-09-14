'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { 
  ArrowUpFromLine, 
  HeartHandshake, 
  Search, 
  FileSpreadsheet, 
  Layers,
  History
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function StockOutPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) setCurrentUser(d.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));

    fetch('/api/stock/out?type=STOCK_OUT')
      .then(res => res.json())
      .then(d => {
        setTransactions(d.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const exportToExcel = () => {
    const rows = transactions.map(t => ({
      'No. Transaksi': t.transaction_code,
      'Tarikh & Masa': t.created_at,
      'Item Makanan': t.food_item_name,
      'Kod Item': t.item_code,
      'Kuantiti Keluar': Math.abs(t.quantity),
      'Unit': t.unit,
      'Baki Selepas': t.balance_after,
      'Nama Pelajar': t.student_name || '-',
      'ID Pelajar': t.student_code || '-',
      'Petugas': t.operator_name,
      'Catatan': t.remarks
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Out');
    XLSX.writeFile(wb, `Stock_Out_Foodbank_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns: Column<any>[] = [
    {
      key: 'transaction_code',
      header: 'No. Transaksi',
      render: (t) => (
        <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
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
      key: 'food_item_name',
      header: 'Item Makanan',
      render: (t) => (
        <div>
          <span className="font-bold text-slate-900">{t.food_item_name}</span>
          <span className="text-[10px] text-slate-400 block font-mono">{t.item_code}</span>
        </div>
      )
    },
    {
      key: 'quantity',
      header: 'Kuantiti Agihan',
      render: (t) => (
        <span className="font-extrabold text-orange-600 text-sm">
          {t.quantity} {t.unit}
        </span>
      )
    },
    {
      key: 'student_name',
      header: 'Penerima (Pelajar)',
      render: (t) => (
        <div>
          <span className="font-bold text-slate-800">{t.student_name || '-'}</span>
          <span className="text-[10px] text-emerald-700 block font-mono">{t.student_code}</span>
        </div>
      )
    },
    {
      key: 'operator_name',
      header: 'Petugas / Operator',
      render: (t) => <span className="text-slate-600">{t.operator_name || '-'}</span>
    },
    {
      key: 'remarks',
      header: 'Catatan Agihan',
      render: (t) => <span className="text-[11px] text-slate-500 truncate max-w-xs">{t.remarks}</span>
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="KELUARAN STOK (STOCK OUT)" 
          subtitle="Rekod Pengeluaran Makanan & Agihan Kepada Siswa" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Senarai Log Pengeluaran Stok Makanan</h3>
              <p className="text-xs text-slate-500">Semua keluaran stok dikaitkan secara automatik dengan transaksi agihan pelajar</p>
            </div>

            <Link
              href="/pengambilan"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5"
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Buka Stesen Pengambilan Makanan</span>
            </Link>
          </div>

          <DataTable
            data={transactions}
            columns={columns}
            keyField="id"
            searchPlaceholder="Cari transaksi keluaran, nama pelajar, kod item..."
            onExportExcel={exportToExcel}
          />
        </main>
      </div>
    </div>
  );
}
