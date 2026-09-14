'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Search, 
  Calendar, 
  Clock, 
  HeartHandshake, 
  ArrowDownToLine, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { id as msLocale } from 'date-fns/locale';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
}

export default function Header({ 
  title = 'JOM KENYANG', 
  subtitle = 'Jom Kenyang — Dapur Siswa',
  userName = 'Admin',
  userRole = 'superadmin'
}: HeaderProps) {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);

    // Fetch notifications
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter((n: any) => n.status === 'UNREAD').length);
        }
      })
      .catch(() => {});

    return () => clearInterval(timer);
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'POST' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
    } catch (e) {}
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-6 py-3.5 flex items-center justify-between">
        {/* Left: Title & Malaysian Context */}
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                KKBDA
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {subtitle} • Kolej Komuniti Bandar Darulaman
            </p>
          </div>
        </div>

        {/* Center/Right: Date & Time in Malaysian Format */}
        <div className="hidden md:flex items-center space-x-6 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="flex items-center space-x-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {currentDateTime ? format(currentDateTime, 'dd MMMM yyyy', { locale: msLocale }) : '02 September 2026'}
            </span>
          </div>
          <div className="h-3 w-px bg-slate-300"></div>
          <div className="flex items-center space-x-1.5 font-mono text-slate-700">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {currentDateTime ? format(currentDateTime, 'hh:mm:ss a') : '12:00:00 PM'}
            </span>
          </div>
        </div>

        {/* Right: Quick Actions & Notifications */}
        <div className="flex items-center space-x-2.5">
          {/* Quick Action: Pengambilan Makanan */}
          {userRole !== 'student' && (
            <Link
              href="/pengambilan"
              className="hidden lg:flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all"
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Pengambilan Makanan</span>
            </Link>
          )}

          {/* Quick Action: Stock In */}
          {userRole !== 'student' && (
            <Link
              href="/stock/in"
              className="hidden sm:flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all"
            >
              <ArrowDownToLine className="h-4 w-4" />
              <span>Stock In</span>
            </Link>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Pemberitahuan Sistem"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse ring-2 ring-white"></span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">Pemberitahuan Sistem</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-emerald-400 hover:underline font-medium"
                      >
                        Tanda Semua Dibaca
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Tiada pemberitahuan baharu.
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <div 
                        key={n.id || Math.random()} 
                        className={`p-3 text-xs transition-colors ${n.status === 'UNREAD' ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-start space-x-2.5">
                          {n.type === 'CRITICAL_STOCK' || n.type === 'EXPIRED' ? (
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          ) : n.type === 'EXPIRING_SOON' || n.type === 'LOW_STOCK' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{n.title || 'Notifikasi'}</p>
                            <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message || ''}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {n.created_at || ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
