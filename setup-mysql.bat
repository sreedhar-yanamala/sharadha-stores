@echo off
title Sharadha Stores — MySQL Setup & Migration
color 0A
setlocal EnableDelayedExpansion

echo.
echo  ============================================================
echo   SHARADHA STORES — Automated MySQL Migration
echo  ============================================================
echo.

cd /d "%~dp0flask-backend"

REM ── Find MySQL binary ─────────────────────────────────────────
echo [1/5] Locating MySQL installation...
set MYSQL_BIN=

REM Check PATH first
where mysql.exe >nul 2>&1
if %errorlevel% == 0 (
    set MYSQL_BIN=mysql
    echo  Found MySQL in PATH
    goto :found_mysql
)

REM Check common MySQL 8 install locations
for %%P in (
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
    "C:\Program Files\MySQL\MySQL Server 8.3\bin\mysql.exe"
    "C:\Program Files\MySQL\MySQL Server 8.2\bin\mysql.exe"
    "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe"
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe"
    "C:\xampp\mysql\bin\mysql.exe"
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe"
) do (
    if exist %%P (
        set MYSQL_BIN=%%P
        echo  Found MySQL at: %%P
        goto :found_mysql
    )
)

REM Try to find via registry
for /f "tokens=2*" %%A in ('reg query "HKLM\SOFTWARE\MySQL AB" /s /v Location 2^>nul') do (
    if exist "%%B\bin\mysql.exe" (
        set MYSQL_BIN="%%B\bin\mysql.exe"
        echo  Found MySQL via registry: %%B
        goto :found_mysql
    )
)

echo  MySQL binary not found yet. Checking if service is running...
goto :check_service

:found_mysql
echo.

:check_service
REM ── Start MySQL service if not running ────────────────────────
echo [2/5] Checking MySQL service...
set SERVICE_FOUND=0
for %%S in (MySQL MySQL80 MySQL84 mysql) do (
    sc query %%S >nul 2>&1
    if !errorlevel! == 0 (
        set MYSQL_SERVICE=%%S
        set SERVICE_FOUND=1
        echo  Found service: %%S
        net start %%S >nul 2>&1
        echo  Service started (or was already running)
        goto :service_done
    )
)

if !SERVICE_FOUND! == 0 (
    echo  No MySQL service found. Trying to start MySQL manually...
    REM Try mysqld directly if we have the binary dir
    if defined MYSQL_BIN (
        echo  Attempting direct mysqld start...
    ) else (
        echo.
        echo  ERROR: MySQL does not appear to be installed yet.
        echo  Please wait for the winget installation to complete and re-run this script.
        echo.
        pause
        exit /b 1
    )
)

:service_done
echo.

REM ── Add MySQL to PATH for this session ────────────────────────
if defined MYSQL_BIN (
    for %%F in ("%MYSQL_BIN%") do set MYSQL_DIR=%%~dpF
    set PATH=%MYSQL_DIR%;%PATH%
)

REM ── Install Python packages ───────────────────────────────────
echo [3/5] Installing Python packages...
py -m pip install PyMySQL cryptography flask flask-cors flask-sqlalchemy bcrypt PyJWT python-dotenv --quiet
echo  Packages ready!
echo.

REM ── Get MySQL root password ───────────────────────────────────
echo [4/5] MySQL root password setup...
echo.
echo  IMPORTANT: What is your MySQL root password?
echo  (This was set during MySQL installation)
echo  If you used a blank/empty password, just press ENTER.
echo.
set /p MYSQL_PASS=  Enter MySQL root password: 

REM ── Run full migration script ─────────────────────────────────
echo.
echo [5/5] Running full MySQL migration...
echo.
py full_mysql_setup.py --password "%MYSQL_PASS%"

if %errorlevel% == 0 (
    echo.
    echo  ============================================================
    echo   Migration COMPLETE! Starting Flask server...
    echo  ============================================================
    echo.
    py app.py
) else (
    echo.
    echo  Migration encountered errors. Check output above.
    echo  Common fixes:
    echo    1. Wrong password - re-run this script with correct password
    echo    2. MySQL service not running - check services.msc
    echo    3. Check flask-backend\.env for DATABASE_URL
    echo.
)

pause
