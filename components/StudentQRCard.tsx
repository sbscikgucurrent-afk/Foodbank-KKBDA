'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, QrCode, UtensilsCrossed, ShieldCheck } from 'lucide-react';
import { Student } from '@/lib/types';

interface StudentQRCardProps {
  student: Student;
  institutionName?: string;
  foodbankName?: string;
}

export default function StudentQRCard({
  student,
  institutionName = 'Kolej Komuniti Bandar Darulaman',
  foodbankName = 'Jom Kenyang — Dapur Siswa'
}: StudentQRCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (student?.qr_token || student?.student_id) {
      // Generate QR from secure qr_token or student_id
      const qrPayload = student.qr_token || student.student_id;
      QRCode.toDataURL(qrPayload, {
        width: 256,
        margin: 2,
        color: {
          dark: '#065f46',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR generation error:', err));
    }
  }, [student]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${student.student_id}_${student.name.replace(/\s+/g, '_')}.png`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Official Printable ID Card */}
      <div 
        ref={cardRef}
        className="w-full max-w-sm bg-white rounded-2xl border-2 border-emerald-800 shadow-xl overflow-hidden print-card relative"
      >
        {/* Card Header */}
        <div className="bg-emerald-800 text-white p-4 text-center relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <UtensilsCrossed className="w-24 h-24" />
          </div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-200">{institutionName}</p>
          <h2 className="text-xs font-bold text-white mt-0.5 uppercase tracking-wide">Unit Ambilan & Pembangunan Pelajar</h2>
          <div className="inline-block mt-2 px-3 py-1 bg-amber-500 text-slate-950 font-extrabold text-[11px] rounded-full shadow-xs">
            {foodbankName}
          </div>
        </div>

        {/* Card Body with QR */}
        <div className="p-6 flex flex-col items-center text-center bg-radial from-emerald-50/40 to-white">
          <div className="p-3 bg-white rounded-xl shadow-md border-2 border-emerald-100 flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR Code ${student.student_id}`} className="w-44 h-44 object-contain" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                <QrCode className="w-16 h-16 animate-pulse text-emerald-700" />
              </div>
            )}
          </div>

          <div className="mt-4 space-y-1">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full border border-emerald-300">
              {student.student_id}
            </span>
            <h3 className="text-sm font-bold text-slate-900 pt-1 leading-snug">{student.name}</h3>
            <p className="text-xs font-medium text-emerald-700">{student.programme_name || student.programme_code}</p>
            <p className="text-[11px] text-slate-500">Semester {student.semester} • Kumpulan {student.class_group || 'A'}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center space-x-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Pengesahan Digital</span>
            </div>
            <span>Dapur Siswa Jom Kenyang</span>
          </div>
        </div>
      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="mt-4 flex items-center space-x-3 no-print">
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Download className="h-4 w-4 text-emerald-400" />
          <span>Muat Turun QR</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Kad Pelajar</span>
        </button>
      </div>
    </div>
  );
}
