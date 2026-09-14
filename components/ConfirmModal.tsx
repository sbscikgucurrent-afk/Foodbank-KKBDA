'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Sahkan',
  cancelText = 'Batal',
  variant = 'primary',
  loading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  let btnColor = 'bg-emerald-700 hover:bg-emerald-800 text-white';
  let Icon = CheckCircle2;
  let iconColor = 'text-emerald-600 bg-emerald-50';

  if (variant === 'danger') {
    btnColor = 'bg-rose-600 hover:bg-rose-700 text-white';
    Icon = AlertCircle;
    iconColor = 'text-rose-600 bg-rose-50';
  } else if (variant === 'warning') {
    btnColor = 'bg-amber-600 hover:bg-amber-700 text-white';
    Icon = AlertTriangle;
    iconColor = 'text-amber-600 bg-amber-50';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 scale-in-95">
        <div className="flex items-start space-x-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-2 ${btnColor} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading && <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
