'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const COLORS = ['#065f46', '#d97706', '#2563eb', '#7c3aed', '#db2777', '#0891b2', '#ea580c', '#4b5563'];

interface DashboardChartsProps {
  dailyDist: any[];
  stockInOut: any[];
  byCategory: any[];
  byProgramme: any[];
  topItems: any[];
  monthlyUsage: any[];
}

export default function DashboardCharts({
  dailyDist = [],
  stockInOut = [],
  byCategory = [],
  byProgramme = [],
  topItems = [],
  monthlyUsage = []
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-64 bg-white rounded-xl border border-slate-200 p-6"></div>
        <div className="h-64 bg-white rounded-xl border border-slate-200 p-6"></div>
      </div>
    );
  }

  const safeDailyDist = Array.isArray(dailyDist) && dailyDist.length > 0 ? dailyDist : [{ date_label: 'Tiada', total_visits: 0, total_items: 0 }];
  const safeStockInOut = Array.isArray(stockInOut) && stockInOut.length > 0 ? stockInOut : [{ date_label: 'Tiada', stock_in: 0, stock_out: 0 }];
  const safeByCategory = Array.isArray(byCategory) && byCategory.length > 0 ? byCategory : [{ category: 'Tiada', total_quantity: 1 }];
  const safeByProgramme = Array.isArray(byProgramme) ? byProgramme : [];
  const safeTopItems = Array.isArray(topItems) ? topItems : [];
  const safeMonthlyUsage = Array.isArray(monthlyUsage) ? monthlyUsage : [];

  return (
    <div className="space-y-6">
      {/* Row 1: Daily Distribution & Stock In vs Out */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Agihan Makanan Mengikut Hari */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Trend Agihan Makanan Harian</h3>
              <p className="text-xs text-slate-500">Jumlah sesi agihan dan bilangan item diterima pelajar</p>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              Chart 1
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeDailyDist}>
                <defs>
                  <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#065f46" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#065f46" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date_label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="total_items" name="Jumlah Item Diagih" stroke="#065f46" fillOpacity={1} fill="url(#colorItems)" />
                <Area type="monotone" dataKey="total_visits" name="Bil. Sesi Pelajar" stroke="#d97706" fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Stock In vs Stock Out */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Perbandingan Stock In vs Stock Out</h3>
              <p className="text-xs text-slate-500">Kuantiti masuk (pembekal/sumbangan) lawan keluar (pelajar)</p>
            </div>
            <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              Chart 2
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeStockInOut}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date_label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="stock_in" name="Stock In (+)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stock_out" name="Stock Out (-)" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Category Distribution & Programme Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 3: Distribution by Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Agihan Mengikut Kategori</h3>
              <p className="text-xs text-slate-500">Pecahan item diagihkan mengikut jenis</p>
            </div>
            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
              Chart 3
            </span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeByCategory}
                  dataKey="total_quantity"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {safeByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Students Served by Programme */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Pelajar Dibantu Mengikut Program</h3>
              <p className="text-xs text-slate-500">Jumlah pelajar dan kekerapan lawatan mengikut jurusan pengajian</p>
            </div>
            <span className="text-[10px] font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded border border-violet-200">
              Chart 4
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeByProgramme} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis dataKey="programme_code" type="category" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any, name: string) => [value, name === 'students_count' ? 'Pelajar Unik' : 'Jumlah Lawatan']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="students_count" name="Pelajar Unik" fill="#065f46" radius={[0, 4, 4, 0]} />
                <Bar dataKey="visits_count" name="Jumlah Lawatan" fill="#86efac" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Top 10 Items & Monthly Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 5: Top 10 Distributed Items */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Top 10 Item Paling Kerap Diagihkan</h3>
              <p className="text-xs text-slate-500">Item makanan paling tinggi permintaan dalam kalangan pelajar</p>
            </div>
            <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
              Chart 5
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeTopItems} margin={{ bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="item_name" 
                  angle={-25} 
                  textAnchor="end" 
                  interval={0} 
                  height={50}
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total_distributed" name="Kuantiti Diagih" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Monthly Usage Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Penggunaan Bulanan Foodbank (12 Bulan)</h3>
              <p className="text-xs text-slate-500">Pertumbuhan jumlah agihan dan penerima manfaat sepanjang tahun</p>
            </div>
            <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
              Chart 6
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeMonthlyUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month_year" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="total_items" name="Jumlah Item" fill="#065f46" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unique_students" name="Pelajar Unik" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
