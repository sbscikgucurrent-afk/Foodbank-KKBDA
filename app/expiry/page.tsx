'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import DataTable, { Column } from '@/components/DataTable';
import { Clock, AlertTriangle, CheckCircle2, ArrowDownToLine, Layers, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExpiryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
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
      .then(d => {
        const items = d.items || [];
        const allBatches: any[] = [];
        const today = new Date();

        items.forEach((item: any) => {
          if (item.earliest_expiry) {
            // Calculate status & days left
            const expDate = new Date(item.earliest_expiry);
            const diffTime = expDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'NORMAL' = 'NORMAL';
            if (daysLeft < 0) status = 'EXPIRED';
            else if (daysLeft <= 7) status = 'CRITICAL';
            else if (daysLeft <= 30) status = 'WARNING';

            allBatches.push({
              id: item.id,
              food_item_id: item.id,
              item_code: item.item_code,
              food_item_name: item.name,
              category_name: item.category_name,
              unit: item.unit,
              current_stock: item.current_stock || 0,
              earliest_expiry: item.earliest_expiry,
              days_left: daysLeft,
              status
            });
          }
        });

        // Sort by earliest expiry first
        allBatches.sort((a, b) => a.earliest_expiry.localeCompare(b.earliest_expiry));
        setBatches(allBatches);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const filteredBatches = batches.filter(b => {
    if (filterStatus === 'ALL') return true;
    return b.status === filterStatus;
  });

  const exportToExcel = () => {
    const rows = filteredBatches.map(b => ({
      'Kod Item': b.item_code,
      'Nama Makanan': b.food_item_name,
      'Kategori': b.category_name,
      'Baki Stok': `${b.current_stock} ${b.unit}`,
      'Tarikh Luput': b.earliest_expiry,
      'Hari Berbaki': b.days_left < 0 ? 'TELAH LUPUT' : `${b.days_left} Hari`,
      'Status FEFO': b.status
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pemantauan Tarikh Luput');
    XLSX.writeFile(wb, `Pemantauan_Tarikh_Luput_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns: Column<any>[] = [
    {
      key: 'item_code',
      header: 'Kod Item',
      render: (b) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {b.item_code}
        </span>
      )
    },
    {
      key: 'food_item_name',
      header: 'Nama Makanan',
      render: (b) => (
        <div>
          <span className="font-bold text-slate-900">{b.food_item_name}</span>
          <span className="text-[10px] text-slate-400 block">{b.category_name}</span>
        </div>
      )
    },
    {
      key: 'current_stock',
      header: 'Baki Stok Semasa',
      render: (b) => (
        <span className="font-extrabold text-slate-800 text-sm">
          {b.current_stock} {b.unit}
        </span>
      )
    },
    {
      key: 'earliest_expiry',
      header: 'Tarikh Luput Terawal',
      render: (b) => (
        <span className="font-mono font-bold text-slate-800 text-xs">
          {b.earliest_expiry}
        </span>
      )
    },
    {
      key: 'days_left',
      header: 'Tempoh Hari Berbaki',
      render: (b) => {
        if (b.days_left < 0) {
          return <span className="font-extrabold text-red-600 text-xs">TELAH LUPUT ({Math.abs(b.days_left)} hari lalu)</span>;
        }
        return (
          <span className={`font-bold text-xs ${b.days_left <= 7 ? 'text-rose-600' : b.days_left <= 30 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {b.days_left} Hari Lagi
          </span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status FEFO',
      render: (b) => <StatusBadge status={b.status} size="sm" />
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="PEMANTAUAN TARIKH LUPUT (EXPIRY MONITORING)" 
          subtitle="Modul Penjejakan Luput Makanan & Keutamaan Agihan FEFO" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {/* Top Filter & Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div 
              onClick={() => setFilterStatus('ALL')} 
              className={`p-4 rounded-xl border cursor-pointer transition-all ${filterStatus === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-800 border-slate-200'}`}
            >
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Keseluruhan Item</span>
              <span className="text-2xl font-bold mt-1 block">{batches.length} Item</span>
            </div>

            <div 
              onClick={() => setFilterStatus('CRITICAL')} 
              className={`p-4 rounded-xl border cursor-pointer transition-all ${filterStatus === 'CRITICAL' ? 'bg-red-700 text-white shadow-md' : 'bg-white text-rose-800 border-rose-200'}`}
            >
              <span className="text-[11px] uppercase tracking-wider text-rose-600 block font-semibold">Kritikal (≤ 7 Hari)</span>
              <span className="text-2xl font-bold mt-1 block">{batches.filter(b => b.status === 'CRITICAL').length} Item</span>
            </div>

            <div 
              onClick={() => setFilterStatus('WARNING')} 
              className={`p-4 rounded-xl border cursor-pointer transition-all ${filterStatus === 'WARNING' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-amber-900 border-amber-200'}`}
            >
              <span className="text-[11px] uppercase tracking-wider text-amber-600 block font-semibold">Amaran (≤ 30 Hari)</span>
              <span className="text-2xl font-bold mt-1 block">{batches.filter(b => b.status === 'WARNING').length} Item</span>
            </div>

            <div 
              onClick={() => setFilterStatus('EXPIRED')} 
              className={`p-4 rounded-xl border cursor-pointer transition-all ${filterStatus === 'EXPIRED' ? 'bg-slate-800 text-red-400 shadow-md' : 'bg-white text-slate-700 border-slate-200'}`}
            >
              <span className="text-[11px] uppercase tracking-wider text-slate-500 block font-semibold">Telah Luput</span>
              <span className="text-2xl font-bold mt-1 block">{batches.filter(b => b.status === 'EXPIRED').length} Item</span>
            </div>
          </div>

          <DataTable
            data={filteredBatches}
            columns={columns}
            keyField="id"
            searchPlaceholder="Cari item makanan, kod..."
            onExportExcel={exportToExcel}
          />
        </main>
      </div>
    </div>
  );
}
