'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  SlidersHorizontal, 
  History, 
  QrCode, 
  AlertTriangle, 
  FileText, 
  BarChart3, 
  UserCog, 
  ShieldCheck, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  LogOut,
  UtensilsCrossed,
  HeartHandshake
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface SidebarProps {
  userRole?: UserRole;
  userName?: string;
  onLogout?: () => void;
}

export default function Sidebar({ userRole = 'superadmin', userName = 'Admin', onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [stockOpen, setStockOpen] = useState(pathname?.startsWith('/stock') || false);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.href = '/login';
  };

  const isStudent = userRole === 'student';

  if (isStudent) {
    return (
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-slate-800 shadow-xl">
        <div className="p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/40">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">JOM KENYANG</h1>
              <p className="text-[11px] text-emerald-400 font-medium">Portal Pelajar</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Kolej Komuniti Bandar Darulaman
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link
            href="/student"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === '/student'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard Pelajar</span>
          </Link>

          <Link
            href="/student/qr"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === '/student/qr'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>My QR Code</span>
          </Link>

          <Link
            href="/student/history"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname === '/student/history'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Sejarah Pengambilan</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-emerald-900/70 text-emerald-300 rounded-full border border-emerald-700/50">
                Pelajar KKBDA
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Keluar</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-slate-800 shadow-xl">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-950">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">JOM KENYANG</h1>
            <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Dapur Siswa KKBDA</p>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>KKBDA • UAPP</span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">v1.0</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/dashboard'
              ? 'bg-emerald-700 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 text-emerald-400" />
          <span>Dashboard</span>
        </Link>

        {/* Pelajar */}
        <Link
          href="/pelajar"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname?.startsWith('/pelajar')
              ? 'bg-emerald-700 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4 text-blue-400" />
          <span>Pelajar</span>
        </Link>

        {/* Food Inventory */}
        <Link
          href="/inventory"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/inventory'
              ? 'bg-emerald-700 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Package className="h-4 w-4 text-amber-400" />
          <span>Food Inventory</span>
        </Link>

        {/* Stock Management (Collapsible) */}
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => setStockOpen(!stockOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-3">
              <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
              <span>Stock Management</span>
            </div>
            {stockOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
          </button>

          {stockOpen && (
            <div className="pl-6 space-y-0.5 pt-0.5 border-l-2 border-slate-800 ml-3">
              <Link
                href="/stock/in"
                className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === '/stock/in' ? 'bg-emerald-700/80 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-400" />
                <span>Stock In & Edit Stok</span>
              </Link>
              <Link
                href="/stock/out"
                className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === '/stock/out' ? 'bg-emerald-700/80 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <ArrowUpFromLine className="h-3.5 w-3.5 text-rose-400" />
                <span>Stock Out</span>
              </Link>
              <Link
                href="/stock/adjustment"
                className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === '/stock/adjustment' ? 'bg-emerald-700/80 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                <span>Stock Adjustment</span>
              </Link>
              <Link
                href="/stock/ledger"
                className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === '/stock/ledger' ? 'bg-emerald-700/80 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <History className="h-3.5 w-3.5 text-cyan-400" />
                <span>Transaction History</span>
              </Link>
            </div>
          )}
        </div>

        {/* Pengambilan Makanan */}
        <Link
          href="/pengambilan"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname?.startsWith('/pengambilan')
              ? 'bg-amber-600 text-white font-semibold shadow-md shadow-amber-950'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <HeartHandshake className="h-4 w-4 text-amber-300" />
          <span className="font-semibold">Pengambilan Makanan</span>
        </Link>

        {/* Expiry Monitoring */}
        <Link
          href="/expiry"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/expiry'
              ? 'bg-emerald-700 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <span>Expiry Monitoring</span>
        </Link>

        {/* Reports */}
        <Link
          href="/reports"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/reports'
              ? 'bg-emerald-700 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4 text-teal-400" />
          <span>Reports</span>
        </Link>

        {/* Analytics */}
        <Link
          href="/analytics"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/analytics'
              ? 'bg-emerald-700 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4 text-violet-400" />
          <span>Analytics</span>
        </Link>

        {/* Users (All Admin Roles) */}
        <Link
          href="/users"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/users'
              ? 'bg-emerald-700 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <UserCog className="h-4 w-4 text-rose-400" />
          <span>Pengurusan Pengguna (Users)</span>
        </Link>

        {/* Audit Logs */}
        <Link
          href="/audit-logs"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/audit-logs'
              ? 'bg-emerald-700 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Audit Logs</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-emerald-700 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4 text-slate-400" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <span className="inline-block px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-900/80 text-emerald-300 rounded border border-emerald-700/50 uppercase tracking-wider">
              {userRole === 'superadmin' ? 'Super Admin' : userRole === 'uappadmin' ? 'Admin UAPP' : 'Operator'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800/80 hover:bg-red-950/60 hover:text-red-300 text-slate-300 border border-slate-700/60 hover:border-red-800 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Keluar</span>
        </button>
      </div>
    </aside>
  );
}
