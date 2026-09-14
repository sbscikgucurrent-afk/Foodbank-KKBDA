'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { 
  TrendingUp, 
  Sparkles, 
  ShoppingCart, 
  Users, 
  HeartHandshake, 
  Package, 
  Award,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) setCurrentUser(d.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));

    fetch('/api/analytics?period=month')
      .then(res => res.json())
      .then(d => {
        setAnalyticsData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const scorecard = analyticsData?.scorecard || {
    total_students_registered: 0,
    total_unique_students_helped: 0,
    student_coverage_percentage: 0,
    total_items_distributed: 0,
    average_items_per_student: 0,
    estimated_total_benefit_value_rm: 0,
    top_demanded_category: 'Tiada'
  };

  const restock = analyticsData?.restock || [];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="SCORECARD EKSEKUTIF & RAMALAN INVENTORI (ANALYTICS & FORECAST)" 
          subtitle="Metrik Penembusan Manfaat Pelajar & Enjin Cadangan Pembelian Pintar" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {/* Top Scorecard Metrics Highlight */}
          <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2">
                <Award className="h-6 w-6 text-amber-400" />
                <h3 className="text-base font-extrabold tracking-wide uppercase">Scorecard Impak Bantuan Siswa Madani</h3>
              </div>
              <span className="text-xs bg-emerald-800 text-emerald-300 px-3 py-1 rounded-full font-mono">
                KK Bandar Darulaman
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10 pt-2">
              <div className="bg-emerald-800/60 p-4 rounded-xl border border-emerald-700/60">
                <span className="text-[11px] text-emerald-300 uppercase font-semibold">Kadar Penembusan Siswa</span>
                <p className="text-2xl font-black text-amber-400 mt-1">{scorecard.student_coverage_percentage}%</p>
                <span className="text-[10px] text-emerald-200">
                  {scorecard.total_unique_students_helped} / {scorecard.total_students_registered} Pelajar Didaftarkan
                </span>
              </div>

              <div className="bg-emerald-800/60 p-4 rounded-xl border border-emerald-700/60">
                <span className="text-[11px] text-emerald-300 uppercase font-semibold">Jumlah Item Diagihkan</span>
                <p className="text-2xl font-black text-white mt-1">{scorecard.total_items_distributed} Item</p>
                <span className="text-[10px] text-emerald-200">Purata {scorecard.average_items_per_student} item / pelajar</span>
              </div>

              <div className="bg-emerald-800/60 p-4 rounded-xl border border-emerald-700/60">
                <span className="text-[11px] text-emerald-300 uppercase font-semibold">Anggaran Nilai Manfaat</span>
                <p className="text-2xl font-black text-emerald-300 mt-1">RM {scorecard.estimated_total_benefit_value_rm.toFixed(2)}</p>
                <span className="text-[10px] text-emerald-200">Nilai barangan diberikan</span>
              </div>

              <div className="bg-emerald-800/60 p-4 rounded-xl border border-emerald-700/60">
                <span className="text-[11px] text-emerald-300 uppercase font-semibold">Kategori Utama</span>
                <p className="text-xl font-bold text-white mt-1 truncate">{scorecard.top_demanded_category}</p>
                <span className="text-[10px] text-emerald-200">Kategori paling tinggi permintaan</span>
              </div>
            </div>
          </div>

          {/* Restock Forecast Engine */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Enjin Ramalan Restock & Cadangan Pembelian Pintar</h3>
                  <p className="text-xs text-slate-500">Dikira berasaskan kadar penggunaan harian (daily velocity) dan tempoh baki stok</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                    <th className="p-3.5">Kod & Nama Makanan</th>
                    <th className="p-3.5">Stok Semasa</th>
                    <th className="p-3.5">Min Stok</th>
                    <th className="p-3.5">Kadar Penggunaan Harian</th>
                    <th className="p-3.5">Baki Hari Berkelakuan</th>
                    <th className="p-3.5">Status Bekalan</th>
                    <th className="p-3.5">Cadangan Pembelian (+Unit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {restock.map((r: any) => (
                    <tr key={r.food_item_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900">{r.food_name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{r.item_code}</span>
                      </td>
                      <td className="p-3.5 font-extrabold text-slate-800">
                        {r.current_stock} {r.unit}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {r.minimum_stock} {r.unit}
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {r.daily_velocity} {r.unit}/hari
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {r.estimated_days_remaining} Hari
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="p-3.5">
                        {r.recommended_purchase_quantity > 0 ? (
                          <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            +{r.recommended_purchase_quantity} {r.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400">Stok Mencukupi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
