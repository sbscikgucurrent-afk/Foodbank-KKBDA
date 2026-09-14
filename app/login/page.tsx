'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UtensilsCrossed, 
  ShieldCheck, 
  HeartHandshake, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  UserPlus, 
  Phone, 
  Mail, 
  Eye, 
  EyeOff, 
  Check, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loginRoleTab, setLoginRoleTab] = useState<'student' | 'admin' | 'register'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: '',
    ic_number: '',
    student_id: '',
    programme_id: '1',
    semester: '1',
    phone: '',
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginRoleTab === 'student') {
      if (!identifier.trim()) {
        setError('Sila masukkan No. Kad Pengenalan atau ID Pelajar anda.');
        return;
      }
    } else {
      if (!identifier.trim() || !password) {
        setError('Sila masukkan ID Pengguna dan kata laluan.');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: identifier.trim(), 
          password: loginRoleTab === 'student' ? undefined : password,
          isStudentLogin: loginRoleTab === 'student'
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Log masuk gagal. Sila semak maklumat.');
        setLoading(false);
        return;
      }

      setSuccessMsg(`Selamat kembali, ${data.user?.name || 'Pengguna'}! Mengalihkan...`);
      setTimeout(() => {
        if (data.user?.role === 'student') {
          router.push('/student');
        } else {
          router.push('/dashboard');
        }
      }, 500);
    } catch (err) {
      setError('Ralat sambungan ke pelayan.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.ic_number) {
      setError('Sila masukkan Nama Penuh dan No. Kad Pengenalan.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Pendaftaran gagal. Sila semak maklumat.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Pendaftaran berjaya! Sedang membawa anda ke Portal Pelajar...');
      setTimeout(() => {
        router.push('/student');
      }, 1000);
    } catch (err) {
      setError('Ralat sambungan ke pelayan.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-900 selection:bg-emerald-600 selection:text-white font-sans">
      
      {/* MOBILE HEADER (Visible on smartphones & tablets < lg) */}
      <div className="lg:hidden bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-5 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none"></div>
        <div className="flex items-center space-x-3 relative z-10">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg ring-2 ring-emerald-400/30 shrink-0">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-black tracking-wider text-emerald-400 uppercase bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-800/60">
                KKBDA
              </span>
              <span className="text-[11px] font-semibold text-slate-300 truncate">Dapur Siswa Madani</span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white leading-tight mt-0.5">JOM KENYANG</h1>
          </div>
        </div>
      </div>

      {/* DESKTOP LEFT HERO PANEL (Visible on lg+ screens) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-10 lg:p-14 xl:p-16 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        
        {/* Glow Effects */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        {/* Top Desktop Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-400/30">
              <UtensilsCrossed className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  KKBDA
                </span>
                <span className="text-[11px] font-semibold text-slate-300">Kolej Komuniti Bandar Darulaman</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">JOM KENYANG</h1>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2 text-xs text-emerald-300/90 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Unit Ambilan & Pembangunan Pelajar (UAPP)</span>
          </div>
        </div>

        {/* Hero Central Content */}
        <div className="my-auto py-8 relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-900/40 border border-emerald-600/40 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <HeartHandshake className="h-4 w-4 text-emerald-400" />
            <span>Inisiatif Kebajikan Siswa Madani</span>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Sistem Pengurusan & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Agihan Makanan</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              Portal rasmi Dapur Siswa Kolej Komuniti Bandar Darulaman. Memudahkan pengambilan makanan layan diri bagi pelajar serta kawalan inventori berintegriti untuk pihak pengurusan.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 hover:border-emerald-500/50 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-400 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Portal Siswa</h4>
                  <p className="text-[11px] text-emerald-400 font-medium">Layan Diri & Tebus Makanan</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2.5 leading-normal">
                Log masuk pantas hanya guna No. IC untuk pilih pek makanan percuma.
              </p>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 hover:border-amber-500/50 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-900/60 text-amber-400 group-hover:scale-110 transition-transform">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Portal Admin & Staf</h4>
                  <p className="text-[11px] text-amber-400 font-medium">Inventori, Audit & Laporan</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2.5 leading-normal">
                Kawalan stok FEFO, analisis agihan, pendaftaran dan 14 laporan rasmi.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <span>Hak Cipta Terpelihara © 2026 KKBDA</span>
          <div className="flex items-center space-x-2 text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span>Platform Selamat & Berintegriti</span>
          </div>
        </div>
      </div>

      {/* RIGHT LOGIN / PORTAL ACCESS CONTAINER (Responsive on Phone & PC) */}
      <div className="w-full lg:w-7/12 xl:w-1/2 p-4 sm:p-8 lg:p-12 xl:p-16 flex flex-col justify-center items-center bg-slate-50 min-h-[calc(100vh-80px)] lg:min-h-screen overflow-y-auto">
        <div className="w-full max-w-md space-y-4 sm:space-y-5 my-auto py-2 sm:py-6">
          
          {/* Top Title */}
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Selamat Datang ke Jom Kenyang
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Sila pilih portal anda untuk meneruskan log masuk:
            </p>
          </div>

          {/* TWO MAIN PORTAL CARDS (PELAJAR VS ADMIN) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300">
            
            {/* TAB 1: PELAJAR */}
            <button
              type="button"
              onClick={() => {
                setLoginRoleTab('student');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`p-3 sm:p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                loginRoleTab === 'student'
                  ? 'bg-white text-slate-900 shadow-md ring-2 ring-emerald-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className={`p-1.5 sm:p-2 rounded-xl ${loginRoleTab === 'student' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                {loginRoleTab === 'student' && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 sm:ring-4 ring-emerald-100"></span>
                )}
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-800">Portal Siswa</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900">Log Masuk Pelajar</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Guna No. IC Sahaja</p>
              </div>
            </button>

            {/* TAB 2: ADMIN & STAF */}
            <button
              type="button"
              onClick={() => {
                setLoginRoleTab('admin');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`p-3 sm:p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                loginRoleTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className={`p-1.5 sm:p-2 rounded-xl ${loginRoleTab === 'admin' ? 'bg-slate-800 text-amber-400' : 'bg-slate-200 text-slate-500'}`}>
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                {loginRoleTab === 'admin' && (
                  <span className="h-2 w-2 rounded-full bg-amber-400 ring-2 sm:ring-4 ring-slate-700"></span>
                )}
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400">Pengurusan</p>
                <p className={`text-xs sm:text-sm font-bold ${loginRoleTab === 'admin' ? 'text-white' : 'text-slate-900'}`}>Admin / Staf</p>
                <p className={`text-[9px] sm:text-[10px] mt-0.5 ${loginRoleTab === 'admin' ? 'text-slate-400' : 'text-slate-500'}`}>ID Staf & Kata Laluan</p>
              </div>
            </button>
          </div>

          {/* Quick Register / Switch Banner */}
          {loginRoleTab !== 'register' ? (
            <div className="flex items-center justify-between px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
              <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
                <UserPlus className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium truncate text-[11px] sm:text-xs">Pelajar baharu dan belum ada akaun?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginRoleTab('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-0.5 cursor-pointer ml-2 shrink-0 text-xs"
              >
                <span>Daftar Sini</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2 sm:px-4 sm:py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
                <GraduationCap className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="font-medium truncate text-[11px] sm:text-xs">Sudah mendaftar akaun sebelum ini?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginRoleTab('student');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-blue-700 hover:text-blue-800 hover:underline flex items-center space-x-0.5 cursor-pointer ml-2 shrink-0 text-xs"
              >
                <span>Kembali Log Masuk</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Notifications */}
          {successMsg && (
            <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2.5 sm:space-x-3 shadow-xs animate-in fade-in">
              <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2.5 sm:space-x-3 shadow-xs animate-in fade-in">
              <div className="p-1 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* MAIN FORM CARD */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-8 shadow-xl shadow-slate-200/60 border border-slate-200">
            
            {/* TAB: REGISTER FORM */}
            {loginRoleTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                <div className="pb-2 border-b border-slate-100 flex items-center space-x-2 text-slate-800">
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Borang Pendaftaran Pelajar Baharu</h3>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Penuh Pelajar <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      placeholder="Contoh: Muhammad Amirul bin Rosli"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none font-medium"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      No. Kad Pengenalan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regForm.ic_number}
                      onChange={(e) => setRegForm({ ...regForm, ic_number: e.target.value })}
                      placeholder="050214-02-5542"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none font-mono font-bold"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Digunakan untuk log masuk</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ID Siswa / No Matrik
                    </label>
                    <input
                      type="text"
                      value={regForm.student_id}
                      onChange={(e) => setRegForm({ ...regForm, student_id: e.target.value })}
                      placeholder="KKBDA011 (Pilihan)"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Program Pengajian</label>
                    <select
                      value={regForm.programme_id}
                      onChange={(e) => setRegForm({ ...regForm, programme_id: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                    >
                      <option value="1">SKE — Sijil Teknologi Elektrik</option>
                      <option value="2">STM — Sijil Teknologi Maklumat</option>
                      <option value="3">STS — Sijil Teknologi Senibina</option>
                      <option value="4">SAU — Sijil Teknologi Automotif</option>
                      <option value="5">DCV — Diploma Teknologi Kenderaan Perdagangan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Semester</label>
                    <select
                      value={regForm.semester}
                      onChange={(e) => setRegForm({ ...regForm, semester: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none font-semibold text-slate-800"
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. Telefon</label>
                    <div className="relative">
                      <Phone className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        placeholder="012-3456789"
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Emel Pelajar</label>
                    <div className="relative">
                      <Mail className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        placeholder="pelajar@siswa.kkbda.edu.my"
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>DAFTAR AKAUN & TERUS LOG MASUK</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* TAB: STUDENT LOGIN */}
            {loginRoleTab === 'student' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">Log Masuk Pelajar KKBDA</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-emerald-200">
                    Tanpa Kata Laluan
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    No. Kad Pengenalan / ID Siswa <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Contoh: 050214-02-5542 atau KKBDA001"
                      className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition-all font-mono font-semibold text-slate-900"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-start sm:items-center space-x-1 pt-0.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                    <span>Hanya masukkan No. IC untuk mula tebus makanan.</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>LOG MASUK SEBAGAI PELAJAR</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* TAB: ADMIN LOGIN */}
            {loginRoleTab === 'admin' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 text-amber-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">Portal Pentadbir</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-slate-200">
                    Akses Dibenarkan
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    ID Pengguna Pentadbir <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin"
                      className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-none transition-all font-medium text-slate-900"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Kata Laluan Pentadbir <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-none transition-all font-medium text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showPassword ? 'Sembunyi kata laluan' : 'Papar kata laluan'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-slate-900/30 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>LOG MASUK SEBAGAI PENTADBIR</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

          </div>

          {/* MOBILE BOTTOM FOOTER (Visible on mobile screens) */}
          <div className="lg:hidden text-center text-[10px] text-slate-400 pt-2 space-y-1">
            <p>Dapur Siswa Jom Kenyang • Kolej Komuniti Bandar Darulaman</p>
            <p className="text-slate-400/80">Hak Cipta Terpelihara © 2026 KKBDA</p>
          </div>

        </div>
      </div>
    </div>
  );
}
