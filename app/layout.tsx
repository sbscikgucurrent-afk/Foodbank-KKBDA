import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JOM KENYANG — Sistem Dapur Siswa KKBDA',
  description: 'Sistem Pengurusan Digital Jom Kenyang, Kolej Komuniti Bandar Darulaman (KKBDA)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
