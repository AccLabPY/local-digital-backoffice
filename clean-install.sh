#!/bin/bash
# ============================================================================
# CHEQUEO DIGITAL 2.0 - Limpiar e Instalar Dependencias
# Compatible con: Git Bash, Linux, macOS
# ============================================================================

set -e

echo ""
echo "============================================================================"
echo "   CHEQUEO DIGITAL 2.0 - LIMPIAR E INSTALAR"
echo "============================================================================"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Limpiar Backend
echo "[1/3] Limpiando Backend..."
cd "$SCRIPT_DIR/backend"
if [ -d "node_modules" ]; then
    echo "   Eliminando node_modules..."
    rm -rf node_modules
fi
if [ -f "package-lock.json" ]; then
    echo "   Eliminando package-lock.json..."
    rm -f package-lock.json
fi
echo "✓ Backend limpiado"
echo ""

# Limpiar Frontend
echo "[2/3] Limpiando Frontend..."
cd "$SCRIPT_DIR"
if [ -d "node_modules" ]; then
    echo "   Eliminando node_modules..."
    rm -rf node_modules
fi
if [ -f "package-lock.json" ]; then
    echo "   Eliminando package-lock.json..."
    rm -f package-lock.json
fi
echo "✓ Frontend limpiado"
echo ""

# Instalar
echo "[3/3] Instalando dependencias..."
cd "$SCRIPT_DIR/backend"
npm install
echo "✓ Backend instalado"
echo ""

cd "$SCRIPT_DIR"
npm install --legacy-peer-deps
echo "✓ Frontend instalado"
echo ""

echo "============================================================================"
echo "   INSTALACIÓN COMPLETADA"
echo "============================================================================"
echo ""

