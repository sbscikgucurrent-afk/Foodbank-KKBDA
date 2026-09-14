'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { ShieldCheck, History, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AuditLogsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) setCurrentUser(d.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadAudit = () => {
    setLoading(true);
    let url = `/api/audit-logs`;
    if (selectedModule && selectedModule !== 'ALL') {
      url += `?module=${selectedModule}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(d => {
        setLogs(d.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAudit();
  }, [selectedModule]);

  const exportToExcel = () => {
    const rows = logs.map(l => ({
      'ID Log': l.id,
      'Tarikh & Masa': l.created_at,
      'Pengguna / Admin': l.user_name || '-',
      'Tindakan': l.action,
      'Modul': l.module,
      'Penerangan Ringkas': l.description,
      'Alamat IP': l.ip_address || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Log Audit');
    XLSX.writeFile(wb, `Log_Audit_Foodbank_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns: Column<any>[] = [
    {
      key: 'created_at',
      header: 'Tarikh & Masa',
      render: (l) => (
        <span className="font-mono text-xs text-slate-700 whitespace-nowrap">
          {l.created_at}
        </span>
      )
    },
    {
      key: 'user_name',
      header: 'Pengguna / Pegawai',
      render: (l) => (
        <div>
          <span className="font-bold text-slate-900">{l.user_name || 'Sistem'}</span>
          <span className="text-[10px] text-slate-400 block font-mono">ID: {l.user_id || 'SYS'}</span>
        </div>
      )
    },
    {
      key: 'module',
      header: 'Modul',
      render: (l) => <StatusBadge status={l.module} size="sm" />
    },
    {
      key: 'action',
      header: 'Tindakan (Action)',
      render: (l) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
          {l.action}
        </span>
      )
    },
    {
      key: 'description',
      header: 'Penerangan Aktiviti',
      render: (l) => <span className="text-xs text-slate-700">{l.description}</span>
    },
    {
      key: 'ip_address',
      header: 'Alamat IP',
      render: (l) => <span className="font-mono text-[11px] text-slate-400">{l.ip_address || '127.0.0.1'}</span>
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="LOG AUDIT SISTEM (SYSTEM AUDIT TRAIL)" 
          subtitle="Rekod Transaksi Kekal Tanpa Boleh Dipadam Bagi Menjamin Integriti" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
              >
                <option value="ALL">Semua Modul Log</option>
                <option value="AUTH">Aktiviti Log Masuk / Keluar</option>
                <option value="STUDENT">Pengurusan Pelajar</option>
                <option value="INVENTORY">Katalog Makanan & Batch</option>
                <option value="DISTRIBUTION">Agihan Makanan Siswa</option>
                <option value="STOCK_IN">Stock In</option>
                <option value="ADJUSTMENT">Pelarasan Stok</option>
              </select>

              <span className="text-xs text-slate-500">
                Jumlah: {logs.length} rekod audit
              </span>
            </div>
          </div>

          <DataTable
            data={logs}
            columns={columns}
            keyField="id"
            searchPlaceholder="Cari penerangan log, pengguna, tindakan..."
            onExportExcel={exportToExcel}
          />
        </main>
      </div>
    </div>
  );
}
