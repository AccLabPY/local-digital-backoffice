@echo off
REM ============================================================================
REM CHEQUEO DIGITAL 2.0 - DETENER SISTEMA
REM ============================================================================
REM Este script detiene todos los procesos de Node.js relacionados
REM ============================================================================

title Chequeo Digital 2.0 - Deteniendo...

echo.
echo ============================================================================
echo    CHEQUEO DIGITAL 2.0 - DETENIENDO SISTEMA
echo ============================================================================
echo.

echo Deteniendo procesos de Node.js...

REM Matar procesos de node que esten corriendo en puertos 3000 y 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo   Deteniendo proceso en puerto 3000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo   Deteniendo proceso en puerto 3001 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo ============================================================================
echo    SISTEMA DETENIDO
echo ============================================================================
echo.

timeout /t 2 /nobreak >nul

