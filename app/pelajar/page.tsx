'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StudentQRCard from '@/components/StudentQRCard';
import ConfirmModal from '@/components/ConfirmModal';
import { 
  UserPlus, 
  QrCode, 
  Eye, 
  Edit, 
  Power, 
  Search, 
  Filter, 
  X, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle,
  Trash2
} from 'lucide-react';
import { Student } from '@/lib/types';
import * as XLSX from 'xlsx';

function PelajarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedProgramme, setSelectedProgramme] = useState<number | ''>('');
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isConfirmToggleOpen, setIsConfirmToggleOpen] = useState(false);

  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    ic_number: '',
    programme_id: 1,
    semester: 1,
    class_group: 'A',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) {
          setCurrentUser(d.user);
          if (d.user.role === 'student') {
            router.push('/student');
          }
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadData = () => {
    setLoading(true);
    let url = `/api/students?status=${selectedStatus}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (selectedProgramme) url += `&programme_id=${selectedProgramme}`;
    if (selectedSemester) url += `&semester=${selectedSemester}`;

    fetch(url)
      .then(res => res.json())
      .then(d => {
        setStudents(d.students || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/reports?report_type=programme_usage')
      .then(res => res.json())
      .then(d => setProgrammes(d.programmes || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, [selectedProgramme, selectedSemester, selectedStatus]);

  const handleOpenAdd = () => {
    setFormData({
      student_id: '',
      name: '',
      ic_number: '',
      programme_id: programmes[0]?.id || 1,
      semester: 1,
      class_group: 'A',
      phone: '',
      email: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setActiveStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      ic_number: student.ic_number,
      programme_id: student.programme_id,
      semester: student.semester,
      class_group: student.class_group || 'A',
      phone: student.phone || '',
      email: student.email || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setFormError(null);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Gagal mendaftar pelajar.');
        setModalLoading(false);
        return;
      }
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError('Ralat pangkalan data.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    setModalLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/students/${activeStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Gagal mengemaskini maklumat.');
        setModalLoading(false);
        return;
      }
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError('Ralat pangkalan data.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!activeStudent) return;
    setModalLoading(true);
    try {
      await fetch(`/api/students/${activeStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status' })
      });
      setIsConfirmToggleOpen(false);
      loadData();
    } catch (e) {}
    finally {
      setModalLoading(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Adakah anda pasti ingin memadamkan rekod pelajar "${student.name}" (${student.student_id}) sepenuhnya daripada sistem?`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Gagal memadam data pelajar.');
        setLoading(false);
        return;
      }
      loadData();
    } catch (e) {
      alert('Ralat sambungan.');
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const exportRows = students.map(s => ({
      'ID Pelajar': s.student_id,
      'Nama Pelajar': s.name,
      'No. IC': s.ic_number,
      'Program': s.programme_name,
      'Semester': s.semester,
      'Kelas': s.class_group,
      'Telefon': s.phone,
      'Emel': s.email,
      'Jumlah Lawatan': s.total_visits || 0,
      'Item Diterima': s.total_items_received || 0,
      'Status': s.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Senarai Pelajar');
    XLSX.writeFile(wb, `Senarai_Pelajar_Foodbank_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns: Column<Student>[] = [
    {
      key: 'student_id',
      header: 'ID Pelajar',
      render: (s) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {s.student_id}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Nama Pelajar',
      render: (s) => (
        <div>
          <p className="font-bold text-slate-900 leading-tight">{s.name}</p>
          <span className="text-[11px] text-slate-500 font-mono">{s.ic_number}</span>
        </div>
      )
    },
    {
      key: 'programme_name',
      header: 'Program / Kursus',
      render: (s) => (
        <div>
          <span className="font-semibold text-emerald-800">{s.programme_code}</span>
          <p className="text-[11px] text-slate-500 truncate max-w-xs">{s.programme_name}</p>
        </div>
      )
    },
    {
      key: 'semester',
      header: 'Sem / Kumpulan',
      render: (s) => (
        <span className="text-xs text-slate-700">
          Sem {s.semester} ({s.class_group || 'A'})
        </span>
      )
    },
    {
      key: 'total_visits',
      header: 'Kekerapan Bantuan',
      render: (s) => (
        <div className="text-xs">
          <span className="font-bold text-emerald-700">{s.total_visits || 0} kali</span>
          <span className="text-[10px] text-slate-400 block">{s.total_items_received || 0} item diterima</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <StatusBadge status={s.status} />
    },
    {
      key: 'actions',
      header: 'Tindakan',
      sortable: false,
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => { setActiveStudent(s); setIsQRModalOpen(true); }}
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
            title="Lihat & Cetak QR"
          >
            <QrCode className="h-4 w-4" />
          </button>
          <Link
            href={`/pelajar/${s.id}`}
            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
            title="Profil & Sejarah Pengambilan"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            onClick={() => handleOpenEdit(s)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Kemaskini Pelajar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setActiveStudent(s); setIsConfirmToggleOpen(true); }}
            className={`p-1.5 rounded-lg border transition-colors ${
              s.status === 'ACTIVE'
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}
            title={s.status === 'ACTIVE' ? 'Nyahaktif Pelajar' : 'Aktifkan Pelajar'}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteStudent(s)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 transition-colors"
            title="Padam Data Pelajar"
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
          title="PENGURUSAN PELAJAR" 
          subtitle="Modul Pendaftaran, Kad QR & Rekod Penerima Bantuan" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {/* Top Filter & Add Section */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Programme Select */}
              <select
                value={selectedProgramme}
                onChange={(e) => setSelectedProgramme(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
              >
                <option value="">Semua Program</option>
                {programmes.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.programme_code} - {p.programme_name}</option>
                ))}
              </select>

              {/* Semester Select */}
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
              >
                <option value="">Semua Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
              </select>

              {/* Status Select */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif Sahaja</option>
                <option value="INACTIVE">Tidak Aktif</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
            >
              <UserPlus className="h-4 w-4" />
              <span>Daftar Pelajar Baru</span>
            </button>
          </div>

          {/* Student DataTable */}
          <DataTable
            data={students}
            columns={columns}
            keyField="id"
            searchPlaceholder="Cari mengikut ID, Nama, No. IC, Telefon..."
            onExportExcel={exportToExcel}
          />
        </main>
      </div>

      {/* MODAL: ADD STUDENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-emerald-700" />
                <span>Pendaftaran Pelajar Baru</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ID Pelajar (cth: KKBDA031)</label>
                  <input
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    placeholder="KKBDA031"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono font-bold focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Kad Pengenalan (IC)</label>
                  <input
                    type="text"
                    value={formData.ic_number}
                    onChange={(e) => setFormData({ ...formData, ic_number: e.target.value })}
                    placeholder="050101-02-1234"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Penuh Pelajar</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama mengikut Kad Pengenalan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Program Pengajian</label>
                <select
                  value={formData.programme_id}
                  onChange={(e) => setFormData({ ...formData, programme_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                  required
                >
                  {programmes.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.programme_code} - {p.programme_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                    <option value={3}>Semester 3</option>
                    <option value={4}>Semester 4</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kumpulan / Kelas</label>
                  <input
                    type="text"
                    value={formData.class_group}
                    onChange={(e) => setFormData({ ...formData, class_group: e.target.value })}
                    placeholder="A / B / C"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Telefon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="012-3456789"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emel Siswa</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@student.kkbda.edu.my"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
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
                  <span>Daftar Pelajar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STUDENT */}
      {isEditModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit className="h-5 w-5 text-blue-700" />
                <span>Kemaskini Pelajar: {activeStudent.student_id}</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Penuh Pelajar</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Kad Pengenalan (IC)</label>
                  <input
                    type="text"
                    value={formData.ic_number}
                    onChange={(e) => setFormData({ ...formData, ic_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Program Pengajian</label>
                  <select
                    value={formData.programme_id}
                    onChange={(e) => setFormData({ ...formData, programme_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600"
                  >
                    {programmes.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.programme_code} - {p.programme_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                    <option value={3}>Semester 3</option>
                    <option value={4}>Semester 4</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kumpulan / Kelas</label>
                  <input
                    type="text"
                    value={formData.class_group}
                    onChange={(e) => setFormData({ ...formData, class_group: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Telefon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emel</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600"
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
                  className="px-5 py-2 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 shadow flex items-center space-x-1"
                >
                  {modalLoading && <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW & PRINT QR */}
      {isQRModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsQRModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors no-print"
            >
              <X className="h-5 w-5" />
            </button>

            <StudentQRCard student={activeStudent} />
          </div>
        </div>
      )}

      {/* CONFIRM TOGGLE STATUS */}
      <ConfirmModal
        isOpen={isConfirmToggleOpen}
        onClose={() => setIsConfirmToggleOpen(false)}
        onConfirm={handleToggleStatus}
        title={activeStudent?.status === 'ACTIVE' ? 'Nyahaktifkan Pelajar?' : 'Aktifkan Semula Pelajar?'}
        message={`Adakah anda pasti untuk menukar status pelajar ${activeStudent?.name} (${activeStudent?.student_id}) kepada ${activeStudent?.status === 'ACTIVE' ? 'TIDAK AKTIF' : 'AKTIF'}?`}
        confirmText={activeStudent?.status === 'ACTIVE' ? 'Ya, Nyahaktifkan' : 'Ya, Aktifkan'}
        variant={activeStudent?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={modalLoading}
      />
    </div>
  );
}

export default function PelajarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-600">Memuatkan Pengurusan Pelajar...</p>
        </div>
      </div>
    }>
      <PelajarContent />
    </Suspense>
  );
}
