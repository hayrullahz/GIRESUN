<#
.SYNOPSIS
    ISOMETRIC GIRESUN — PowerShell Baslatici
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "ISOMETRIC GIRESUN - Baslatici"

Set-Location -Path $PSScriptRoot

$Port = 5199
$HostName = "localhost"
$Url = "http://${HostName}:${Port}/"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      ISOMETRIC GIRESUN (3B Izometrik Harita)          " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Port Kontrolü
Write-Host "[1/4] Port $Port kontrol ediliyor..." -ForegroundColor Blue
$listeningConn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if ($listeningConn) {
    $procId = $listeningConn.OwningProcess | Select-Object -First 1
    Write-Host "[!] Port $Port zaten kullanimda (PID: $procId)." -ForegroundColor Yellow
    Write-Host "[*] Eski surec sonlandiriliyor..." -ForegroundColor Yellow
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "[OK] Port serbest birakildi." -ForegroundColor Green
} else {
    Write-Host "[OK] Port $Port musait." -ForegroundColor Green
}
Write-Host ""

# 2. Bağımlılık Kontrolü
Write-Host "[2/4] Bagimliliklar kontrol ediliyor..." -ForegroundColor Blue
if (-not (Test-Path "node_modules\vite")) {
    Write-Host "[!] node_modules veya Vite bulunamadi. 'npm install' calistiriliyor..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[HATA] npm install basarisiz oldu!" -ForegroundColor Red
        Read-Host "Cikmak icin Enter'a basin..."
        exit 1
    }
    Write-Host "[OK] Bagimliliklar kuruldu." -ForegroundColor Green
} else {
    Write-Host "[OK] Bagimliliklar hazir." -ForegroundColor Green
}
Write-Host ""

# 3. Tarayıcıyı Aç
Write-Host "[3/4] Tarayici baslatiliyor: $Url" -ForegroundColor Blue
Start-Process $Url
Write-Host ""

# 4. Vite Sunucusunu Başlat
Write-Host "========================================================" -ForegroundColor Green
Write-Host " [4/4] Sunucu Baslatiliyor..." -ForegroundColor Green
Write-Host " Adres: $Url" -ForegroundColor Cyan
Write-Host " Kapatmak icin bu pencereyi kapatin veya Ctrl + C yapin." -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

npm run dev -- --port $Port --host
