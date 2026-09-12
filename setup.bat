@echo off
set "PATH=D:\Antigravity\nodejs\node-v20.17.0-win-x64;%PATH%"
cd /d "D:\Antigravity\Foodbank"
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del /f /q "package-lock.json"
call npm install --no-fund --no-audit
