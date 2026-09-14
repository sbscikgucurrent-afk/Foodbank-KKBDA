'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StudentQRCard from '@/components/StudentQRCard';
import QRScannerModal from '@/components/QRScannerModal';
import { 
  UtensilsCrossed, 
  QrCode, 
  History, 
  LogOut, 
  User, 
  Sparkles, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  HeartHandshake,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Search,
  PackageCheck,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  Camera,
  X
} from 'lucide-react';

export default function StudentPortalDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'collect' | 'history' | 'qrcard'>('collect');
  const [student, setStudent] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart State: { [food_item_id]: quantity }
  const [cart, setCart] = useState<Record<number, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Confirmation
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isStationScannerOpen, setIsStationScannerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const reloadHistory = (studentId?: number) => {
    const id = studentId || student?.id;
    if (id) {
      fetch(`/api/students/${id}`)
        .then(r => r.json())
        .then(hData => {
          if (hData.success && Array.isArray(hData.history)) {
            setHistory(hData.history);
          }
        })
        .catch(console.error);
    }
  };

  const loadData = () => {
    setLoading(true);
    fetch('/api/distribution/self-service')
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          router.push('/login');
          return;
        }
        setStudent(data.student);
        setVerification(data.verification);
        setFoodItems(data.items || []);
        setCategories(data.categories || []);

        // Load student history
        if (data.student?.id) {
          fetch(`/api/students/${data.student.id}`)
            .then(r => r.json())
            .then(hData => {
              setHistory(hData.history || []);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        router.push('/login');
      });
  };

  useEffect(() => {
    loadData();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'history' && student?.id) {
      reloadHistory(student.id);
    }
  }, [activeTab, student?.id]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Cart Helpers
  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const handleAddToCart = (itemId: number, maxStock: number) => {
    const current = cart[itemId] || 0;
    if (current >= maxStock) return;
    setCart({ ...cart, [itemId]: current + 1 });
  };

  const handleRemoveFromCart = (itemId: number) => {
    const current = cart[itemId] || 0;
    if (current <= 1) {
      const next = { ...cart };
      delete next[itemId];
      setCart(next);
    } else {
      setCart({ ...cart, [itemId]: current - 1 });
    }
  };

  const handleClearCart = () => {
    setCart({});
  };

  const getFoodImage = (item: any) => {
    if (item?.image_url && item.image_url.trim() !== '') return item.image_url;
    const name = (item?.name || '').toLowerCase();
    const cat = (item?.category_name || '').toLowerCase();
    if (name.includes('milo') || name.includes('coklat') || name.includes('koko')) {
      return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80';
    }
    if (name.includes('biskut') || name.includes('oreo') || name.includes('julie') || cat.includes('biscuit')) {
      return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80';
    }
    if (name.includes('susu') || cat.includes('beverage') || name.includes('soya') || name.includes('kopi')) {
      return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80';
    }
    if (name.includes('maggi') || name.includes('mi ') || name.includes('mee') || cat.includes('ready')) {
      return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80';
    }
    if (name.includes('roti') || name.includes('bun') || cat.includes('bread')) {
      return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80';
    }
    if (name.includes('nestum') || name.includes('cereal') || cat.includes('breakfast') || cat.includes('cereal')) {
      return 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=400&q=80';
    }
    if (name.includes('sardin') || name.includes('tin') || cat.includes('tin')) {
      return 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80';
  };

  // Submit Self-Checkout Food Collection
  const executeCheckout = async (stationVerified: boolean = false) => {
    setSubmitting(true);
    setCheckoutError(null);

    const itemsPayload = Object.entries(cart).map(([itemId, qty]) => ({
      food_item_id: Number(itemId),
      quantity: qty
    }));

    try {
      const res = await fetch('/api/distribution/self-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload, station_verified: stationVerified })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        setCheckoutError(result.error || 'Gagal merekodkan pengambilan makanan.');
        setSubmitting(false);
        return;
      }

      setCheckoutSuccess(result.transaction);
      setIsConfirmModalOpen(false);
      setCart({});
      loadData();
    } catch (err: any) {
      setCheckoutError('Ralat sambungan ke pelayan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Food Items
  const filteredItems = foodItems.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || item.category_id === Number(selectedCategory);
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.item_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-300">Memuatkan Portal Siswa Madani...</p>
        </div>
      </div>
    );
  }

  const isEligibleToday = verification?.allowed ?? true;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white pb-24">
      {/* Student Portal Top Header */}
      <header className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-white tracking-wide">JOM KENYANG</h1>
              <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
                KKBDA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Unit Ambilan & Pembangunan Pelajar</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-white">{student.name}</span>
            <span className="text-[10px] font-mono text-amber-400">{student.student_id}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-semibold rounded-lg border border-red-800/60 transition-colors"
            title="Log Keluar"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-5">
        {/* Student Profile & Eligibility Status Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 p-5 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Siswa Berdaftar KKBDA</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">{student.name}</h2>
              <p className="text-xs text-slate-400">
                ID Pelajar: <strong className="font-mono text-amber-400">{student.student_id}</strong> • {student.programme_code} ({student.programme_name}) • Sem {student.semester}
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="px-3 py-1.5 bg-emerald-950/80 rounded-xl text-emerald-300 border border-emerald-800/80 font-bold">
                ✨ Bantuan Makanan Siswa: Terbuka & Tiada Had
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('collect')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'collect'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Pilih & Ambil Makanan</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Sejarah Pengambilan</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcard')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'qrcard'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Kad QR Digital</span>
          </button>
        </div>

        {/* TAB 1: PILIH & AMBIL MAKANAN (DIRECT SELF-SERVICE HUB) */}
        {activeTab === 'collect' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari makanan (cth: Milo, Biskut, Roti, Maggi)..."
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-full">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === 'ALL'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Semua
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(String(c.id))}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === String(c.id)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredItems.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                  Tiada item makanan aktif dijumpai mengikut carian.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const currentQty = cart[item.id] || 0;
                  const stock = item.current_stock || 0;
                  const isLow = stock <= (item.minimum_stock || 20);
                  const imageUrl = getFoodImage(item);

                  return (
                    <div
                      key={item.id}
                      className={`group rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                        currentQty > 0
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-500/40'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                      }`}
                    >
                      {/* Top Image Container */}
                      <div className="relative w-full h-36 sm:h-40 bg-slate-950 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const parent = (e.target as HTMLElement).parentElement;
                            const fallback = parent?.querySelector('.image-fallback');
                            if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                          }}
                        />
                        {/* Fallback Icon if Image Fails */}
                        <div className="image-fallback hidden absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-500">
                          <UtensilsCrossed className="h-8 w-8 text-slate-600 mb-1" />
                          <span className="text-[10px] text-slate-400 font-medium">{item.category_name}</span>
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-black/40 pointer-events-none" />

                        {/* Top Badges: Item Code & Category */}
                        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 z-10">
                          <span className="text-[10px] font-mono font-bold bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md text-emerald-400 border border-slate-700/60 shadow-xs">
                            {item.item_code}
                          </span>
                        </div>

                        <div className="absolute top-2.5 right-2.5 z-10">
                          <span className="text-[10px] font-semibold text-slate-200 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-700/60 shadow-xs">
                            {item.category_name}
                          </span>
                        </div>

                        {/* Selected Indicator Pill */}
                        {currentQty > 0 && (
                          <div className="absolute bottom-2 left-2.5 z-10">
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-md">
                              <Check className="h-3 w-3" />
                              <span>{currentQty} Dipilih</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 flex flex-col justify-between flex-1 space-y-3">
                        <div>
                          <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                            {item.description || item.unit}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Baki Stor:</span>
                            <span className={`text-xs font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {stock} {item.unit}
                            </span>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.id)}
                              disabled={currentQty === 0}
                              className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white flex items-center justify-center transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <span className="w-6 text-center font-mono font-bold text-xs text-white">
                              {currentQty}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleAddToCart(item.id, stock)}
                              disabled={currentQty >= stock}
                              className="h-7 w-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SEJARAH PENGAMBILAN */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <History className="h-4 w-4 text-emerald-400" />
                  <span>Rekod Sejarah Pengambilan Makanan</span>
                </h3>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Jumlah: {history.length} Sesi
                </span>
              </div>

              <div className="divide-y divide-slate-800 text-xs">
                {history.length === 0 ? (
                  <p className="py-8 text-center text-slate-500">Tiada rekod pengambilan makanan terdahulu.</p>
                ) : (
                  history.map((h: any, idx: number) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">
                            {h.food_item_name || 'Item Makanan'}
                          </span>
                          {h.item_code && (
                            <span className="text-[10px] font-mono text-slate-400">
                              ({h.item_code})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {h.created_at} • Batch: <span className="font-mono text-slate-300">{h.batch_number || 'Umum'}</span>
                          {h.transaction_code && (
                            <span className="ml-2 font-mono text-[10px] text-amber-400/90 font-semibold">
                              [{h.transaction_code}]
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/80">
                        {h.quantity || 1} {h.unit || 'Pek'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KAD QR DIGITAL */}
        {activeTab === 'qrcard' && (
          <div className="flex flex-col items-center justify-center p-4">
            <StudentQRCard student={student} />
          </div>
        )}
      </main>

      {/* STICKY BOTTOM CART BAR (ACTIVE WHEN ITEMS SELECTED IN COLLECT TAB) */}
      {activeTab === 'collect' && totalCartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 border-t border-slate-800 backdrop-blur-xl z-40 animate-in slide-in-from-bottom">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {totalCartCount}
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {totalCartCount} Item Makanan Dipilih
                </p>
                <p className="text-[10px] text-emerald-400">
                  Sedia untuk disahkan & ditebus di rak Foodbank
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClearCart}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Kosongkan
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2 transition-all"
              >
                <span>SAHKAN PENGAMBILAN</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM FOOD CHECKOUT */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <PackageCheck className="h-5 w-5 text-emerald-400" />
                <span>Sahkan Pengambilan Makanan</span>
              </h3>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <p className="font-bold text-slate-300">Ringkasan Item Makanan:</p>
                <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
                  {Object.entries(cart).map(([itemId, qty]) => {
                    const item = foodItems.find(i => i.id === Number(itemId));
                    const img = getFoodImage(item);
                    return (
                      <div key={itemId} className="py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <img
                            src={img}
                            alt={item?.name || ''}
                            className="w-8 h-8 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700/60"
                          />
                          <div className="truncate">
                            <span className="text-slate-200 font-medium block truncate">{item?.name || 'Item'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item?.item_code}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 shrink-0">{qty} {item?.unit}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-white">
                  <span>Jumlah Item:</span>
                  <span className="text-emerald-400">{totalCartCount} Unit</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-1">
                <p className="text-[11px] text-emerald-300 font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Pengesahan Pelajar: {student.name} ({student.student_id})</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Baki stok akan ditolak secara automatik mengikut prinsip FEFO.
                </p>
              </div>

              {/* 2 Checkout Confirmation Options */}
              <div className="space-y-2 pt-2">
                {/* Option 1: Direct 1-Click Confirmation */}
                <button
                  type="button"
                  onClick={() => executeCheckout(false)}
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all"
                >
                  {submitting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Sahkan & Ambil Sekarang (1-Klik)</span>
                  <Check className="h-4 w-4" />
                </button>

                {/* Option 2: Scan Foodbank Station QR (Optional) */}
                <button
                  type="button"
                  onClick={() => setIsStationScannerOpen(true)}
                  disabled={submitting}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
                >
                  <Camera className="h-4 w-4 text-amber-400" />
                  <span>Imbas Kod QR Stesen / Rak Makanan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUCCESSFUL CHECKOUT DIGITAL RECEIPT */}
      {checkoutSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-700/80 text-white space-y-4 text-center">
            <div className="h-16 w-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-950 animate-bounce">
              <Check className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">PENGAMBILAN BERJAYA!</h3>
              <p className="text-xs text-emerald-300">
                Resit transaksi digital telah direkodkan dalam sistem Foodbank.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>No. Rujukan:</span>
                <span className="text-amber-400 font-bold">{checkoutSuccess.transaction_code}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pelajar:</span>
                <span className="text-white">{student.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ID Siswa:</span>
                <span className="text-white">{student.student_id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tarikh & Masa:</span>
                <span className="text-slate-300">{new Date().toLocaleString('ms-MY')}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                <span>Jumlah Item:</span>
                <span className="text-emerald-400">{checkoutSuccess.total_items} Unit</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCheckoutSuccess(null);
                setActiveTab('history');
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Lihat Rekod Sejarah Pengambilan
            </button>
          </div>
        </div>
      )}

      {/* QR SCANNER MODAL FOR FOODBANK STATION QR */}
      <QRScannerModal
        isOpen={isStationScannerOpen}
        onClose={() => setIsStationScannerOpen(false)}
        onScanSuccess={(code) => {
          setIsStationScannerOpen(false);
          executeCheckout(true);
        }}
      />
    </div>
  );
}
