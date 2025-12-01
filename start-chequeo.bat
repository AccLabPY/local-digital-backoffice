@echo off
REM ============================================================================
REM CHEQUEO DIGITAL 2.0 - INICIO RÁPIDO
REM ============================================================================
REM Este script inicia el backend y frontend automáticamente
REM y abre el navegador en http://localhost:3000
REM ============================================================================

title Chequeo Digital 2.0 - Iniciando...

echo.
echo ============================================================================
echo    CHEQUEO DIGITAL 2.0 - INICIANDO SISTEMA
echo ============================================================================
echo.

REM Obtener directorio actual del script
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [1/4] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js no esta instalado o no esta en el PATH
    echo Por favor instale Node.js desde https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo       Node.js %NODE_VERSION% detectado

echo.
echo [2/4] Iniciando Backend (puerto 3001)...
cd /d "%SCRIPT_DIR%backend"

REM Verificar si existe .env
if not exist ".env" (
    echo       ADVERTENCIA: Archivo .env no encontrado
    echo       Copiando desde env.template...
    if exist "env.template" (
        copy env.template .env >nul
        echo       Archivo .env creado. Por favor configure las credenciales de BD.
    ) else (
        echo       ERROR: No se encontro env.template
    )
)

REM Iniciar backend en nueva ventana minimizada
start "Chequeo Backend" /min cmd /c "cd /d "%SCRIPT_DIR%backend" && npm run dev"
echo       Backend iniciando...

REM Esperar 3 segundos para que el backend inicie
timeout /t 3 /nobreak >nul

echo.
echo [3/4] Iniciando Frontend (puerto 3000)...
cd /d "%SCRIPT_DIR%"

REM Iniciar frontend en nueva ventana minimizada
start "Chequeo Frontend" /min cmd /c "cd /d "%SCRIPT_DIR%" && npm run dev"
echo       Frontend iniciando...

REM Esperar 5 segundos para que el frontend compile
echo.
echo       Esperando a que el frontend compile...
timeout /t 8 /nobreak >nul

echo.
echo [4/4] Abriendo navegador...
start "" "http://localhost:3000"

echo.
echo ============================================================================
echo    SISTEMA INICIADO EXITOSAMENTE
echo ============================================================================
echo.
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo.
echo    Credenciales por defecto:
echo    - Email: admin@chequeo.gov.py
echo    - Password: password123
echo.
echo    Para detener el sistema, cierre las ventanas de terminal
echo    o presione Ctrl+C en cada una.
echo.
echo ============================================================================
echo.

REM Mantener esta ventana abierta para ver el estado
echo Presione cualquier tecla para cerrar esta ventana...
pause >nul

