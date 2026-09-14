'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { 
  Package,
  PackagePlus, 
  ArrowDownToLine, 
  AlertTriangle, 
  Layers, 
  Edit3, 
  X, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Search,
  Clock,
  PlusCircle,
  PackageCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { FoodItem, FoodCategory, InventoryBatch } from '@/lib/types';
import * as XLSX from 'xlsx';

function InventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStockFilter = searchParams.get('stock_filter') || 'ALL';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [stockFilter, setStockFilter] = useState<string>(initialStockFilter);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedItemBatches, setSelectedItemBatches] = useState<{ item: FoodItem; batches: InventoryBatch[] } | null>(null);
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Edit Batch Form State
  const [batchFormData, setBatchFormData] = useState({
    id: 0,
    batch_number: '',
    quantity_remaining: 0,
    quantity_received: 0,
    expiry_date: '',
    received_date: '',
    source: 'Peruntukan KPT',
    unit_cost: 0,
    status: 'ACTIVE'
  });

  // Add Item Form State
  const [formData, setFormData] = useState({
    item_code: '',
    name: '',
    category_id: 1,
    description: '',
    unit: 'Pek',
    image_url: '',
    minimum_stock: 20,
    maximum_stock: 200,
    estimated_unit_cost: 2.00,
  });

  // Edit Item Form State
  const [editFormData, setEditFormData] = useState({
    id: 0,
    item_code: '',
    name: '',
    category_id: 1,
    description: '',
    unit: 'Pek',
    image_url: '',
    minimum_stock: 20,
    maximum_stock: 200,
    estimated_unit_cost: 2.00,
  });

  // Quick Restock Form State
  const [restockFormData, setRestockFormData] = useState({
    food_item_id: 0,
    food_item_name: '',
    item_code: '',
    unit: 'Pek',
    quantity: 50,
    batch_number: '',
    expiry_date: '',
    received_date: new Date().toISOString().split('T')[0],
    source: 'Peruntukan KPT',
    unit_cost: 0,
    remarks: 'Tambah stok cepat dari inventori'
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) setCurrentUser(d.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadData = () => {
    setLoading(true);
    let url = `/api/inventory?status=ACTIVE`;
    if (selectedCategory) url += `&category_id=${selectedCategory}`;
    if (stockFilter && stockFilter !== 'ALL') url += `&stock_filter=${stockFilter}`;

    fetch(url)
      .then(res => res.json())
      .then(d => {
        setItems(d.items || []);
        setCategories(d.categories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, stockFilter]);

  const PRESET_IMAGES = [
    { name: 'Milo / Coklat', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80' },
    { name: 'Biskut Keju', url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80' },
    { name: 'Biskut Coklat', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },
    { name: 'Susu Kotak', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
    { name: 'Mi Maggi', url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80' },
    { name: 'Roti / Bun', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
    { name: 'Bijirin / Nestum', url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=400&q=80' },
    { name: 'Tin Sardin', url: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=400&q=80' },
    { name: 'Kopi O', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Saiz fail imej melebihi had 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (isEdit) {
        setEditFormData(prev => ({ ...prev, image_url: base64 }));
      } else {
        setFormData(prev => ({ ...prev, image_url: base64 }));
      }
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleOpenAdd = () => {
    setFormData({
      item_code: `FB${String(items.length + 1).padStart(3, '0')}`,
      name: '',
      category_id: categories[0]?.id || 1,
      description: '',
      unit: 'Pek',
      image_url: '',
      minimum_stock: 20,
      maximum_stock: 200,
      estimated_unit_cost: 2.00,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setFormError(null);

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Gagal mendaftar item makanan.');
        setModalLoading(false);
        return;
      }
      setIsAddModalOpen(false);
      showSuccess(`Item makanan "${formData.name}" berjaya didaftarkan!`);
      loadData();
    } catch (err) {
      setFormError('Ralat sambungan.');
    } finally {
      setModalLoading(false);
    }
  };

  // EDIT ITEM HANDLERS
  const handleOpenEdit = (item: FoodItem) => {
    setEditFormData({
      id: item.id,
      item_code: item.item_code,
      name: item.name,
      category_id: item.category_id,
      description: item.description || '',
      unit: item.unit || 'Pek',
      image_url: item.image_url || '',
      minimum_stock: item.minimum_stock || 20,
      maximum_stock: item.maximum_stock || 200,
      estimated_unit_cost: item.estimated_unit_cost || 0.0,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/inventory/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Gagal mengemaskini item makanan.');
        setModalLoading(false);
        return;
      }
      setIsEditModalOpen(false);
      showSuccess(`Maklumat item "${editFormData.name}" berjaya dikemaskini!`);
      loadData();
    } catch (err) {
      setFormError('Ralat sambungan.');
    } finally {
      setModalLoading(false);
    }
  };

  // QUICK RESTOCK HANDLERS
  const handleOpenRestock = (item: FoodItem) => {
    const today = new Date();
    const future = new Date(today);
    future.setMonth(future.getMonth() + 6);
    const expStr = future.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const randomBatchSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedBatch = `B-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${randomBatchSuffix}`;

    setRestockFormData({
      food_item_id: item.id,
      food_item_name: item.name,
      item_code: item.item_code,
      unit: item.unit,
      quantity: 50,
      batch_number: generatedBatch,
      expiry_date: expStr,
      received_date: todayStr,
      source: 'Peruntukan KPT',
      unit_cost: item.estimated_unit_cost || 0,
      remarks: `Restock pantas untuk ${item.name}`
    });
    setFormError(null);
    setIsRestockModalOpen(true);
  };

  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setFormError(null);

    try {
      const res = await fetch('/api/stock/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restockFormData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Gagal menambah stok makanan.');
        setModalLoading(false);
        return;
      }
      setIsRestockModalOpen(false);
      showSuccess(`Stok berjaya ditambah: +${restockFormData.quantity} ${restockFormData.unit} untuk ${restockFormData.food_item_name}!`);
      loadData();
    } catch (err) {
      setFormError('Ralat sambungan.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewBatches = async (item: FoodItem) => {
    try {
      const res = await fetch(`/api/inventory/${item.id}`);
      const data = await res.json();
      if (data.item) {
        setSelectedItemBatches({ item: data.item, batches: data.batches || [] });
      }
    } catch (e) {}
  };

  const handleOpenEditBatch = (b: InventoryBatch) => {
    setBatchFormData({
      id: b.id,
      batch_number: b.batch_number,
      quantity_remaining: b.quantity_remaining,
      quantity_received: b.quantity_received,
      expiry_date: b.expiry_date,
      received_date: b.received_date,
      source: b.source || 'Peruntukan KPT',
      unit_cost: b.unit_cost || 0,
      status: b.status || 'ACTIVE'
    });
    setFormError(null);
    setIsEditBatchModalOpen(true);
  };

  const handleSaveEditBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/inventory/batches/${batchFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchFormData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Gagal mengemaskini maklumat batch.');
        setModalLoading(false);
        return;
      }
      setIsEditBatchModalOpen(false);
      showSuccess(`Batch "${batchFormData.batch_number}" berjaya dikemaskini!`);
      if (selectedItemBatches) {
        handleViewBatches(selectedItemBatches.item);
      }
      loadData();
    } catch (err) {
      setFormError('Ralat sambungan.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteBatch = async (b: InventoryBatch) => {
    if (!confirm(`Adakah anda pasti untuk menyahaktifkan batch "${b.batch_number}"?`)) return;
    try {
      const res = await fetch(`/api/inventory/batches/${b.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Batch "${b.batch_number}" telah dinyahaktifkan.`);
        if (selectedItemBatches) {
          handleViewBatches(selectedItemBatches.item);
        }
        loadData();
      }
    } catch (e) {}
  };

  const handleDeleteFoodItem = async (item: FoodItem) => {
    if (!confirm(`Adakah anda pasti ingin memadamkan item makanan "${item.name}" (${item.item_code}) serta semua rekod baki stoknya?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Gagal memadam item makanan.');
        return;
      }
      showSuccess(`Item makanan "${item.name}" dan baki stoknya telah berjaya dipadamkan.`);
      loadData();
    } catch (e) {
      alert('Ralat sambungan.');
    }
  };

  const exportToExcel = () => {
    const exportRows = items.map(i => ({
      'Kod Item': i.item_code,
      'Nama Makanan': i.name,
      'Kategori': i.category_name,
      'Unit': i.unit,
      'Stok Semasa': i.current_stock || 0,
      'Stok Minimum': i.minimum_stock,
      'Anggaran Kos/Unit (RM)': (i.estimated_unit_cost || 0).toFixed(2),
      'Nilai Stok (RM)': ((i.current_stock || 0) * (i.estimated_unit_cost || 0)).toFixed(2),
      'Tarikh Luput Terawal': i.earliest_expiry || '-',
      'Status Stok': i.stock_status,
      'Status Luput': i.expiry_status
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventori Makanan');
    XLSX.writeFile(wb, `Inventori_Foodbank_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns: Column<FoodItem>[] = [
    {
      key: 'item_code',
      header: 'Kod Item',
      render: (i) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {i.item_code}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Nama Makanan',
      render: (i) => (
        <div className="flex items-center space-x-3">
          {i.image_url ? (
            <img
              src={i.image_url}
              alt={i.name}
              className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <Package className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="font-bold text-slate-900 leading-tight">{i.name}</p>
            <span className="text-[11px] text-slate-500">{i.description || i.category_name}</span>
          </div>
        </div>
      )
    },
    {
      key: 'category_name',
      header: 'Kategori',
      render: (i) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
          {i.category_name}
        </span>
      )
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (i) => <span className="text-xs text-slate-600">{i.unit}</span>
    },
    {
      key: 'current_stock',
      header: 'Stok Semasa / Min',
      render: (i) => {
        const stock = i.current_stock || 0;
        const isLow = stock <= i.minimum_stock;
        return (
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-base font-extrabold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                {stock}
              </span>
              <span className="text-[11px] text-slate-400">/ Min {i.minimum_stock}</span>
            </div>
            <StatusBadge status={i.stock_status || 'NORMAL'} size="sm" />
          </div>
        );
      }
    },
    {
      key: 'earliest_expiry',
      header: 'Tarikh Luput Terawal',
      render: (i) => {
        if (!i.earliest_expiry) return <span className="text-slate-400 text-xs">Tiada Stok</span>;
        return (
          <div>
            <span className="font-mono text-xs font-semibold text-slate-800">{i.earliest_expiry}</span>
            <div className="mt-0.5">
              <StatusBadge status={i.expiry_status || 'NORMAL'} size="sm" />
            </div>
          </div>
        );
      }
    },
    {
      key: 'estimated_unit_cost',
      header: 'Anggaran Nilai',
      render: (i) => (
        <div>
          <span className="font-medium text-slate-800 text-xs">
            RM {((i.current_stock || 0) * (i.estimated_unit_cost || 0)).toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block">@ RM {i.estimated_unit_cost.toFixed(2)} / {i.unit}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Tindakan',
      sortable: false,
      className: 'text-right',
      render: (i) => (
        <div className="flex items-center justify-end space-x-1.5">
          {/* Quick Restock button */}
          <button
            onClick={() => handleOpenRestock(i)}
            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold text-xs flex items-center space-x-1 transition-colors shadow-2xs"
            title="Tambah Stok (Restock Cepat)"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tambah Stok</span>
          </button>

          {/* Edit Food Item button */}
          <button
            onClick={() => handleOpenEdit(i)}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors shadow-2xs"
            title="Edit Maklumat Item Makanan"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          {/* View FEFO Batches */}
          <button
            onClick={() => handleViewBatches(i)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors shadow-2xs"
            title="Lihat Perincian Batch & Tarikh Luput"
          >
            <Layers className="h-4 w-4" />
          </button>

          {/* Delete Food Item & Stock button */}
          <button
            onClick={() => handleDeleteFoodItem(i)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-300 transition-colors shadow-2xs"
            title="Padam Item Makanan & Baki Stok"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="INVENTORI MAKANAN (JOM KENYANG)" 
          subtitle="Katalog Makanan, Penjejakan Baki, Kemaskini Stok & Pengurusan Batch FEFO" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {/* Success Toast */}
          {successToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center justify-between shadow-sm animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{successToast}</span>
              </div>
              <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Top Filter & Actions Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.item_count || 0})</option>
                ))}
              </select>

              {/* Stock Condition Filter Tabs */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStockFilter('ALL')}
                  className={`px-3 py-1 rounded-md transition-all ${stockFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Semua Item ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('LOW')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center space-x-1 ${stockFilter === 'LOW' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Stok Rendah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('EXPIRING')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center space-x-1 ${stockFilter === 'EXPIRING' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Clock className="h-3 w-3" />
                  <span>Hampir Luput</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href="/stock/in"
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
              >
                <ArrowDownToLine className="h-4 w-4" />
                <span>Stock In Terperinci</span>
              </Link>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
              >
                <PackagePlus className="h-4 w-4 text-emerald-400" />
                <span>Daftar Item Baru</span>
              </button>
            </div>
          </div>

          {/* Food Items DataTable */}
          <DataTable
            data={items}
            columns={columns}
            keyField="id"
            searchPlaceholder="Cari mengikut Kod FB, Nama Makanan, Kategori..."
            onExportExcel={exportToExcel}
          />
        </main>
      </div>

      {/* MODAL 1: ADD FOOD ITEM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <PackagePlus className="h-5 w-5 text-emerald-700" />
                <span>Pendaftaran Item Makanan Baru</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kod Item (cth: FB016)</label>
                  <input
                    type="text"
                    value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono font-bold focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Makanan</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Milo 3-in-1 (Sachet)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Penerangan Ringkas</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan bungkusan / rasa / saiz"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                    <span>Gambar Makanan (Visual Item)</span>
                  </label>
                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="text-[11px] text-red-600 hover:text-red-700 flex items-center space-x-1 font-semibold"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Padam Gambar</span>
                    </button>
                  )}
                </div>

                {/* Upload or URL Row */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <label className="cursor-pointer flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors shrink-0">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Muat Naik Fail</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, false)}
                    />
                  </label>

                  <div className="flex-1 relative flex items-center">
                    <LinkIcon className="h-3.5 w-3.5 absolute left-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Atau tampal pautan URL gambar (https://...)"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Preset Chips */}
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block mb-1">Pilih Contoh Pantas (Preset):</span>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_IMAGES.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: p.url })}
                        className="text-[10px] font-medium px-2 py-0.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 rounded-md transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview Box */}
                {formData.image_url && (
                  <div className="pt-2 border-t border-slate-200 flex items-center space-x-3">
                    <img
                      src={formData.image_url}
                      alt="Pratonton"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-300 bg-white shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0.5';
                      }}
                    />
                    <div className="text-[11px] text-slate-600">
                      <p className="font-bold text-slate-800">Pratonton Imej Berjaya!</p>
                      <p className="text-[10px] text-slate-500">Imej ini akan dipaparkan pada kad pilihan makanan pelajar.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Bungkusan</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Pek / Sachet / Tin"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paras Minimum</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Anggaran Kos (RM)</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={formData.estimated_unit_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_unit_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 shadow flex items-center space-x-1"
                >
                  {modalLoading && <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Daftar Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT FOOD ITEM */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-amber-600" />
                <span>Kemaskini Maklumat Item Makanan</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kod Item</label>
                  <input
                    type="text"
                    value={editFormData.item_code}
                    onChange={(e) => setEditFormData({ ...editFormData, item_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono font-bold focus:ring-1 focus:ring-amber-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editFormData.category_id}
                    onChange={(e) => setEditFormData({ ...editFormData, category_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Makanan</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Penerangan Ringkas</label>
                <input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Keterangan bungkusan / rasa / saiz"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <ImageIcon className="h-4 w-4 text-amber-600" />
                    <span>Gambar Makanan (Visual Item)</span>
                  </label>
                  {editFormData.image_url && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, image_url: '' })}
                      className="text-[11px] text-red-600 hover:text-red-700 flex items-center space-x-1 font-semibold"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Padam Gambar</span>
                    </button>
                  )}
                </div>

                {/* Upload or URL Row */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <label className="cursor-pointer flex items-center justify-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors shrink-0">
                    <Upload className="h-3.5 w-3.5 text-amber-700" />
                    <span>Muat Naik Fail</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, true)}
                    />
                  </label>

                  <div className="flex-1 relative flex items-center">
                    <LinkIcon className="h-3.5 w-3.5 absolute left-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={editFormData.image_url}
                      onChange={(e) => setEditFormData({ ...editFormData, image_url: e.target.value })}
                      placeholder="Atau tampal pautan URL gambar (https://...)"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-600 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Preset Chips */}
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block mb-1">Pilih Contoh Pantas (Preset):</span>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_IMAGES.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, image_url: p.url })}
                        className="text-[10px] font-medium px-2 py-0.5 bg-white hover:bg-amber-50 hover:text-amber-800 text-slate-600 border border-slate-200 rounded-md transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview Box */}
                {editFormData.image_url && (
                  <div className="pt-2 border-t border-slate-200 flex items-center space-x-3">
                    <img
                      src={editFormData.image_url}
                      alt="Pratonton"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-300 bg-white shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0.5';
                      }}
                    />
                    <div className="text-[11px] text-slate-600">
                      <p className="font-bold text-slate-800">Pratonton Imej Berjaya!</p>
                      <p className="text-[10px] text-slate-500">Imej ini akan dipaparkan pada kad pilihan makanan pelajar.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Bungkusan</label>
                  <input
                    type="text"
                    value={editFormData.unit}
                    onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paras Minimum</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.minimum_stock}
                    onChange={(e) => setEditFormData({ ...editFormData, minimum_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-600 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Anggaran Kos (RM)</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={editFormData.estimated_unit_cost}
                    onChange={(e) => setEditFormData({ ...editFormData, estimated_unit_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 shadow flex items-center space-x-1"
                >
                  {modalLoading && <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK RESTOCK */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <PackageCheck className="h-5 w-5 text-emerald-700" />
                  <span>Tambah Stok Pantas (Restock)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menambah kuantiti stok bagi <strong className="text-slate-800">{restockFormData.food_item_name}</strong> ({restockFormData.item_code})
                </p>
              </div>
              <button onClick={() => setIsRestockModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRestock} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kuantiti Masuk ({restockFormData.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restockFormData.quantity}
                    onChange={(e) => setRestockFormData({ ...restockFormData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-extrabold text-emerald-800 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Batch</label>
                  <input
                    type="text"
                    value={restockFormData.batch_number}
                    onChange={(e) => setRestockFormData({ ...restockFormData, batch_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono font-bold focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarikh Luput (FEFO)</label>
                  <input
                    type="date"
                    value={restockFormData.expiry_date}
                    onChange={(e) => setRestockFormData({ ...restockFormData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarikh Diterima</label>
                  <input
                    type="date"
                    value={restockFormData.received_date}
                    onChange={(e) => setRestockFormData({ ...restockFormData, received_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sumber / Pembekal</label>
                  <input
                    type="text"
                    value={restockFormData.source}
                    onChange={(e) => setRestockFormData({ ...restockFormData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kos Seunit (RM)</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={restockFormData.unit_cost}
                    onChange={(e) => setRestockFormData({ ...restockFormData, unit_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={restockFormData.remarks}
                  onChange={(e) => setRestockFormData({ ...restockFormData, remarks: e.target.value })}
                  placeholder="Catatan penerimaan..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 shadow flex items-center space-x-1"
                >
                  {modalLoading && <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Sahkan Tambah Stok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BATCH BREAKDOWN (FEFO) */}
      {selectedItemBatches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedItemBatches.item.item_code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedItemBatches.item.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Senarai Batch Aktif disusun mengikut prinsip FEFO (First-Expire, First-Out). Anda boleh mengemaskini maklumat batch di sini.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedItemBatches(null)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors"
                title="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase z-10 shadow-xs">
                  <tr>
                    <th className="p-3">No. Batch</th>
                    <th className="p-3">Baki Stok</th>
                    <th className="p-3">Tarikh Luput</th>
                    <th className="p-3">Diterima</th>
                    <th className="p-3">Sumber / Pembekal</th>
                    <th className="p-3">Kos/Unit</th>
                    <th className="p-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedItemBatches.batches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tiada batch aktif dengan baki stok. Sila buat Stock In.
                      </td>
                    </tr>
                  ) : (
                    selectedItemBatches.batches.map((b, idx) => (
                      <tr key={b.id} className={idx === 0 ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'}>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {b.batch_number}
                          {idx === 0 && (
                            <span className="ml-2 text-[9px] bg-emerald-600 text-white font-semibold px-1.5 py-0.5 rounded uppercase inline-block">
                              FEFO Utama
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-extrabold text-emerald-800">
                          {b.quantity_remaining} / {b.quantity_received} {selectedItemBatches.item.unit}
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-800">
                          {b.expiry_date}
                        </td>
                        <td className="p-3 text-slate-500 font-mono">
                          {b.received_date}
                        </td>
                        <td className="p-3 text-slate-600 truncate max-w-[140px]" title={b.source}>
                          {b.source}
                        </td>
                        <td className="p-3 font-mono">
                          RM {Number(b.unit_cost || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditBatch(b)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold text-[11px] flex items-center space-x-1 transition-colors"
                              title="Edit Batch"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBatch(b)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                              title="Nyahaktifkan Batch"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-600 font-medium">
                Jumlah Stok Keseluruhan: <strong className="text-emerald-800 font-extrabold">{selectedItemBatches.item.current_stock || 0} {selectedItemBatches.item.unit}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedItemBatches(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT BATCH DETAILS */}
      {isEditBatchModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Kemaskini Maklumat Batch</h3>
                  <p className="text-xs text-slate-500">Edit nombor batch, baki kuantiti & tarikh luput</p>
                </div>
              </div>
              <button onClick={() => setIsEditBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveEditBatch} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombor Batch <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={batchFormData.batch_number}
                  onChange={(e) => setBatchFormData({ ...batchFormData, batch_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Baki Stok Semasa <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={batchFormData.quantity_remaining}
                    onChange={(e) => setBatchFormData({ ...batchFormData, quantity_remaining: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kuantiti Asal Diterima</label>
                  <input
                    type="number"
                    min="0"
                    value={batchFormData.quantity_received}
                    onChange={(e) => setBatchFormData({ ...batchFormData, quantity_received: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarikh Luput <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={batchFormData.expiry_date}
                    onChange={(e) => setBatchFormData({ ...batchFormData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarikh Diterima</label>
                  <input
                    type="date"
                    value={batchFormData.received_date}
                    onChange={(e) => setBatchFormData({ ...batchFormData, received_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sumber / Pembekal</label>
                  <input
                    type="text"
                    value={batchFormData.source}
                    onChange={(e) => setBatchFormData({ ...batchFormData, source: e.target.value })}
                    placeholder="Contoh: Peruntukan KPT, Sumbangan..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kos Seunit (RM)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={batchFormData.unit_cost}
                    onChange={(e) => setBatchFormData({ ...batchFormData, unit_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditBatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 shadow flex items-center space-x-1.5 transition-colors"
                >
                  {modalLoading && <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Simpan Perubahan Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-600">Memuatkan Katalog Makanan...</p>
        </div>
      </div>
    }>
      <InventoryContent />
    </Suspense>
  );
}
