'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import StudentQRCard from '@/components/StudentQRCard';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  HeartHandshake, 
  History, 
  Package, 
  User, 
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { Student } from '@/lib/types';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) setCurrentUser(d.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));

    if (params.id) {
      fetch(`/api/students/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.student) {
            setStudent(data.student);
            setHistory(data.history || []);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id, router]);

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-600">Memuatkan Profil Pelajar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="PROFIL PELAJAR & REKOD FOODBANK" 
          subtitle="Maklumat Terperinci dan Sejarah Agihan Makanan"
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/pelajar"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Senarai Pelajar</span>
            </Link>

            <Link
              href="/pengambilan"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Agih Makanan Pelajar Ini</span>
            </Link>
          </div>

          {/* Student Profile Card & Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Info Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 lg:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {student.student_id}
                    </span>
                    <StatusBadge status={student.status} />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">{student.name}</h2>
                  <p className="text-xs text-emerald-800 font-semibold">{student.programme_name}</p>
                </div>
              </div>

              {/* Student Demographics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <p className="text-slate-400 text-[11px]">No. Kad Pengenalan</p>
                  <p className="font-mono font-semibold text-slate-800">{student.ic_number}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Semester & Kumpulan</p>
                  <p className="font-semibold text-slate-800">Sem {student.semester} ({student.class_group || 'A'})</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">No. Telefon</p>
                  <p className="font-semibold text-slate-800">{student.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Emel Siswa</p>
                  <p className="font-semibold text-slate-800 truncate">{student.email || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Token Keselamatan QR</p>
                  <p className="font-mono text-[11px] text-slate-600 truncate">{student.qr_token}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Tarikh Didaftarkan</p>
                  <p className="text-slate-700">{student.created_at.split(' ')[0]}</p>
                </div>
              </div>

              {/* FOODBANK SUMMARY */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Ringkasan Penggunaan Foodbank
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                    <p className="text-[10px] text-emerald-700 font-semibold uppercase">Jumlah Lawatan</p>
                    <p className="text-xl font-bold text-emerald-900 mt-1">{student.total_visits || 0}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                    <p className="text-[10px] text-amber-700 font-semibold uppercase">Item Diterima</p>
                    <p className="text-xl font-bold text-amber-900 mt-1">{student.total_items_received || 0}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Lawatan Terakhir</p>
                    <p className="text-xs font-bold text-slate-800 mt-2 truncate">
                      {student.last_visit ? student.last_visit.split(' ')[0] : 'Belum Ada'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Lawatan Pertama</p>
                    <p className="text-xs font-bold text-slate-800 mt-2 truncate">
                      {student.first_visit ? student.first_visit.split(' ')[0] : 'Belum Ada'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Printable QR Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
              <StudentQRCard student={student} />
            </div>
          </div>

          {/* COLLECTION HISTORY TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Sejarah Pengambilan Makanan Siswa
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {history.length} rekod item
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
                    <th className="p-3.5">Tarikh & Masa</th>
                    <th className="p-3.5">No. Transaksi</th>
                    <th className="p-3.5">Item Makanan</th>
                    <th className="p-3.5">Kuantiti</th>
                    <th className="p-3.5">Petugas / Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Pelajar ini belum membuat sebarang rekod pengambilan makanan.
                      </td>
                    </tr>
                  ) : (
                    history.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{h.created_at.split(' ')[0]}</div>
                          <span className="text-[10px] text-slate-400">{h.created_at.split(' ')[1]}</span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-700">
                          {h.transaction_code}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900">{h.food_item_name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{h.item_code}</span>
                        </td>
                        <td className="p-3.5 font-extrabold text-emerald-700">
                          {h.quantity} {h.unit}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {h.operator_name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
