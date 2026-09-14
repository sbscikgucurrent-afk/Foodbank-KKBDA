'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Scale, 
  ShieldCheck,
  Package
} from 'lucide-react';
import { FoodItem } from '@/lib/types';

export default function StockAdjustmentPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [mode, setMode] = useState<'count' | 'direct'>('count'); // count reconciliation or direct delta
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [directDelta, setDirectDelta] = useState<number>(-1);
  const [adjustmentType, setAdjustmentType] = useState<string>('Stock Count Discrepancy');
  const [reason, setReason] = useState<string>('');
  const [authorizedBy, setAuthorizedBy] = useState<string>('Puan Siti Rahmah (Admin UAPP)');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) setCurrentUser(d.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));

    loadFoodItems();
  }, [router]);

  const loadFoodItems = () => {
    fetch('/api/inventory?status=ACTIVE')
      .then(res => res.json())
      .then(d => {
        if (d.items && d.items.length > 0) {
          setFoodItems(d.items);
          if (selectedItemId === 0) {
            setSelectedItemId(d.items[0].id);
            setPhysicalCount(d.items[0].current_stock || 0);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const selectedItem = foodItems.find(i => i.id === selectedItemId);
  const systemStock = selectedItem?.current_stock || 0;
  const calculatedDifference = mode === 'count' ? physicalCount - systemStock : directDelta;

  const handleItemSelect = (id: number) => {
    setSelectedItemId(id);
    const itm = foodItems.find(i => i.id === id);
    if (itm) {
      setPhysicalCount(itm.current_stock || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedDifference === 0) {
      setErrorMsg('Tiada perbezaan kuantiti untuk dilaraskan.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Sebab pelarasan WAJIB diisi.');
      return;
    }

    if (!authorizedBy.trim()) {
      setErrorMsg('Nama pegawai yang meluluskan WAJIB diisi.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/stock/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_item_id: selectedItemId,
          adjustment_type: adjustmentType,
          quantity: calculatedDifference,
          reason,
          authorized_by: authorizedBy
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Gagal memproses pelarasan inventori.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`✓ Pelarasan stok berjaya direkodkan! No. Transaksi: ${data.transaction_code}`);
      setReason('');
      loadFoodItems();
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
          title="PELARASAN & REKONSILIASI STOK (STOCK ADJUSTMENT)" 
          subtitle="Modul Pengiraan Stok Fizikal, Pembetulan Ralat & Pelarasan Rasmi" 
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-5">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Borang Pelarasan / Kiraan Stok Fizikal</h3>
                  <p className="text-xs text-slate-500">Semua pelarasan akan direkodkan ke dalam Lejar Transaksi dan Log Audit</p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('count')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${mode === 'count' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Scale className="h-3.5 w-3.5" />
                  <span>Kiraan Fizikal Stor (Stock Count)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('direct')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${mode === 'direct' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Pelarasan Kuantiti Terus</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Food Item */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Item Makanan</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => handleItemSelect(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-purple-600"
                    required
                  >
                    {foodItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item_code} — {item.name} ({item.unit}) [Stok Sistem: {item.current_stock || 0}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Count Comparison */}
                {mode === 'count' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">Stok Dalam Sistem</span>
                      <span className="text-xl font-black text-slate-800">{systemStock} {selectedItem?.unit}</span>
                    </div>

                    <div>
                      <label className="text-[11px] text-purple-900 font-bold block mb-1">Kiraan Fizikal Sebenar</label>
                      <input
                        type="number"
                        min="0"
                        value={physicalCount}
                        onChange={(e) => setPhysicalCount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-purple-300 rounded-lg font-mono font-bold text-base focus:ring-1 focus:ring-purple-600 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">Perbezaan (Pelarasan)</span>
                      <span className={`text-xl font-black ${calculatedDifference < 0 ? 'text-red-600' : calculatedDifference > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                        {calculatedDifference > 0 ? `+${calculatedDifference}` : calculatedDifference} {selectedItem?.unit}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kuantiti Pelarasan (+/-)</label>
                      <input
                        type="number"
                        value={directDelta}
                        onChange={(e) => setDirectDelta(Number(e.target.value))}
                        placeholder="Contoh: -2 atau +5"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-sm focus:ring-1 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Baki Baru Selepas Pelarasan:</span>
                      <span className="text-base font-bold text-purple-900 block mt-2">
                        {Math.max(0, systemStock + directDelta)} {selectedItem?.unit}
                      </span>
                    </div>
                  </div>
                )}

                {/* Adjustment Type & Authorized By */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Pelarasan</label>
                    <select
                      value={adjustmentType}
                      onChange={(e) => setAdjustmentType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-purple-600"
                    >
                      <option value="Damaged">Damaged (Rosak / Kemek)</option>
                      <option value="Expired">Expired (Telah Luput)</option>
                      <option value="Lost">Lost (Hilang / Kekurangan Fizikal)</option>
                      <option value="Counting Error">Counting Error (Ralat Kiraan)</option>
                      <option value="Correction">Correction (Pembetulan)</option>
                      <option value="Stock Count Discrepancy">Stock Count Discrepancy (Perbezaan Kiraan Stor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pegawai Memberi Kelulusan (Authorized By)</label>
                    <input
                      type="text"
                      value={authorizedBy}
                      onChange={(e) => setAuthorizedBy(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-purple-600"
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sebab & Justifikasi Pelarasan *</label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Contoh: Pemeriksaan stok berkala mendapati bungkusan koyak / salah kiraan data terimaan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-purple-600"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || calculatedDifference === 0}
                    className="px-6 py-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
                  >
                    {submitting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <ShieldCheck className="h-4 w-4" />
                    <span>LULUSKAN & SIMPAN PELARASAN</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Guide */}
            <div className="bg-purple-950/20 p-5 rounded-2xl border border-purple-200 text-xs space-y-3">
              <h4 className="font-bold text-purple-900 flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-purple-700" />
                <span>Prinsip Integriti Inventori</span>
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Sistem JOM KENYANG mengekalkan <strong>Lejar Transaksi Kekal (Immutable)</strong>. Transaksi tidak dipadam secara senyap.
              </p>
              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                <p className="font-semibold text-slate-800">Formula Baki:</p>
                <code className="text-[11px] text-purple-800 block bg-slate-50 p-1.5 rounded">
                  Baki = Stock In - Stock Out + Pelarasan - Rosak
                </code>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
