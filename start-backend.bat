@echo off
title Sharadha Stores - Backend Server (MySQL)
color 0A
echo.
echo  ============================================================
echo   SHARADHA STORES - Flask Backend Server (MySQL Edition)
echo  ============================================================
echo.

cd /d "%~dp0flask-backend"

echo [1/4] Checking Python installation...
py -3 --version 2>nul
if %errorlevel% neq 0 (
    python --version 2>nul
    if %errorlevel% neq 0 (
        echo ERROR: Python is not installed or not in PATH.
        echo Please install Python 3.8+ from https://python.org
        pause
        exit /b 1
    )
    set PYTHON_CMD=python
) else (
    set PYTHON_CMD=py -3
)
echo  Python found!

echo.
echo [2/4] Installing required packages (including MySQL driver)...
%PYTHON_CMD% -m pip install flask flask-cors flask-sqlalchemy bcrypt PyJWT python-dotenv PyMySQL cryptography --quiet
if %errorlevel% neq 0 (
    echo WARNING: Some packages may not have installed correctly.
)
echo  Packages installed!

echo.
echo [3/4] Testing MySQL connection...
%PYTHON_CMD% test_mysql_connection.py
if %errorlevel% neq 0 (
    echo.
    echo  ATTENTION: MySQL connection test failed!
    echo  ─────────────────────────────────────────────────────────
    echo  To fix this, you need MySQL installed and configured:
    echo.
    echo  STEP 1: Download MySQL Community Server
    echo          https://dev.mysql.com/downloads/installer/
    echo          (Choose "MySQL Installer for Windows")
    echo.
    echo  STEP 2: During installation, set a root password.
    echo          Remember this password!
    echo.
    echo  STEP 3: Open flask-backend\.env and update:
    echo          DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/sharadha_stores
    echo          MYSQL_PASSWORD=YOUR_PASSWORD
    echo.
    echo  STEP 4: Create the database by running:
    echo          mysql -u root -p ^< mysql_setup.sql
    echo.
    echo  STEP 5: Re-run this script.
    echo  ─────────────────────────────────────────────────────────
    echo.
    echo  NOTE: The server cannot start without MySQL database connection.
    echo  Ensure MySQL service is running before continuing.
    echo  Press any key to continue to start the server or Ctrl+C to exit...
    pause >nul
)

echo.
echo [4/4] Starting Flask server on http://localhost:5000 ...
echo.
echo  API Endpoints:
echo    GET  http://localhost:5000/api/health              ^<-- health + DB status
echo    POST http://localhost:5000/api/auth/login          ^<-- login
echo    POST http://localhost:5000/api/auth/register       ^<-- register
echo    GET  http://localhost:5000/api/cart/               ^<-- server cart
echo    GET  http://localhost:5000/api/wishlist/           ^<-- server wishlist
echo    POST http://localhost:5000/api/coupons/validate    ^<-- coupon validation
echo    POST http://localhost:5000/api/contact/            ^<-- contact form
echo    POST http://localhost:5000/api/newsletter/subscribe ^<-- newsletter
echo.
echo  Press Ctrl+C to stop the server.
echo  Keep this window open while using the website!
echo.

%PYTHON_CMD% app.py

echo.
echo Server stopped.
pause
