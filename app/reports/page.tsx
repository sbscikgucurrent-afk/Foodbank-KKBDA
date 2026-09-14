'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataTable, { Column } from '@/components/DataTable';
import { 
  FileText, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Filter, 
  Calendar,
  Building,
  CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export default function ReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Filters
  const [reportType, setReportType] = useState('student_collection');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [programmeId, setProgrammeId] = useState<number | ''>('');
  const [semester, setSemester] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');

  const [reportData, setReportData] = useState<any>(null);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reportOptions = [
    { id: 'student_collection', title: '1. Agihan Makanan Mengikut Pelajar' },
    { id: 'programme_usage', title: '2. Agihan Makanan Mengikut Program' },
    { id: 'category_usage', title: '3. Agihan Makanan Mengikut Kategori' },
    { id: 'stock_summary', title: '4. Ringkasan Stok & Inventori Semasa' },
    { id: 'stock_in', title: '5. Transaksi Terimaan Stok (Stock In)' },
    { id: 'stock_out', title: '6. Transaksi Keluaran Stok (Stock Out)' },
    { id: 'stock_adjustment', title: '7. Rekod Pelarasan Stok (Adjustment)' },
    { id: 'low_stock', title: '8. Amaran & Cadangan Stok Rendah' },
    { id: 'expiry_monitoring', title: '9. Pemantauan Tarikh Luput (FEFO)' },
    { id: 'top_beneficiaries', title: '10. Pelajar Kerap Terima Bantuan' },
    { id: 'unassisted_students', title: '11. Pelajar Belum Pernah Terima' },
    { id: 'monthly_usage', title: '12. Trend Penggunaan Bulanan' },
    { id: 'audit_logs', title: '13. Log Audit Sistem & Pentadbir' },
    { id: 'executive_scorecard', title: '14. Scorecard Prestasi Eksekutif' },
  ];

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(d => {
        if (d.user) setCurrentUser(d.user);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadReport = () => {
    setLoading(true);
    let url = `/api/reports?report_type=${reportType}`;
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;
    if (programmeId) url += `&programme_id=${programmeId}`;
    if (semester) url += `&semester=${semester}`;
    if (categoryId) url += `&category_id=${categoryId}`;

    fetch(url)
      .then(res => res.json())
      .then(d => {
        setReportData(d.report);
        setProgrammes(d.programmes || []);
        setCategories(d.categories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadReport();
  }, [reportType, dateFrom, dateTo, programmeId, semester, categoryId]);

  // Export PDF with Official Institutional Header
  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();

    // Official Malaysian Institutional Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(6, 95, 70); // Emerald green
    doc.text('KOLEJ KOMUNITI BANDAR DARULAMAN', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('UNIT AMBILAN DAN PEMBANGUNAN PELAJAR (UAPP)', 105, 21, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(217, 119, 6); // Amber
    doc.text('JOM KENYANG — DAPUR SISWA', 105, 27, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.setDrawColor(6, 95, 70);
    doc.line(14, 31, 196, 31);

    // Report Title & Metadata
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`TAJUK LAPORAN: ${reportData.report_title?.toUpperCase()}`, 14, 38);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Tarikh Dijana: ${reportData.generated_at} | Tempoh: ${reportData.period_label || 'Keseluruhan'}`, 14, 43);

    // Summary KPIs if available
    let startY = 48;
    if (reportData.summary) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 47, 182, 14, 'F');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      
      const summaryText = Object.entries(reportData.summary)
        .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
        .join('  |  ');
      
      doc.text(summaryText, 18, 55);
      startY = 65;
    }

    // Auto Table Generation
    const headers = reportData.columns?.map((c: any) => c.header) || [];
    const rows = reportData.rows?.map((r: any) => 
      reportData.columns.map((c: any) => String(r[c.key] ?? ''))
    ) || [];

    autoTable(doc, {
      startY: startY,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 }
    });

    // Signature Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    if (finalY < 260) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Disediakan Oleh:', 14, finalY);
      doc.text('Disahkan Oleh:', 130, finalY);
      
      doc.text('......................................................', 14, finalY + 15);
      doc.text('......................................................', 130, finalY + 15);

      doc.setFont('helvetica', 'bold');
      doc.text('Petugas Dapur Siswa Jom Kenyang', 14, finalY + 20);
      doc.text('Pegawai UAPP KKBDA', 130, finalY + 20);
    }

    doc.save(`${reportData.report_title?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  // Export Excel
  const exportExcel = () => {
    if (!reportData || !reportData.rows) return;
    const ws = XLSX.utils.json_to_sheet(reportData.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    XLSX.writeFile(wb, `${reportData.report_title?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userRole={currentUser?.role} userName={currentUser?.name} />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header 
          title="MODUL LAPORAN & ANALISIS (REPORT GENERATOR)" 
          subtitle="14 Jenis Laporan Rasmi, Eksport PDF Institutional & Excel" 
          userName={currentUser?.name} 
        />

        <main className="p-6 md:p-8 space-y-6">
          {/* Top Report Type Selector & Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-800">Pilih Jenis Laporan Rasmi</h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={exportPDF}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <Download className="h-4 w-4" />
                  <span>Muat Turun PDF Rasmi</span>
                </button>

                <button
                  type="button"
                  onClick={exportExcel}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Eksport Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5 no-print"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>

            {/* Report Selector Dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Jenis Laporan (14 Pilihan):</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                >
                  {reportOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.title}</option>
                  ))}
                </select>
              </div>

              {/* Multi-Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dari Tarikh</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Hingga Tarikh</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Program</label>
                  <select
                    value={programmeId}
                    onChange={(e) => setProgrammeId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="">Semua</option>
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>{p.programme_code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="">Semua</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Printable Official Report Header & Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-10 space-y-6 print-container">
            {/* Header KKBDA */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-emerald-800">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Kolej Komuniti Bandar Darulaman</p>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase">Unit Ambilan dan Pembangunan Pelajar (UAPP)</h2>
              <div className="inline-block px-3 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded-full">
                JOM KENYANG — DAPUR SISWA
              </div>
            </div>

            {/* Report Title & Summary Card */}
            {reportData && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 uppercase">{reportData.report_title}</h3>
                    <p className="text-xs text-slate-500">Tarikh Dijana: {reportData.generated_at} • Tempoh: {reportData.period_label || 'Keseluruhan'}</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                    {reportData.rows?.length || 0} Rekod Dijana
                  </span>
                </div>

                {/* Summary Box */}
                {reportData.summary && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.entries(reportData.summary).map(([key, value]: any) => (
                      <div key={key}>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-bold text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-800 text-white text-[11px] font-bold uppercase">
                        {reportData.columns?.map((col: any) => (
                          <th key={col.key} className="p-3">{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {reportData.rows?.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {reportData.columns?.map((col: any) => (
                            <td key={col.key} className="p-3">
                              {row[col.key] ?? '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Official Signatures */}
                <div className="pt-12 grid grid-cols-2 gap-8 text-xs text-slate-700 pt-8 border-t border-slate-200 no-screen print:grid">
                  <div>
                    <p className="font-semibold">Disediakan Oleh:</p>
                    <div className="h-16"></div>
                    <p className="font-bold border-t border-slate-300 pt-1 w-48">Petugas Dapur Siswa Jom Kenyang</p>
                    <p className="text-[10px] text-slate-500">Kolej Komuniti Bandar Darulaman</p>
                  </div>
                  <div>
                    <p className="font-semibold">Disahkan Oleh:</p>
                    <div className="h-16"></div>
                    <p className="font-bold border-t border-slate-300 pt-1 w-48">Pegawai UAPP KKBDA</p>
                    <p className="text-[10px] text-slate-500">Unit Ambilan & Pembangunan Pelajar</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
