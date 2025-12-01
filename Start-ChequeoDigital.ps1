# ============================================================================
# CHEQUEO DIGITAL 2.0 - SCRIPT DE INICIO (PowerShell)
# ============================================================================
# Uso: Click derecho -> "Ejecutar con PowerShell"
# O desde terminal: .\Start-ChequeoDigital.ps1
# ============================================================================

param(
    [switch]$NoBrowser,      # No abrir navegador automáticamente
    [switch]$Production,     # Modo producción (npm start en lugar de npm run dev)
    [int]$BackendPort = 3001,
    [int]$FrontendPort = 3000
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Chequeo Digital 2.0"

# Colores
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) { Write-Output $args }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Header {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host "   CHEQUEO DIGITAL 2.0 - INICIANDO SISTEMA" -ForegroundColor Cyan
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success($message) {
    Write-Host "  ✓ $message" -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host "  → $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "  ✗ $message" -ForegroundColor Red
}

# Obtener directorio del script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Header

# ============================================================================
# PASO 1: Verificar Node.js
# ============================================================================
Write-Host "[1/5] Verificando requisitos..." -ForegroundColor White

try {
    $nodeVersion = node --version
    Write-Success "Node.js $nodeVersion instalado"
} catch {
    Write-Error "Node.js no está instalado"
    Write-Host "       Descargue desde: https://nodejs.org" -ForegroundColor Gray
    Read-Host "Presione Enter para salir"
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Success "npm v$npmVersion instalado"
} catch {
    Write-Error "npm no está disponible"
    exit 1
}

# ============================================================================
# PASO 2: Verificar dependencias
# ============================================================================
Write-Host ""
Write-Host "[2/5] Verificando dependencias..." -ForegroundColor White

# Backend
if (-not (Test-Path "$ScriptDir\backend\node_modules")) {
    Write-Info "Instalando dependencias del backend..."
    Set-Location "$ScriptDir\backend"
    npm install --silent
    Set-Location $ScriptDir
}
Write-Success "Dependencias del backend OK"

# Frontend
if (-not (Test-Path "$ScriptDir\node_modules")) {
    Write-Info "Instalando dependencias del frontend..."
    npm install --silent
}
Write-Success "Dependencias del frontend OK"

# ============================================================================
# PASO 3: Verificar configuración
# ============================================================================
Write-Host ""
Write-Host "[3/5] Verificando configuración..." -ForegroundColor White

$envPath = "$ScriptDir\backend\.env"
if (-not (Test-Path $envPath)) {
    $templatePath = "$ScriptDir\backend\env.template"
    if (Test-Path $templatePath) {
        Copy-Item $templatePath $envPath
        Write-Info "Archivo .env creado desde plantilla"
        Write-Host "       IMPORTANTE: Configure las credenciales de BD en backend\.env" -ForegroundColor Yellow
    } else {
        Write-Error "No se encontró env.template"
    }
} else {
    Write-Success "Configuración .env encontrada"
}

# ============================================================================
# PASO 4: Iniciar servicios
# ============================================================================
Write-Host ""
Write-Host "[4/5] Iniciando servicios..." -ForegroundColor White

# Detener procesos existentes en los puertos
$existingBackend = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
if ($existingBackend) {
    Write-Info "Deteniendo proceso existente en puerto $BackendPort..."
    Stop-Process -Id (Get-Process -Id $existingBackend.OwningProcess).Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

$existingFrontend = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue
if ($existingFrontend) {
    Write-Info "Deteniendo proceso existente en puerto $FrontendPort..."
    Stop-Process -Id (Get-Process -Id $existingFrontend.OwningProcess).Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Comando según modo
if ($Production) {
    $backendCmd = "npm start"
    $frontendCmd = "npm start"
} else {
    $backendCmd = "npm run dev"
    $frontendCmd = "npm run dev"
}

# Iniciar Backend
Write-Info "Iniciando Backend en puerto $BackendPort..."
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend'; $backendCmd" -WindowStyle Minimized -PassThru
Write-Success "Backend iniciado (PID: $($backendProcess.Id))"

# Esperar a que el backend esté listo
Write-Info "Esperando a que el backend esté listo..."
$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 1
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$BackendPort/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend respondiendo correctamente"
            break
        }
    } catch {
        # Continuar esperando
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Info "Backend aún iniciando (puede tomar más tiempo la primera vez)"
}

# Iniciar Frontend
Write-Info "Iniciando Frontend en puerto $FrontendPort..."
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir'; $frontendCmd" -WindowStyle Minimized -PassThru
Write-Success "Frontend iniciado (PID: $($frontendProcess.Id))"

# Esperar a que el frontend compile
Write-Info "Esperando compilación del frontend..."
Start-Sleep -Seconds 8

# ============================================================================
# PASO 5: Abrir navegador
# ============================================================================
Write-Host ""
Write-Host "[5/5] Finalizando..." -ForegroundColor White

if (-not $NoBrowser) {
    Write-Info "Abriendo navegador..."
    Start-Process "http://localhost:$FrontendPort"
    Write-Success "Navegador abierto"
}

# ============================================================================
# RESUMEN
# ============================================================================
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "   SISTEMA INICIADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend: http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "   Backend:  http://localhost:$BackendPort" -ForegroundColor White
Write-Host ""
Write-Host "   Credenciales por defecto:" -ForegroundColor Gray
Write-Host "   - Email: admin@chequeo.gov.py" -ForegroundColor Gray
Write-Host "   - Password: password123" -ForegroundColor Gray
Write-Host ""
Write-Host "   Para detener: Ejecute Stop-ChequeoDigital.ps1" -ForegroundColor Yellow
Write-Host "   O cierre las ventanas de PowerShell minimizadas" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""

# Mantener ventana abierta
Read-Host "Presione Enter para cerrar esta ventana (los servicios seguirán corriendo)"

