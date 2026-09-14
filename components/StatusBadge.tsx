import React from 'react';

interface StatusBadgeProps {
  status: 'ACTIVE' | 'INACTIVE' | 'NORMAL' | 'LOW' | 'CRITICAL' | 'EXPIRED' | 'WARNING' | 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'DAMAGED' | 'DEPLETED' | string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, className = '', size = 'sm' }: StatusBadgeProps) {
  const norm = (status || '').toUpperCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-300';
  let label = status;

  switch (norm) {
    case 'ACTIVE':
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-600/10';
      label = 'AKTIF';
      break;
    case 'INACTIVE':
      bg = 'bg-slate-100 text-slate-600 border-slate-300';
      label = 'TIDAK AKTIF';
      break;
    case 'NORMAL':
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      label = 'NORMAL';
      break;
    case 'LOW':
    case 'LOW_STOCK':
      bg = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      label = 'STOK RENDAH';
      break;
    case 'CRITICAL':
    case 'CRITICAL_STOCK':
      bg = 'bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse';
      label = 'KRITIKAL';
      break;
    case 'WARNING':
    case 'EXPIRING_SOON':
      bg = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      label = 'HAMPIR LUPUT';
      break;
    case 'EXPIRED':
      bg = 'bg-red-50 text-red-700 border-red-300 font-bold';
      label = 'TELAH LUPUT';
      break;
    case 'STOCK_IN':
      bg = 'bg-blue-50 text-blue-700 border-blue-300 font-semibold';
      label = 'STOCK IN';
      break;
    case 'STOCK_OUT':
      bg = 'bg-orange-50 text-orange-700 border-orange-300 font-semibold';
      label = 'STOCK OUT';
      break;
    case 'ADJUSTMENT':
      bg = 'bg-purple-50 text-purple-700 border-purple-300 font-semibold';
      label = 'PELARASAN';
      break;
    case 'DAMAGED':
      bg = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
      label = 'ROSAK / KEMEK';
      break;
    case 'DEPLETED':
      bg = 'bg-slate-100 text-slate-500 border-slate-300';
      label = 'HABIS';
      break;
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${padding} ${bg} ${className}`}>
      {label}
    </span>
  );
}
