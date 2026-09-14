'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DashboardCards from '@/components/DashboardCards';
import DashboardCharts from '@/components/DashboardCharts';
import DateRangeFilter from '@/components/DateRangeFilter';
import StatusBadge from '@/components/StatusBadge';
import QRScannerModal from '@/components/QRScannerModal';
import { 
  ArrowDownToLine, 
  HeartHandshake, 
  QrCode, 
  UserPlus, 
  PackagePlus, 
  FileText, 
  AlertTriangle, 
  Clock, 
  Coins, 
  TrendingUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    // Check auth
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then(userData => {
        if (userData?.user) {
          setCurrentUser(userData.user);
          if (userData.user.role === 'student') {
            router.push('/student');
          }
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadDashboardData = (p: string = period, cStart?: string, cEnd?: string) => {
    setLoading(true);
    let url = `/api/analytics?period=${p}`;
    if (p === 'custom' && cStart && cEnd) {
      url += `&customStart=${cStart}&customEnd=${cEnd}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(d => {
        if (d) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== 'student') {
      loadDashboardData(period, customStart, customEnd);
    }
  }, [currentUser, period]);

  const handlePeriodChange = (newPeriod: string, cStart?: string, cEnd?: string) => {
    setPeriod(newPeriod);
    if (cStart && cEnd) {
      setCustomStart(cStart);
      setCustomEnd(cEnd);
      loadDashboardData('custom', cStart, cEnd);
    } else {
      loadDashboardData(newPeriod);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-600">Memuatkan Dashboard JOM KENYANG...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    total_students: 0,
    students_served: 0,
    food_items_count: 0,
    current_total_stock: 0,
    stock_in_period: 0,
    stock_out_period: 0,
    low_stock_count: 0,
    expiring_soon_count: 0,
    estimated_inventory_value: 0,
    estimated_distributed_value: 0
  };

  const restockList = Array.isArray(data?.restock)
    ? data.restock.filter((r: any) => r && r.status !== 'ADEQUATE')
    : [];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        userRole={currentUser.role} 
        userName={currentUser.name} 
        onLogout={handleLogout} 
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          userName={currentUser.name} 
          userRole={currentUser.role} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {/* Quick Actions Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Tindakan Pantas (Quick Actions)</h2>
              <p className="text-xs text-slate-500">Operasi utama harian Dapur Siswa Jom Kenyang</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/pengambilan"
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <HeartHandshake className="h-4 w-4" />
                <span>Pengambilan Makanan</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <QrCode className="h-4 w-4 text-amber-400" />
                <span>Imbas QR Pelajar</span>
              </button>

              <Link
                href="/stock/in"
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <ArrowDownToLine className="h-4 w-4" />
                <span>Stock In</span>
              </Link>

              <Link
                href="/pelajar"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
              >
                <UserPlus className="h-4 w-4 text-blue-600" />
                <span>Daftar Pelajar</span>
              </Link>

              <Link
                href="/inventory"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
              >
                <PackagePlus className="h-4 w-4 text-emerald-600" />
                <span>Daftar Item</span>
              </Link>

              <Link
                href="/reports"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
              >
                <FileText className="h-4 w-4 text-teal-600" />
                <span>Laporan</span>
              </Link>
            </div>
          </div>

          {/* Date Filter */}
          <DateRangeFilter
            selectedPeriod={period}
            onPeriodChange={handlePeriodChange}
            customStart={customStart}
            customEnd={customEnd}
          />

          {/* 8 Core KPI Cards */}
          <DashboardCards 
            kpis={kpis} 
            periodLabel={
              period === 'today' ? 'Hari Ini' :
              period === 'week' ? 'Minggu Ini' :
              period === 'month' ? 'Bulan Ini' :
              period === 'semester' ? 'Semester Ini' :
              period === 'year' ? 'Tahun Ini' : 'Tarikh Khusus'
            } 
          />

          {/* Value Estimation Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-900 text-white p-4 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-300 font-medium">Anggaran Nilai Stok Dalam Stor</p>
                <h4 className="text-xl font-bold mt-1">
                  RM {(kpis.estimated_inventory_value || 0).toFixed(2)}
                </h4>
              </div>
              <div className="p-3 bg-emerald-800 rounded-xl text-emerald-300">
                <Coins className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-amber-900 text-white p-4 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-300 font-medium">Anggaran Nilai Makanan Diagihkan ({period})</p>
                <h4 className="text-xl font-bold mt-1">
                  RM {(kpis.estimated_distributed_value || 0).toFixed(2)}
                </h4>
              </div>
              <div className="p-3 bg-amber-800 rounded-xl text-amber-300">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Low Stock & Expiry Alert Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alert Panel */}
            <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">AMARAN STOK RENDAH</h3>
                    <p className="text-xs text-slate-500">Item makanan berada di bawah paras stok minimum</p>
                  </div>
                </div>
                <Link
                  href="/inventory?stock_filter=LOW"
                  className="text-xs text-amber-700 hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>Lihat Semua</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {restockList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Semua stok item makanan berada pada paras mencukupi.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {restockList.slice(0, 5).map((item: any) => (
                    <div key={item.food_item_id || Math.random()} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{item.food_name || 'Item'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({item.item_code || ''})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Semasa: <strong className="text-amber-600">{item.current_stock || 0}</strong> / Min: {item.minimum_stock || 0} {item.unit || 'Unit'} • Jangkaan Baki: {item.estimated_days_remaining || 0} hari
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={item.status || 'LOW'} size="sm" />
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Cadangan: +{item.recommended_purchase_quantity || 0} {item.unit || 'Unit'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expiry Monitoring Panel */}
            <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">PEMANTAUAN TARIKH LUPUT (FEFO)</h3>
                    <p className="text-xs text-slate-500">Item mendekati tarikh luput & perlu diagihkan segera</p>
                  </div>
                </div>
                <Link
                  href="/expiry"
                  className="text-xs text-rose-700 hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>Lihat Semua</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* Expiry summary badges */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-red-600"></span>
                    <span className="text-slate-700">Kritikal (Luput dalam ≤ 7 hari)</span>
                  </div>
                  <span className="font-bold text-red-600">Keutamaan Tinggi</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span className="text-slate-700">Amaran (Luput dalam ≤ 30 hari)</span>
                  </div>
                  <span className="font-bold text-amber-600">{kpis.expiring_soon_count || 0} Item</span>
                </div>
              </div>

              <div className="mt-3 text-right">
                <Link
                  href="/expiry"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors"
                >
                  <span>Buka Modul Pemantauan Tarikh Luput</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* 6 Recharts Charts Section */}
          <DashboardCharts
            dailyDist={data?.dailyDist || []}
            stockInOut={data?.stockInOut || []}
            byCategory={data?.byCategory || []}
            byProgramme={data?.byProgramme || []}
            topItems={data?.topItems || []}
            monthlyUsage={data?.monthlyUsage || []}
          />
        </main>
      </div>

      {/* QR Scanner Modal from quick actions */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setIsScannerOpen(false);
          router.push(`/pelajar?search=${encodeURIComponent(code)}`);
        }}
      />
    </div>
  );
}
