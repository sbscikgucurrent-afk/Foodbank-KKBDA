'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { 
  ArrowDownToLine, 
  PackageCheck, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Calculator,
  Calendar,
  Layers
} from 'lucide-react';
import { FoodItem } from '@/lib/types';
import { format } from 'date-fns';

export default function StockInPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Mode: 'STOCK_IN' (Tambah Stok Masuk) vs 'EDIT_STOCK' (Edit & Tukar Baki Stok Terus)
  const [activeMode, setActiveMode] = useState<'STOCK_IN' | 'EDIT_STOCK'>('STOCK_IN');

  // Stock In Form State
  const [formData, setFormData] = useState({
    food_item_id: 0,
    batch_number: '',
    quantity: 50,
    expiry_date: '',
    received_date: format(new Date(), 'yyyy-MM-dd'),
    unit_cost: 0,
    source: 'Peruntukan KPT / Dapur Siswa',
    remarks: '',
  });

  // Edit Stock Balance State
  const [editStockData, setEditStockData] = useState({
    food_item_id: 0,
    new_stock: 0,
    reason: 'Pembetulan Kiraan Fizikal & Penyelarasan Stok',
    authorized_by: 'Puan Siti Rahmah (Admin UAPP)',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) {
          setCurrentUser(d.user);
          if (d.user.name) {
            setEditStockData(prev => ({ ...prev, authorized_by: d.user.name }));
          }
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));

    loadFoodAndTransactions();
  }, [router]);

  const loadFoodAndTransactions = () => {
    fetch('/api/inventory?status=ACTIVE')
      .then(res => res.json())
      .then(d => {
        if (d.items && d.items.length > 0) {
          setFoodItems(d.items);
          if (formData.food_item_id === 0) {
            const first = d.items[0];
            setFormData(prev => ({
              ...prev,
              food_item_id: first.id,
              unit_cost: first.estimated_unit_cost || 0,
              batch_number: `B-${first.item_code}-${format(new Date(), 'yyMMdd')}`
            }));
            setEditStockData(prev => ({
              ...prev,
              food_item_id: first.id,
              new_stock: first.current_stock || 0
            }));
          } else {
            const currentSelected = d.items.find((i: any) => i.id === formData.food_item_id);
            if (currentSelected) {
              setEditStockData(prev => ({
                ...prev,
                new_stock: currentSelected.current_stock || 0
              }));
            }
          }
        }
      })
      .catch(() => {});

    fetch('/api/stock/out?type=STOCK_IN')
      .then(res => res.json())
      .then(d => {
        setRecentTransactions(d.transactions?.slice(0, 10) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleItemChange = (itemId: number) => {
    const selected = foodItems.find(i => i.id === itemId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        food_item_id: itemId,
        unit_cost: selected.estimated_unit_cost || 0,
        batch_number: `B-${selected.item_code}-${format(new Date(), 'yyMMdd')}`
      }));
      setEditStockData(prev => ({
        ...prev,
        food_item_id: itemId,
        new_stock: selected.current_stock || 0
      }));
    }
  };

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (formData.quantity <= 0) {
      setErrorMsg('Kuantiti mestilah sekurang-kurangnya 1.');
      setSubmitting(false);
      return;
    }

    if (!formData.expiry_date) {
      setErrorMsg('Tarikh luput WAJIB diisi.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/stock/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Gagal merekodkan Stock In.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`✓ Stock In berjaya direkodkan! No. Transaksi: ${data.transaction_code}`);
      loadFoodAndTransactions();
      
      const selected = foodItems.find(i => i.id === formData.food_item_id);
      setFormData(prev => ({
        ...prev,
        quantity: 50,
        expiry_date: '',
        remarks: '',
        batch_number: `B-${selected?.item_code || 'ITEM'}-${format(new Date(), 'yyMMdd')}-${Math.floor(Math.random()*90+10)}`
      }));
    } catch (err) {
      setErrorMsg('Ralat pelayan semasa menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const selected = foodItems.find(i => i.id === editStockData.food_item_id);
    const currentStock = selected?.current_stock || 0;
    const diff = editStockData.new_stock - currentStock;

    if (diff === 0) {
      setErrorMsg('Baki stok yang dimasukkan sama dengan baki sedia ada. Sila ubah nilai jika ingin kemaskini.');
      setSubmitting(false);
      return;
    }

    if (!editStockData.reason.trim()) {
      setErrorMsg('Sebab / Catatan kemaskini stok WAJIB diisi.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/stock/in', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editStockData)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Gagal mengemaskini baki stok.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(`✓ Baki stok ${selected?.name} berjaya dikemaskini daripada ${currentStock} kepada ${editStockData.new_stock} ${selected?.unit}! (${data.transaction_code || 'Tersimpan'})`);
      loadFoodAndTransactions();
    } catch (err) {
      setErrorMsg('Ralat pelayan semasa mengemaskini baki stok.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedItem = foodItems.find(i => i.id === (activeMode === 'STOCK_IN' ? formData.food_item_id : editStockData.food_item_id));
  const currentStock = selectedItem?.current_stock || 0;
  const stockDifference = editStockData.new_stock - currentStock;
  const totalCost = formData.quantity * (formData.unit_cost || 0);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="PENGURUSAN & KEMASKINI STOK (JOM KENYANG)" 
          subtitle="Modul Penerimaan Bekalan Baharu & Kemaskini / Edit Baki Stok Makanan" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {/* Status Notifications */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">×</button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-2xl text-red-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-950 font-bold">×</button>
            </div>
          )}

          {/* Form & Ledger Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Stock Operations Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-5">
              
              {/* Mode Switcher Tabs */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('STOCK_IN');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      activeMode === 'STOCK_IN'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    <span>1. Tambah Stok (Stock In)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('EDIT_STOCK');
                      setErrorMsg(null);
                      if (selectedItem) {
                        setEditStockData(prev => ({
                          ...prev,
                          food_item_id: selectedItem.id,
                          new_stock: selectedItem.current_stock || 0
                        }));
                      }
                    }}
                    className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      activeMode === 'EDIT_STOCK'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <PackageCheck className="h-4 w-4" />
                    <span>2. Edit & Ubah Baki Stok</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: STOCK IN FORM */}
              {activeMode === 'STOCK_IN' && (
                <form onSubmit={handleStockInSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pilih Item Makanan</label>
                    <select
                      value={formData.food_item_id}
                      onChange={(e) => handleItemChange(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600"
                      required
                    >
                      {foodItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.item_code} — {item.name} [Baki Semasa: {item.current_stock || 0} {item.unit}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch & Quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">No. Batch / Kod Kelompok</label>
                      <input
                        type="text"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                        placeholder="cth: B-MILO-26C"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-bold focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Kuantiti Diterima ({selectedItem?.unit || 'Unit'})
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Expiry Date & Received Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tarikh Luput (Expiry Date) *</label>
                      <input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tarikh Diterima</label>
                      <input
                        type="date"
                        value={formData.received_date}
                        onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Source & Unit Cost */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Punca Bekalan / Pembekal / Penderma</label>
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-600"
                      >
                        <option value="Peruntukan KPT / Dapur Siswa">Peruntukan KPT / Dapur Siswa</option>
                        <option value="Sumbangan Alumni KKBDA">Sumbangan Alumni KKBDA</option>
                        <option value="Sumbangan Staf KKBDA">Sumbangan Staf KKBDA</option>
                        <option value="Penderma Korporat / NGO">Penderma Korporat / NGO</option>
                        <option value="Pembekal Tempatan">Pembekal Tempatan</option>
                        <option value="Lain-lain Punca">Lain-lain Punca</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Anggaran Kos Seunit (RM)</label>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={formData.unit_cost}
                        onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan / No. Pesanan / Resit (Pilihan)</label>
                    <input
                      type="text"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Contoh: Pesanan PO-2026-088 dihantar oleh Syarikat Pembekal"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-emerald-800 font-semibold">Formula Kemaskini Inventori:</p>
                      <p className="text-xs text-slate-700 mt-0.5">
                        Baki Semasa ({selectedItem?.current_stock || 0}) + Terimaan ({formData.quantity}) = <strong className="text-emerald-900">{(selectedItem?.current_stock || 0) + formData.quantity} {selectedItem?.unit}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500">Jumlah Nilai Terimaan:</p>
                      <p className="text-sm font-extrabold text-emerald-900">RM {totalCost.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
                    >
                      {submitting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      <PackageCheck className="h-4 w-4" />
                      <span>SIMPAN REKOD STOCK IN</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: DIRECT EDIT / SET NEW STOCK BALANCE FORM */}
              {activeMode === 'EDIT_STOCK' && (
                <form onSubmit={handleEditStockSubmit} className="space-y-4 text-xs">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center space-x-2">
                    <PackageCheck className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>
                      Mod ini membolehkan anda <strong>mengubah terus baki stok semasa</strong> kepada jumlah fizikal sebenar. Sistem akan mengira perbezaan dan melaraskan lejar inventori secara automatik.
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pilih Item Makanan Untuk Diedit</label>
                    <select
                      value={editStockData.food_item_id}
                      onChange={(e) => handleItemChange(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-600"
                      required
                    >
                      {foodItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.item_code} — {item.name} [Baki Semasa: {item.current_stock || 0} {item.unit}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 block">Baki Stok Semasa (Dalam Sistem):</span>
                      <span className="text-xl font-black text-slate-900 mt-1 block">
                        {currentStock} {selectedItem?.unit || 'Unit'}
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-amber-950 mb-1 text-xs">
                        Baki Stok Baru Yang Sebenar ({selectedItem?.unit || 'Unit'}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editStockData.new_stock}
                        onChange={(e) => setEditStockData({ ...editStockData, new_stock: Number(e.target.value) })}
                        placeholder="Masukkan baki stok baru"
                        className="w-full px-3 py-2.5 border-2 border-amber-400 bg-amber-50/40 rounded-xl font-mono text-base font-extrabold text-amber-950 focus:ring-2 focus:ring-amber-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Stock difference indicator */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    stockDifference > 0 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : stockDifference < 0 
                        ? 'bg-rose-50 border-rose-200 text-rose-900' 
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider">Kesan Pelarasan Baki:</p>
                      <p className="text-sm font-black mt-0.5">
                        {stockDifference > 0 && `+${stockDifference} ${selectedItem?.unit} (Penambahan Stok)`}
                        {stockDifference < 0 && `${stockDifference} ${selectedItem?.unit} (Pengurangan Stok)`}
                        {stockDifference === 0 && `Tiada perubahan kuantiti stok`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Baki Akhir:</span>
                      <span className="text-base font-black">
                        {editStockData.new_stock} {selectedItem?.unit}
                      </span>
                    </div>
                  </div>

                  {/* Reason for Stock Edit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Sebab Kemaskini / Justifikasi</label>
                      <select
                        value={editStockData.reason}
                        onChange={(e) => setEditStockData({ ...editStockData, reason: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-600"
                      >
                        <option value="Pembetulan Kiraan Fizikal & Penyelarasan Stok">Pembetulan Kiraan Fizikal & Penyelarasan Stok</option>
                        <option value="Kiraan Stok Berkala (Stock Take Discrepancy)">Kiraan Stok Berkala (Stock Take Discrepancy)</option>
                        <option value="Penerimaan Terus Tanpa Invois / Sumbangan">Penerimaan Terus Tanpa Invois / Sumbangan</option>
                        <option value="Barang Rosak / Pecah / Luput Dikeluarkan">Barang Rosak / Pecah / Luput Dikeluarkan</option>
                        <option value="Koreksi Ralat Input Operator">Koreksi Ralat Input Operator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Pegawai Pengesah</label>
                      <input
                        type="text"
                        value={editStockData.authorized_by}
                        onChange={(e) => setEditStockData({ ...editStockData, authorized_by: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
                    >
                      {submitting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      <PackageCheck className="h-4 w-4" />
                      <span>SIMPAN & KEMASKINI BAKI STOK</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right: Item Overview & Current Stock Card */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Maklumat Item Dipilih
                </h4>
                {selectedItem ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border">
                        {selectedItem.item_code}
                      </span>
                      <h3 className="font-bold text-slate-900 pt-1 text-sm">{selectedItem.name}</h3>
                      <p className="text-slate-500">{selectedItem.category_name} • Unit: {selectedItem.unit}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-emerald-700 font-semibold block">Baki Stok Semasa</span>
                        <span className="text-lg font-extrabold text-emerald-900">{selectedItem.current_stock || 0}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-semibold block">Paras Minimum</span>
                        <span className="text-lg font-bold text-slate-800">{selectedItem.minimum_stock}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMode('EDIT_STOCK');
                          setEditStockData(prev => ({
                            ...prev,
                            food_item_id: selectedItem.id,
                            new_stock: selectedItem.current_stock || 0
                          }));
                        }}
                        className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-200 text-xs transition-colors flex items-center justify-center space-x-1"
                      >
                        <PackageCheck className="h-3.5 w-3.5 text-amber-700" />
                        <span>Edit Baki Stok Item Ini</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMode('STOCK_IN');
                          setFormData(prev => ({
                            ...prev,
                            food_item_id: selectedItem.id
                          }));
                        }}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-lg border border-emerald-200 text-xs transition-colors flex items-center justify-center space-x-1"
                      >
                        <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Tambah Stok Masuk (Stock In)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Sila pilih item makanan.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Stock In Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  10 Transaksi Terimaan Terkini (Stock In)
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                    <th className="p-3.5">No. Transaksi</th>
                    <th className="p-3.5">Item Makanan</th>
                    <th className="p-3.5">No. Batch</th>
                    <th className="p-3.5">Kuantiti</th>
                    <th className="p-3.5">Tarikh Luput</th>
                    <th className="p-3.5">Diterima Oleh</th>
                    <th className="p-3.5">Masa Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-700">
                        {tx.transaction_code}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900">{tx.food_item_name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{tx.item_code}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {tx.batch_number || '-'}
                      </td>
                      <td className="p-3.5 font-extrabold text-blue-700">
                        +{tx.quantity} {tx.unit}
                      </td>
                      <td className="p-3.5 font-mono text-slate-800">
                        {tx.expiry_date || '-'}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {tx.operator_name || 'Admin'}
                      </td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {tx.created_at}
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
