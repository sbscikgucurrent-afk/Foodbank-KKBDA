'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Camera, Search, X, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (studentCodeOrToken: string) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess
}: QRScannerModalProps) {
  const [manualId, setManualId] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [useManual, setUseManual] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isOpen || useManual) {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            scanner.clear();
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // normal per-frame scan failure, ignore
          }
        );

        scannerRef.current = scanner;
      } catch (err: any) {
        console.warn('Camera scanner initialization failed:', err);
        setScanError('Kamera tidak dapat diakses atau peranti tidak menyokong. Sila gunakan carian manual.');
        setUseManual(true);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }
    };
  }, [isOpen, useManual, onScanSuccess]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    onScanSuccess(manualId.trim().toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-700 text-white">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Imbas QR Pelajar</h3>
              <p className="text-[11px] text-slate-400">Halakan kamera ke Kad Pelajar atau skrin telefon</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="p-3 bg-slate-100 flex items-center justify-center space-x-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setUseManual(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
              !useManual ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Kamera Pengimbas</span>
          </button>
          <button
            type="button"
            onClick={() => setUseManual(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
              useManual ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Carian Manual ID</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!useManual ? (
            <div>
              {scanError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}
              <div id="qr-reader-container" className="w-full rounded-xl overflow-hidden border-2 border-dashed border-emerald-300 min-h-[260px] bg-slate-50 flex items-center justify-center"></div>
              <p className="mt-3 text-center text-[11px] text-slate-500">
                Pegang kad pelajar dengan stabil di hadapan kamera.
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <p className="font-semibold">Carian Manual ID Pelajar:</p>
                <p className="mt-0.5 text-[11px] text-amber-700">
                  Gunakan kaedah ini jika kamera tidak berfungsi atau pelajar tidak membawa telefon pintar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masukkan ID Pelajar (Contoh: KKBDA001)
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="Contoh: KKBDA001 / TOKEN-..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm uppercase font-mono font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Sahkan & Semak Pelajar</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
