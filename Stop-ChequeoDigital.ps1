# ============================================================================
# CHEQUEO DIGITAL 2.0 - SCRIPT DE DETENCIÓN (PowerShell)
# ============================================================================

param(
    [int]$BackendPort = 3001,
    [int]$FrontendPort = 3000
)

$Host.UI.RawUI.WindowTitle = "Chequeo Digital 2.0 - Deteniendo"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Yellow
Write-Host "   CHEQUEO DIGITAL 2.0 - DETENIENDO SISTEMA" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Yellow
Write-Host ""

# Detener proceso en puerto del backend
$backendConn = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
if ($backendConn) {
    $backendPid = $backendConn.OwningProcess | Select-Object -First 1
    Write-Host "  → Deteniendo Backend (PID: $backendPid)..." -ForegroundColor Yellow
    Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Backend detenido" -ForegroundColor Green
} else {
    Write-Host "  - Backend no estaba corriendo" -ForegroundColor Gray
}

# Detener proceso en puerto del frontend
$frontendConn = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue
if ($frontendConn) {
    $frontendPid = $frontendConn.OwningProcess | Select-Object -First 1
    Write-Host "  → Deteniendo Frontend (PID: $frontendPid)..." -ForegroundColor Yellow
    Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Frontend detenido" -ForegroundColor Green
} else {
    Write-Host "  - Frontend no estaba corriendo" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "   SISTEMA DETENIDO" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 2

