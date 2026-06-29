@echo off
title Sharadha Stores - Full Stack Server (MySQL)
color 0A
echo.
echo  ============================================================
echo   SHARADHA STORES - Flask Backend + React Frontend
echo   Database: MySQL (sharadha_stores)
echo  ============================================================
echo.

REM ── Check Python ───────────────────────────────────────────────
echo [CHECK] Verifying Python installation...
py --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Python is not installed!
    echo  Please download and install it from: https://python.org
    echo.
    pause
    exit /b 1
)
echo  Python found:
py --version

REM ── Check Node.js ─────────────────────────────────────────────
echo.
echo [CHECK] Verifying Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js is not installed!
    echo  Please download and install it from: https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo  Node.js found:
node --version

REM ── Install Flask dependencies (MySQL edition) ─────────────────
echo.
echo [SETUP] Installing Flask backend dependencies (MySQL driver included)...
cd /d "%~dp0flask-backend"
py -m pip install -r requirements.txt --quiet
cd /d "%~dp0"

REM ── Start MySQL Database ──────────────────────────────────────
echo.
echo [0/3] Starting Local MySQL Server...
echo.
set MYSQLD_BIN="C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"
if exist %MYSQLD_BIN% (
    start "Sharadha Local MySQL" /min %MYSQLD_BIN% --datadir="%~dp0mysql-data" --port=3306 --shared-memory
    timeout /t 3 /nobreak >nul
    echo  MySQL Server started!
) else (
    echo  WARNING: Local MySQL executable not found. Ensuring service is running...
)

REM ── Start Flask Backend ───────────────────────────────────────
echo.
echo [1/3] Starting Flask Backend (MySQL) on port 5000...
echo.
start "Sharadha Flask Backend (MySQL)" cmd /k "cd /d "%~dp0flask-backend" && echo Starting Flask backend with MySQL... && py app.py"

REM Wait for Flask to initialize
timeout /t 5 /nobreak >nul

REM ── Start Frontend ────────────────────────────────────────────
echo [2/3] Starting Frontend (React + Vite) on port 5173...
echo.
start "Sharadha Frontend" cmd /k "cd /d "%~dp0frontend" && echo Starting frontend... && npm run dev"

REM Wait then open browser
timeout /t 4 /nobreak >nul

echo.
echo  ============================================================
echo   Both servers are starting in separate windows!
echo  ============================================================
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo   API Base:  http://localhost:5000/api
echo.
echo   Database:  MySQL (sharadha_stores @ localhost:3306)
echo.
echo   New API Endpoints:
echo     GET/POST http://localhost:5000/api/cart/
echo     GET/POST http://localhost:5000/api/wishlist/
echo     POST     http://localhost:5000/api/coupons/validate
echo     POST     http://localhost:5000/api/contact/
echo     POST     http://localhost:5000/api/newsletter/subscribe
echo.
echo   MySQL NOT installed? Run start-backend.bat for setup guide.
echo   Close the two server windows to stop the servers.
echo  ============================================================
echo.

REM Open browser
start http://localhost:5173

pause
