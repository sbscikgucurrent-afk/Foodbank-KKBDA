'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Utensils, 
  ShoppingBag, 
  Plus, 
  Minus, 
  RotateCcw, 
  ArrowRight, 
  ShieldAlert, 
  UserCheck, 
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { FoodItem, Student, DistributionTransaction } from '@/lib/types';
import StatusBadge from './StatusBadge';
import QRScannerModal from './QRScannerModal';

interface KioskViewProps {
  onExitKiosk?: () => void;
  operatorId?: number;
}

export default function KioskView({ onExitKiosk, operatorId = 3 }: KioskViewProps) {
  // Step: 1 = Scan, 2 = Verify, 3 = Select Food, 4 = Confirm, 5 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [studentInput, setStudentInput] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [lastCollectionTime, setLastCollectionTime] = useState<string | null>(null);
  const [overrideActive, setOverrideActive] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const [availableFood, setAvailableFood] = useState<FoodItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({}); // food_item_id -> qty
  const [maxItemLimit, setMaxItemLimit] = useState(3);

  const [completedTx, setCompletedTx] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(30);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load food inventory
  const fetchFood = () => {
    fetch('/api/inventory?status=ACTIVE')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          // Only show items with current stock > 0
          setAvailableFood(data.items.filter((i: FoodItem) => (i.current_stock || 0) > 0));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchFood();
  }, []);

  // 30-second Auto Reset timer
  const resetTimer = () => {
    setCountdown(30);
  };

  useEffect(() => {
    if (step === 1) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          resetKiosk();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  const resetKiosk = () => {
    setStep(1);
    setStudent(null);
    setStudentInput('');
    setDailyLimitReached(false);
    setLastCollectionTime(null);
    setOverrideActive(false);
    setOverrideReason('');
    setSelectedItems({});
    setCompletedTx(null);
    setErrorMsg(null);
    setCountdown(30);
    fetchFood();
  };

  // Step 1 -> 2: Verify Student
  const handleVerifyStudent = async (identifier: string) => {
    if (!identifier.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setIsScannerOpen(false);

    try {
      const res = await fetch(`/api/distribution/verify?identifier=${encodeURIComponent(identifier.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Pelajar tidak dijumpai.');
        setLoading(false);
        return;
      }

      setStudent(data.student);
      setDailyLimitReached(data.daily_limit_reached);
      setLastCollectionTime(data.last_collection_today?.time || null);
      setStep(2);
      resetTimer();
    } catch (err: any) {
      setErrorMsg('Ralat sambungan ke pelayan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Quantity helpers
  const totalSelectedCount = Object.values(selectedItems).reduce((sum, q) => sum + q, 0);

  const updateQuantity = (itemId: number, delta: number, maxStock: number) => {
    resetTimer();
    const current = selectedItems[itemId] || 0;
    const newQty = current + delta;

    if (newQty < 0) return;
    if (newQty > maxStock) return;

    if (delta > 0 && totalSelectedCount >= maxItemLimit && !overrideActive) {
      setErrorMsg(`Had maksimum ${maxItemLimit} item setiap lawatan telah dicapai.`);
      return;
    }

    setErrorMsg(null);
    if (newQty === 0) {
      const updated = { ...selectedItems };
      delete updated[itemId];
      setSelectedItems(updated);
    } else {
      setSelectedItems({ ...selectedItems, [itemId]: newQty });
    }
  };

  // Step 4 -> 5: Submit Distribution
  const handleConfirmDistribution = async () => {
    if (!student) return;
    setLoading(true);
    setErrorMsg(null);

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
          operator_id: operatorId,
          items: itemsPayload,
          override: overrideActive,
          override_reason: overrideReason
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Gagal memproses transaksi pengambilan.');
        setLoading(false);
        return;
      }

      setCompletedTx(data.transaction);
      setStep(5);
      resetTimer();
    } catch (e) {
      setErrorMsg('Ralat transaksi pangkalan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col select-none">
      {/* Kiosk Top Bar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Utensils className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">JOM KENYANG — DAPUR SISWA</h1>
            <p className="text-xs text-amber-400 font-medium">Stesen Agihan Makanan • Kolej Komuniti Bandar Darulaman</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {step > 1 && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 rounded-full text-xs font-mono text-amber-400 border border-slate-700">
              <Clock className="h-3.5 w-3.5" />
              <span>Reset automatik dalam {countdown}s</span>
            </div>
          )}
          <button
            onClick={resetKiosk}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            title="Reset Semula"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
          {onExitKiosk && (
            <button
              onClick={onExitKiosk}
              className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg border border-red-800/60 transition-colors"
              title="Keluar dari Kiosk Mode"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Kiosk Viewport */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
        {/* Error Alert */}
        {errorMsg && (
          <div className="w-full mb-6 p-4 bg-red-950/90 border border-red-500 rounded-2xl text-red-200 flex items-center space-x-3 shadow-xl animate-in fade-in">
            <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
            <div className="flex-1 text-xs md:text-sm font-semibold leading-relaxed">
              {errorMsg}
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 1: SCAN QR / ENTER ID */}
        {step === 1 && (
          <div className="w-full max-w-lg bg-slate-800/80 rounded-3xl p-8 border border-slate-700 shadow-2xl text-center space-y-6">
            <div className="space-y-2">
              <div className="inline-flex p-4 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <Camera className="h-10 w-10 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Sila Imbas QR Pelajar</h2>
              <p className="text-xs text-slate-400">
                Halakan Kod QR pada Kad Pelajar atau telefon pintar ke kamera pengimbas.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-base font-bold rounded-2xl shadow-xl shadow-emerald-950/50 flex items-center justify-center space-x-3 transition-all"
              >
                <Camera className="h-6 w-6" />
                <span>BUKA PENGIMBAS KAMERA QR</span>
              </button>

              <div className="flex items-center my-3">
                <div className="flex-1 h-px bg-slate-700"></div>
                <span className="px-3 text-[11px] font-semibold text-slate-500 uppercase">ATAU CARIAN ID</span>
                <div className="flex-1 h-px bg-slate-700"></div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyStudent(studentInput);
                }}
                className="flex items-center space-x-2"
              >
                <div className="relative flex-1">
                  <Search className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentInput}
                    onChange={(e) => setStudentInput(e.target.value)}
                    placeholder="Masukkan ID Pelajar (cth: KKBDA001)"
                    className="w-full pl-11 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono uppercase text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !studentInput.trim()}
                  className="px-5 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all"
                >
                  {loading ? 'Menyemak...' : 'Semak'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 2: STUDENT VERIFIED */}
        {step === 2 && student && (
          <div className="w-full max-w-xl bg-slate-800/90 rounded-3xl p-8 border border-slate-700 shadow-2xl space-y-6">
            <div className="flex items-center space-x-4 border-b border-slate-700 pb-5">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <UserCheck className="h-9 w-9" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Pelajar Disahkan ✓</span>
                  <StatusBadge status="ACTIVE" size="sm" />
                </div>
                <h2 className="text-xl font-bold text-white mt-0.5">{student.name}</h2>
                <p className="text-xs text-slate-400 font-mono">{student.student_id} • Semester {student.semester} ({student.class_group || 'A'})</p>
                <p className="text-xs text-emerald-300 font-medium">{student.programme_name}</p>
              </div>
            </div>

            {/* Daily Limit Warning if reached */}
            {dailyLimitReached && (
              <div className="p-4 bg-amber-950/80 border border-amber-600 rounded-2xl text-amber-200 space-y-3">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-300">HAD PENGAMBILAN HARIAN TELAH DICAPAI</h4>
                    <p className="text-xs mt-1 text-amber-200/90">
                      Pelajar ini telah membuat pengambilan makanan pada hari ini.
                      {lastCollectionTime && <span> (Masa: {lastCollectionTime.split(' ')[1]})</span>}
                    </p>
                  </div>
                </div>

                {!overrideActive ? (
                  <button
                    type="button"
                    onClick={() => setOverrideActive(true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow transition-all"
                  >
                    Buka Kelulusan Khas (Override Admin / Operator)
                  </button>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-amber-800">
                    <label className="block text-xs font-bold text-amber-300">
                      Sebab Kelulusan Khas (Wajib diisi):
                    </label>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Contoh: Kelulusan Khas UAPP untuk kelas amali petang"
                      className="w-full px-3 py-2 bg-slate-900 border border-amber-500 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={resetKiosk}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Batal / Pelajar Lain
              </button>

              <button
                type="button"
                disabled={dailyLimitReached && (!overrideActive || !overrideReason.trim())}
                onClick={() => {
                  setStep(3);
                  resetTimer();
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg flex items-center space-x-2 transition-all"
              >
                <span>PILIH MAKANAN</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FOOD SELECTION SCREEN */}
        {step === 3 && (
          <div className="w-full space-y-6">
            {/* Header & Cart Summary Bar */}
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Pilih Item Bantuan Makanan</h3>
                <p className="text-xs text-slate-400">
                  Pelajar: <strong className="text-emerald-400">{student?.name}</strong> ({student?.student_id})
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Item Dipilih:</p>
                  <p className="text-lg font-extrabold text-amber-400">
                    {totalSelectedCount} / {maxItemLimit} item
                  </p>
                </div>

                <button
                  type="button"
                  disabled={totalSelectedCount === 0}
                  onClick={() => {
                    setStep(4);
                    resetTimer();
                  }}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center space-x-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>SEMAK PILIHAN ({totalSelectedCount})</span>
                </button>
              </div>
            </div>

            {/* Food Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableFood.map((food) => {
                const selectedQty = selectedItems[food.id] || 0;
                const stock = food.current_stock || 0;

                return (
                  <div
                    key={food.id}
                    className={`bg-slate-800/90 rounded-2xl p-4 border transition-all ${
                      selectedQty > 0
                        ? 'border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                          {food.item_code}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">{food.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{food.category_name} • {food.unit}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          Baki: {stock}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Selector Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Kuantiti:</span>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(food.id, -1, stock)}
                          disabled={selectedQty === 0}
                          className="h-9 w-9 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white flex items-center justify-center font-bold transition-all"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-base font-extrabold text-white w-6 text-center">
                          {selectedQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(food.id, 1, stock)}
                          disabled={selectedQty >= stock || (totalSelectedCount >= maxItemLimit && !overrideActive)}
                          className="h-9 w-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white flex items-center justify-center font-bold transition-all shadow"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION MODAL / SCREEN */}
        {step === 4 && student && (
          <div className="w-full max-w-lg bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 animate-in fade-in">
            <div className="text-center space-y-1 border-b border-slate-700 pb-4">
              <h3 className="text-lg font-extrabold text-white">SAHKAN PENGAMBILAN MAKANAN</h3>
              <p className="text-xs text-slate-400">Sila semak maklumat sebelum menyimpan transaksi</p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl space-y-1 text-xs">
              <p className="text-slate-400">Nama Pelajar: <strong className="text-white">{student.name}</strong></p>
              <p className="text-slate-400">ID Pelajar: <strong className="text-emerald-400 font-mono">{student.student_id}</strong></p>
              <p className="text-slate-400">Program: <strong className="text-slate-300">{student.programme_name}</strong></p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Senarai Item Pilihan:</h4>
              <div className="bg-slate-900/80 rounded-xl divide-y divide-slate-800 p-2">
                {Object.entries(selectedItems).map(([id, qty]) => {
                  const item = availableFood.find(f => f.id === Number(id));
                  if (!item) return null;
                  return (
                    <div key={id} className="py-2 px-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{item.name}</span>
                        <span className="text-[10px] text-slate-400 block">{item.item_code} • {item.unit}</span>
                      </div>
                      <span className="font-extrabold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                        × {qty}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-800/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-300">Jumlah Keseluruhan:</span>
              <span className="text-base font-extrabold text-emerald-400">{totalSelectedCount} item</span>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                KEMBALI UBAH
              </button>
              <button
                type="button"
                onClick={handleConfirmDistribution}
                disabled={loading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>SAHKAN & SIMPAN</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS SCREEN */}
        {step === 5 && completedTx && (
          <div className="w-full max-w-lg bg-slate-800 rounded-3xl p-8 border-2 border-emerald-500 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
            <div className="inline-flex p-4 rounded-full bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="h-14 w-14" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">PENGAMBILAN BERJAYA ✓</h2>
              <p className="text-xs text-emerald-400 font-medium">Terima kasih. Bantuan makanan telah direkodkan ke dalam lejar.</p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-5 text-left text-xs space-y-2 border border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">No. Transaksi:</span>
                <span className="font-mono font-bold text-amber-400">{completedTx.transaction_code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nama Pelajar:</span>
                <span className="font-bold text-white">{completedTx.student_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ID Pelajar:</span>
                <span className="font-mono text-slate-300">{completedTx.student_code}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Jumlah Item:</span>
                <span className="font-bold text-emerald-400">{completedTx.total_items} item</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Tarikh & Masa:</span>
                <span>{completedTx.created_at}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={resetKiosk}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all"
            >
              SELESAI (DONE)
            </button>
          </div>
        )}
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
