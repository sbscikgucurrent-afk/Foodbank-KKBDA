'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Settings, Save, CheckCircle2, AlertCircle, Building, ShieldCheck, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) setCurrentUser(d.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));

    loadSettings();
  }, [router]);

  const loadSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(d => {
        setSettings(d.settings || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Gagal menyelenggara tetapan.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg('✓ Tetapan sistem berjaya dikemaskini!');
      loadSettings();
    } catch (e) {
      setErrorMsg('Ralat pangkalan data.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="TETAPAN SISTEM (SYSTEM SETTINGS)" 
          subtitle="Konfigurasi Parameter Operasi, Had Agihan & Identiti Institusi" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-2xl text-red-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {/* Section 1: Institutional Identity */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Building className="h-5 w-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-800">Identiti Institusi & Tajuk Laporan</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Kolej / Institusi</label>
                  <input
                    type="text"
                    value={settings.institution_name || ''}
                    onChange={(e) => handleChange('institution_name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Modul Foodbank</label>
                  <input
                    type="text"
                    value={settings.foodbank_name || ''}
                    onChange={(e) => handleChange('foodbank_name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-900 focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Pengurus</label>
                  <input
                    type="text"
                    value={settings.unit_name || ''}
                    onChange={(e) => handleChange('unit_name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Distribution Policy Parameters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Sliders className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800">Had Agihan & Dasar Pengambilan Siswa</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Had Pengambilan Harian / Pelajar</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.max_items_per_day || '1'}
                    onChange={(e) => handleChange('max_items_per_day', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maksimum Item Setiap Lawatan</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.max_items_per_visit || '3'}
                    onChange={(e) => handleChange('max_items_per_visit', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amaran Tarikh Luput (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.expiry_warning_days || '30'}
                    onChange={(e) => handleChange('expiry_warning_days', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
              >
                {submitting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <Save className="h-4 w-4" />
                <span>SIMPAN TETAPAN SISTEM</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
