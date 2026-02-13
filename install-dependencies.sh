#!/bin/bash
# ============================================================================
# CHEQUEO DIGITAL 2.0 - Script de Instalación de Dependencias
# Compatible con: Git Bash, Linux, macOS
# ============================================================================

set -e  # Salir si hay error

echo ""
echo "============================================================================"
echo "   CHEQUEO DIGITAL 2.0 - INSTALANDO DEPENDENCIAS"
echo "============================================================================"
echo ""

# Obtener directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js no está instalado"
    echo "   Descargue desde: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✓ Node.js $NODE_VERSION detectado"
echo ""

# Instalar dependencias del Backend
echo "[1/2] Instalando dependencias del Backend..."
cd "$SCRIPT_DIR/backend"

if [ -d "node_modules" ]; then
    echo "   Limpiando instalación anterior..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
fi

npm install
echo "✓ Backend: Dependencias instaladas"
echo ""

# Instalar dependencias del Frontend
echo "[2/2] Instalando dependencias del Frontend..."
cd "$SCRIPT_DIR"

if [ -d "node_modules" ]; then
    echo "   Limpiando instalación anterior..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
fi

npm install --legacy-peer-deps
echo "✓ Frontend: Dependencias instaladas"
echo ""

echo "============================================================================"
echo "   INSTALACIÓN COMPLETADA"
echo "============================================================================"
echo ""
echo "   Nota: Las advertencias sobre Node.js 18 son solo warnings."
echo "   La aplicación funcionará correctamente."
echo ""
echo "   Para iniciar el sistema:"
echo "   - Windows: Doble click en start-chequeo.bat"
echo "   - Linux/Mac: ./start-chequeo.sh (si existe)"
echo "   - Manual: npm run dev (en backend y frontend)"
echo ""
echo "============================================================================"
echo ""

