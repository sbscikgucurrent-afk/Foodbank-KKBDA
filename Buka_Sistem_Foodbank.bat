@echo off
title JOM KENYANG - Kolej Komuniti Bandar Darulaman
color 0A
echo ========================================================
echo   JOM KENYANG - Jom Kenyang — Dapur Siswa
echo   Kolej Komuniti Bandar Darulaman (KKBDA)
echo ========================================================
echo.
echo Memulakan Pelayan Web (Next.js Node Server)...
set "PATH=D:\Antigravity\nodejs\node-v20.17.0-win-x64;%PATH%"

cd /d "D:\Antigravity\Foodbank"

start "" "http://localhost:3000"

echo.
echo Pelayan sedang berjalan di http://localhost:3000
echo Jangan tutup tetingkap cmd ini semasa menggunakan sistem.
echo.
node ./node_modules/next/dist/bin/next dev -p 3000
pause
