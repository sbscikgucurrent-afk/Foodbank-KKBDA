'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import { UserPlus, KeyRound, Power, ShieldAlert, X, AlertCircle, Pencil } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isConfirmToggleOpen, setIsConfirmToggleOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'operator'
  });

  const [editFormData, setEditFormData] = useState({
    userId: '',
    username: '',
    name: '',
    email: '',
    role: 'operator',
    status: 'ACTIVE',
    password: ''
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

    loadUsers();
  }, [router]);

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(d => {
        setUsers(d.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setFormError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Gagal mendaftar pengguna.');
        setModalLoading(false);
        return;
      }
      setIsAddModalOpen(false);
      loadUsers();
    } catch (e) {
      setFormError('Ralat pangkalan data.');
    } finally {
      setModalLoading(false);
    }
  };

  const openEditModal = (u: any) => {
    setActiveUser(u);
    setEditFormData({
      userId: u.id,
      username: u.username || '',
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'operator',
      status: u.status || 'ACTIVE',
      password: ''
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setFormError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Gagal mengemaskini pengguna.');
        setModalLoading(false);
        return;
      }
      setIsEditModalOpen(false);
      loadUsers();
    } catch (e) {
      setFormError('Ralat pangkalan data semasa kemaskini.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !newPassword) return;
    setModalLoading(true);

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          userId: activeUser.id,
          newPassword
        })
      });
      setIsResetModalOpen(false);
      setNewPassword('');
      loadUsers();
    } catch (e) {}
    finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!activeUser) return;
    setModalLoading(true);
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          userId: activeUser.id
        })
      });
      setIsConfirmToggleOpen(false);
      loadUsers();
    } catch (e) {}
    finally {
      setModalLoading(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'username',
      header: 'Nama Pengguna / ID',
      render: (u) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {u.username}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Nama Penuh',
      render: (u) => (
        <div>
          <span className="font-bold text-slate-900">{u.name}</span>
          <span className="text-[10px] text-slate-400 block">{u.email || '-'}</span>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Peranan / Akses',
      render: (u) => <StatusBadge status={u.role} />
    },
    {
      key: 'status',
      header: 'Status Akaun',
      render: (u) => <StatusBadge status={u.status} />
    },
    {
      key: 'created_at',
      header: 'Tarikh Dicipta',
      render: (u) => <span className="font-mono text-xs text-slate-600">{u.created_at?.split(' ')[0]}</span>
    },
    {
      key: 'actions',
      header: 'Tindakan',
      sortable: false,
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => openEditModal(u)}
            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-xs"
            title="Kemaskini Maklumat Pengguna"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setActiveUser(u); setIsResetModalOpen(true); }}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors shadow-xs"
            title="Set Semula Kata Laluan"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          {u.role !== 'superadmin' && (
            <button
              onClick={() => { setActiveUser(u); setIsConfirmToggleOpen(true); }}
              className={`p-1.5 rounded-lg border transition-colors shadow-xs ${
                u.status === 'ACTIVE'
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
              title={u.status === 'ACTIVE' ? 'Nyahaktif Pengguna' : 'Aktifkan Pengguna'}
            >
              <Power className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="PENGURUSAN PENGGUNA & PERANAN (USER MANAGEMENT)" 
          subtitle="Kawalan Akses Peranan Super Admin, Admin UAPP & Operator Dapur" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Senarai Pengguna Berdaftar</h3>
              <p className="text-xs text-slate-500">Kawalan hak akses berasaskan peranan (RBAC)</p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5"
            >
              <UserPlus className="h-4 w-4" />
              <span>Tambah Pengguna Baru</span>
            </button>
          </div>

          <DataTable
            data={users}
            columns={columns}
            keyField="id"
            searchPlaceholder="Cari nama pengguna, nama penuh, email..."
          />
        </main>
      </div>

      {/* MODAL: ADD USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-emerald-700" />
                <span>Pendaftaran Pengguna Sistem Baru</span>
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

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pengguna (Username)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="cth: uapp_officer2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Laluan</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Penuh Pegawai</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama penuh pegawai"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emel Rasmi</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="pegawai@kkbda.edu.my"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Peranan & Tahap Akses (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 font-bold text-slate-800"
                >
                  <option value="uappadmin">Admin UAPP (Pegawai Pengurusan)</option>
                  <option value="operator">Foodbank Operator (Petugas Dapur)</option>
                  <option value="superadmin">Super Admin (Pentadbir Utama)</option>
                </select>
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
                  <span>Cipta Akaun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-blue-600" />
                <span>Kemaskini Pengguna: {activeUser?.username}</span>
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

            <form onSubmit={handleUpdateUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pengguna (Username)</label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Penuh</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emel Rasmi</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peranan & Akses</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 font-bold text-slate-800"
                  >
                    <option value="operator">Operator Dapur</option>
                    <option value="uappadmin">Admin UAPP</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="student">Pelajar (Student)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Akaun</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 font-bold text-slate-800"
                  >
                    <option value="ACTIVE">ACTIVE (Aktif)</option>
                    <option value="INACTIVE">INACTIVE (Tidak Aktif)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Laluan Baharu <span className="font-normal text-slate-400">(Pilihan - isi jika mahu tukar)</span>
                </label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="Biarkan kosong jika tidak ubah"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 font-mono"
                />
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
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow flex items-center space-x-1"
                >
                  {modalLoading && <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {isResetModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <KeyRound className="h-5 w-5 text-amber-600" />
                <span>Set Semula Kata Laluan: {activeUser.username}</span>
              </h3>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Masukkan Kata Laluan Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-600 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 shadow"
                >
                  Simpan Kata Laluan Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM TOGGLE USER */}
      <ConfirmModal
        isOpen={isConfirmToggleOpen}
        onClose={() => setIsConfirmToggleOpen(false)}
        onConfirm={handleToggleStatus}
        title={activeUser?.status === 'ACTIVE' ? 'Nyahaktifkan Pengguna?' : 'Aktifkan Semula Pengguna?'}
        message={`Adakah anda pasti untuk menukar status akaun ${activeUser?.name} (${activeUser?.username})?`}
        confirmText={activeUser?.status === 'ACTIVE' ? 'Nyahaktif' : 'Aktifkan'}
        variant={activeUser?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={modalLoading}
      />
    </div>
  );
}
