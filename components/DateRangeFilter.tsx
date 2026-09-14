'use client';

import React, { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';

interface DateRangeFilterProps {
  selectedPeriod: string;
  onPeriodChange: (period: string, customStart?: string, customEnd?: string) => void;
  customStart?: string;
  customEnd?: string;
}

export default function DateRangeFilter({
  selectedPeriod,
  onPeriodChange,
  customStart = '',
  customEnd = ''
}: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(selectedPeriod === 'custom');
  const [start, setStart] = useState(customStart);
  const [end, setEnd] = useState(customEnd);

  const periods = [
    { id: 'today', label: 'Hari Ini' },
    { id: 'week', label: 'Minggu Ini' },
    { id: 'month', label: 'Bulan Ini' },
    { id: 'semester', label: 'Semester Ini' },
    { id: 'year', label: 'Tahun Ini' },
    { id: 'custom', label: 'Pilihan Tarikh' }
  ];

  const handlePeriodSelect = (pId: string) => {
    if (pId === 'custom') {
      setShowCustom(true);
      if (start && end) {
        onPeriodChange('custom', start, end);
      }
    } else {
      setShowCustom(false);
      onPeriodChange(pId);
    }
  };

  const applyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (start && end) {
      onPeriodChange('custom', start, end);
    }
  };

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 w-full md:w-auto">
        <Filter className="h-4 w-4 text-emerald-700" />
        <span>Tempoh Paparan:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
        {periods.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePeriodSelect(p.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedPeriod === p.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <form onSubmit={applyCustom} className="flex items-center space-x-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="px-2 py-1 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            required
          />
          <span className="text-xs text-slate-400">hingga</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-2 py-1 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            required
          />
          <button
            type="submit"
            className="px-2.5 py-1 text-xs font-semibold bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors"
          >
            Guna
          </button>
        </form>
      )}
    </div>
  );
}
