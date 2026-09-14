import React from 'react';
import { 
  Users, 
  HeartHandshake, 
  Package, 
  Layers, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  AlertTriangle, 
  Clock,
  Coins
} from 'lucide-react';
import { DashboardKPIs } from '@/lib/types';

interface DashboardCardsProps {
  kpis?: DashboardKPIs;
  periodLabel?: string;
}

export default function DashboardCards({ kpis, periodLabel = 'Bulan Ini' }: DashboardCardsProps) {
  const safeKpis = {
    total_students: kpis?.total_students || 0,
    students_served: kpis?.students_served || 0,
    food_items_count: kpis?.food_items_count || 0,
    current_total_stock: kpis?.current_total_stock || 0,
    stock_in_period: kpis?.stock_in_period || 0,
    stock_out_period: kpis?.stock_out_period || 0,
    low_stock_count: kpis?.low_stock_count || 0,
    expiring_soon_count: kpis?.expiring_soon_count || 0,
    estimated_inventory_value: kpis?.estimated_inventory_value || 0,
    estimated_distributed_value: kpis?.estimated_distributed_value || 0
  };

  const cards = [
    {
      title: 'Jumlah Pelajar',
      subtitle: 'Pelajar Aktif Berdaftar',
      value: safeKpis.total_students.toLocaleString('ms-MY'),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      tag: 'KKBDA'
    },
    {
      title: 'Pelajar Dibantu',
      subtitle: `Pelajar unik (${periodLabel})`,
      value: safeKpis.students_served.toLocaleString('ms-MY'),
      icon: HeartHandshake,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      tag: 'Pengagihan'
    },
    {
      title: 'Item Makanan',
      subtitle: 'Kategori Aktif Dalam Inventori',
      value: safeKpis.food_items_count.toLocaleString('ms-MY'),
      icon: Package,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      tag: 'Katalog'
    },
    {
      title: 'Jumlah Stok Semasa',
      subtitle: 'Baki fizikal dalam stor',
      value: safeKpis.current_total_stock.toLocaleString('ms-MY'),
      icon: Layers,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      tag: 'Unit'
    },
    {
      title: 'Stock In',
      subtitle: `Diterima (${periodLabel})`,
      value: `+${safeKpis.stock_in_period.toLocaleString('ms-MY')}`,
      icon: ArrowDownToLine,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      tag: 'Terimaan'
    },
    {
      title: 'Stock Out',
      subtitle: `Diagihkan (${periodLabel})`,
      value: `-${safeKpis.stock_out_period.toLocaleString('ms-MY')}`,
      icon: ArrowUpFromLine,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      tag: 'Agihan'
    },
    {
      title: 'Stok Rendah',
      subtitle: 'Bawah Paras Minimum',
      value: safeKpis.low_stock_count.toLocaleString('ms-MY'),
      icon: AlertTriangle,
      color: safeKpis.low_stock_count > 0 ? 'text-amber-600' : 'text-slate-400',
      bg: safeKpis.low_stock_count > 0 ? 'bg-amber-50' : 'bg-slate-50',
      border: safeKpis.low_stock_count > 0 ? 'border-amber-200' : 'border-slate-200',
      tag: 'Pesanan Diperlukan'
    },
    {
      title: 'Hampir Luput',
      subtitle: 'Luput dalam 30 hari',
      value: safeKpis.expiring_soon_count.toLocaleString('ms-MY'),
      icon: Clock,
      color: safeKpis.expiring_soon_count > 0 ? 'text-rose-600' : 'text-slate-400',
      bg: safeKpis.expiring_soon_count > 0 ? 'bg-rose-50' : 'bg-slate-50',
      border: safeKpis.expiring_soon_count > 0 ? 'border-rose-200' : 'border-slate-200',
      tag: 'Keutamaan FEFO'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`bg-white rounded-xl p-4 border ${c.border} shadow-xs hover:shadow-md transition-shadow relative overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{c.title}</span>
              <div className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center ${c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">{c.value}</h3>
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                {c.tag}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400 truncate">{c.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
