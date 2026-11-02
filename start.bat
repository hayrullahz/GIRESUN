@echo off
setlocal EnableExtensions EnableDelayedExpansion
title ISOMETRIC GIRESUN - Baslatici

cd /d "%~dp0"

set "PORT=5199"
set "HOST=localhost"
set "URL=http://localhost:5199/"

echo ========================================================
echo       ISOMETRIC GIRESUN (3B Izometrik Harita)
echo ========================================================
echo.

:: 1. PORT KONTROLU
echo [1/4] Port !PORT! kontrol ediliyor...
set "TARGET_PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:":%PORT%  *LISTENING"') do (
    set "TARGET_PID=%%P"
)

if defined TARGET_PID (
    echo [!] Port !PORT! zaten kullanimda (PID: !TARGET_PID!).
    echo [*] Eski surec sonlandiriliyor...
    taskkill /PID !TARGET_PID! /F >nul 2>&1
    timeout /t 1 /nobreak >nul
    echo [OK] Port serbest birakildi.
) else (
    echo [OK] Port !PORT! musait.
)
echo.

:: 2. BAGIMLILIK KONTROLU
echo [2/4] Bagimliliklar kontrol ediliyor...
if not exist "node_modules\vite" (
    echo [!] 'node_modules' veya 'vite' bulunamadi.
    echo [*] 'npm install' calistiriliyor, lutfen bekleyin...
    call npm install
    if errorlevel 1 (
        echo [HATA] npm install basarisiz oldu!
        pause
        exit /b 1
    )
    echo [OK] Bagimliliklar basariyla kuruldu.
) else (
    echo [OK] Bagimliliklar hazir.
)
echo.

:: 3. TARAYICIYI AC
echo [3/4] Tarayici baslatiliyor: !URL!
start "" "!URL!"
echo.

:: 4. VITE DEV SUNUCUSU
echo ========================================================
echo  [4/4] Sunucu Baslatiliyor...
echo  Adres: !URL!
echo  Kapatmak icin bu pencereyi kapatin veya Ctrl + C yapin.
echo ========================================================
echo.

call npm run dev -- --port %PORT% --host

pause
