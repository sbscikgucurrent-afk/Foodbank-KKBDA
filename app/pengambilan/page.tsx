'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import KioskView from '@/components/KioskView';
import QRScannerModal from '@/components/QRScannerModal';
import StatusBadge from '@/components/StatusBadge';
import { 
  HeartHandshake, 
  Camera, 
  Search, 
  Monitor, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  UserCheck, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles,
  UtensilsCrossed
} from 'lucide-react';
import { FoodItem, Student } from '@/lib/types';

export default function PengambilanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Standard Station Mode State
  const [studentInput, setStudentInput] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [lastCollectionTime, setLastCollectionTime] = useState<string | null>(null);
  const [overrideActive, setOverrideActive] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const [availableFood, setAvailableFood] = useState<FoodItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [maxLimit, setMaxLimit] = useState(3);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [recentDistributions, setRecentDistributions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) setCurrentUser(d.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));

    loadInventory();
    loadRecentDistributions();
  }, [router]);

  const loadInventory = () => {
    fetch('/api/inventory?status=ACTIVE')
      .then(res => res.json())
      .then(d => {
        setAvailableFood((d.items || []).filter((i: FoodItem) => (i.current_stock || 0) > 0));
      })
      .catch(() => {});
  };

  const loadRecentDistributions = () => {
    fetch('/api/distribution?limit=15')
      .then(res => res.json())
      .then(d => {
        setRecentDistributions(d.distributions || []);
      })
      .catch(() => {});
  };

  const handleVerifyStudent = async (identifier: string) => {
    if (!identifier.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsScannerOpen(false);

    try {
      const res = await fetch(`/api/distribution/verify?identifier=${encodeURIComponent(identifier.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Pelajar tidak dijumpai.');
        setStudent(null);
        setLoading(false);
        return;
      }

      setStudent(data.student);
      setDailyLimitReached(data.daily_limit_reached);
      setLastCollectionTime(data.last_collection_today?.time || null);
      setOverrideActive(false);
      setOverrideReason('');
      setSelectedItems({});
    } catch (e) {
      setErrorMsg('Ralat sambungan.');
    } finally {
      setLoading(false);
    }
  };

  const totalSelectedCount = Object.values(selectedItems).reduce((sum, q) => sum + q, 0);

  const updateQuantity = (itemId: number, delta: number, stock: number) => {
    const current = selectedItems[itemId] || 0;
    const newQty = current + delta;
    if (newQty < 0) return;
    if (newQty > stock) return;

    setErrorMsg(null);
    if (newQty === 0) {
      const updated = { ...selectedItems };
      delete updated[itemId];
      setSelectedItems(updated);
    } else {
      setSelectedItems({ ...selectedItems, [itemId]: newQty });
    }
  };

  const handleProcessDistribution = async () => {
    if (!student) return;
    if (totalSelectedCount === 0) {
      setErrorMsg('Sila pilih sekurang-kurangnya 1 item makanan.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const itemsPayload = Object.entries(selectedItems).map(([id, qty]) => ({
      food_item_id: Number(id),
      quantity: qty
    }));

    try {
      const res = await fetch('/api/distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          operator_id: currentUser?.id || 3,
          items: itemsPayload,
          override: overrideActive,
          override_reason: overrideReason
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Gagal memproses transaksi agihan.');
        setLoading(false);
        return;
      }

      setSuccessMsg(`✓ Agihan Makanan Berjaya! No. Transaksi: ${data.transaction?.transaction_code} (${data.transaction?.total_items} item diserahkan kepada ${student.name})`);
      setStudent(null);
      setSelectedItems({});
      setStudentInput('');
      setOverrideActive(false);
      setOverrideReason('');
      loadInventory();
      loadRecentDistributions();
    } catch (err) {
      setErrorMsg('Ralat pangkalan data.');
    } finally {
      setLoading(false);
    }
  };

  // Full Screen Kiosk Mode Toggle
  if (isKioskMode) {
    return (
      <KioskView
        onExitKiosk={() => setIsKioskMode(false)}
        operatorId={currentUser?.id || 3}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="STESEN PENGAMBILAN MAKANAN (FOOD DISTRIBUTION)" 
          subtitle="Modul Agihan Makanan Pelajar • Imbasan QR & Verifikasi Lejar" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {/* Top Bar with Kiosk Mode Launch Button */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Mod Operasi Agihan</h3>
              <p className="text-xs text-slate-500">Pilih antara paparan stesen pentadbir atau Mod Kiosk Skrin Sentuh (Tablet / Touchscreen)</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsKioskMode(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 border border-slate-700"
              >
                <Monitor className="h-4 w-4 text-amber-400" />
                <span>LANCARKAN MOD KIOSK (TOUCHSCREEN)</span>
              </button>
            </div>
          </div>

          {/* Status Feedback Messages */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-2xl text-red-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Distribution Workflow */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Student Scan & Verification */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
                  <UserCheck className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Langkah 1: Imbas / Semak Pelajar</h3>
              </div>

              {/* Scan / Manual input */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>BUKA PENGIMBAS QR KAMERA</span>
                </button>

                <div className="relative">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyStudent(studentInput);
                    }}
                    className="flex items-center space-x-1.5"
                  >
                    <input
                      type="text"
                      value={studentInput}
                      onChange={(e) => setStudentInput(e.target.value)}
                      placeholder="Masukkan ID Pelajar (cth: KKBDA001)"
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase focus:ring-1 focus:ring-emerald-600 font-bold"
                    />
                    <button
                      type="submit"
                      disabled={loading || !studentInput.trim()}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Semak
                    </button>
                  </form>
                </div>
              </div>

              {/* Verified Student Details */}
              {student ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold bg-white text-emerald-900 px-2 py-0.5 rounded border border-emerald-200">
                      {student.student_id}
                    </span>
                    <StatusBadge status={student.status} size="sm" />
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{student.name}</h4>
                    <p className="text-emerald-800 font-medium text-[11px] mt-0.5">{student.programme_name}</p>
                    <p className="text-slate-500 text-[10px]">Semester {student.semester} ({student.class_group || 'A'})</p>
                  </div>

                  {/* Daily Limit Warning & Override */}
                  {dailyLimitReached && (
                    <div className="mt-2 p-3 bg-amber-100/80 border border-amber-300 rounded-lg text-amber-900 space-y-2">
                      <div className="flex items-start space-x-1.5">
                        <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-[11px]">Had Harian Telah Dicapai</p>
                          <p className="text-[10px] text-amber-800">
                            Pelajar telah mengambil makanan hari ini {lastCollectionTime ? `(${lastCollectionTime.split(' ')[1]})` : ''}.
                          </p>
                        </div>
                      </div>

                      {!overrideActive ? (
                        <button
                          type="button"
                          onClick={() => setOverrideActive(true)}
                          className="w-full py-1 bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold rounded"
                        >
                          Aktifkan Override Kebenaran Khas
                        </button>
                      ) : (
                        <div className="space-y-1 pt-1 border-t border-amber-300">
                          <label className="text-[10px] font-bold text-amber-900 block">Sebab Kelulusan Khas *</label>
                          <input
                            type="text"
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Sebab kebenaran..."
                            className="w-full px-2 py-1 bg-white border border-amber-400 rounded text-[11px] focus:outline-none"
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Sila imbas atau cari rekod pelajar untuk memulakan pemilihan makanan.
                </div>
              )}
            </div>

            {/* Right Column: Food Catalog & Quantity Selector */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Langkah 2: Pilih Item Makanan</h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">Dipilih: </span>
                  <span className="text-sm font-extrabold text-amber-600">{totalSelectedCount} / {maxLimit} item</span>
                </div>
              </div>

              {/* Food Items Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {availableFood.map((food) => {
                  const selectedQty = selectedItems[food.id] || 0;
                  const stock = food.current_stock || 0;

                  return (
                    <div
                      key={food.id}
                      className={`p-3 rounded-xl border transition-all ${
                        selectedQty > 0
                          ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        {food.image_url ? (
                          <img
                            src={food.image_url}
                            alt={food.name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                            <UtensilsCrossed className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {food.item_code}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              Stok: {stock}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug truncate">{food.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{food.category_name} • {food.unit}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">Kuantiti:</span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(food.id, -1, stock)}
                            disabled={selectedQty === 0}
                            className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center font-bold text-xs"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-bold text-xs w-4 text-center text-slate-900">
                            {selectedQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(food.id, 1, stock)}
                            disabled={selectedQty >= stock || (totalSelectedCount >= maxLimit && !overrideActive)}
                            className="h-7 w-7 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-30 text-white flex items-center justify-center font-bold text-xs shadow-xs"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Submit Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {student ? (
                    <span>Penerima: <strong className="text-slate-800">{student.name}</strong></span>
                  ) : (
                    <span>Sila sahkan pelajar terlebih dahulu.</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!student || totalSelectedCount === 0 || loading || (dailyLimitReached && (!overrideActive || !overrideReason.trim()))}
                  onClick={handleProcessDistribution}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                >
                  {loading && <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <CheckCircle2 className="h-4 w-4" />
                  <span>SAHKAN & SELESAIKAN AGIHAN</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Distributions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Log Transaksi Agihan Terkini
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                    <th className="p-3.5">No. Transaksi</th>
                    <th className="p-3.5">Nama Pelajar</th>
                    <th className="p-3.5">Program</th>
                    <th className="p-3.5">Jumlah Item</th>
                    <th className="p-3.5">Status Override</th>
                    <th className="p-3.5">Petugas</th>
                    <th className="p-3.5">Tarikh & Masa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentDistributions.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-amber-700">
                        {d.transaction_code}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900">{d.student_name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{d.student_code}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {d.programme_code}
                      </td>
                      <td className="p-3.5 font-extrabold text-emerald-800">
                        {d.total_items} item
                      </td>
                      <td className="p-3.5">
                        {d.override_used ? (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                            Override: {d.override_reason || 'Khas'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Normal</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {d.operator_name}
                      </td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {d.created_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Embedded Camera Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleVerifyStudent}
      />
    </div>
  );
}
