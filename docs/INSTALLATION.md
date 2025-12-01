# Guía de Instalación - Business Innovation Viewer

Esta guía te ayudará a configurar el proyecto **Business Innovation Viewer** en tu entorno local.

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18.0 o superior)
- **npm** (viene incluido con Node.js) o **yarn** como gestor de paquetes
- **Git** para clonar el repositorio

### Verificar instalaciones

\`\`\`bash
node --version  # Debe mostrar v18.0.0 o superior
npm --version   # Debe mostrar 9.0.0 o superior
git --version   # Cualquier versión reciente
\`\`\`

## Instalación Paso a Paso

### 1. Clonar el Repositorio

\`\`\`bash
git clone <URL_DEL_REPOSITORIO>
cd business-innovation-viewer
\`\`\`

### 2. Instalar Dependencias

#### Opción A: Usando npm (Recomendado)

\`\`\`bash
# **IMPORTANTE:** Antes de instalar, asegúrate de que tu package.json tenga las siguientes líneas:
# "react": "18.2.0",
# "react-dom": "18.2.0",
# "@types/react": "18.2.0",
# "@types/react-dom": "18.2.0",
# Y que NO tenga "@radix-ui/react-sheet" (ya no existe)

# 1. Limpia la caché de npm
npm cache clean --force

# 2. Elimina node_modules y package-lock.json para asegurar una instalación limpia
rm -rf node_modules package-lock.json

# 3. Instala todas las dependencias del proyecto
npm install

# O instalar dependencias específicas una por una (opcional)
# Después de limpiar la caché y eliminar node_modules/package-lock.json
npm install next@^14.0.0 react@18.2.0 react-dom@18.2.0
npm install react-router-dom@^6.20.0
npm install recharts@^2.8.0
npm install lucide-react@^0.294.0
npm install @radix-ui/react-accordion@^1.1.2 @radix-ui/react-alert-dialog@^1.0.5
npm install @radix-ui/react-avatar@^1.0.4 @radix-ui/react-checkbox@^1.0.4
npm install @radix-ui/react-collapsible@^1.0.3 @radix-ui/react-dialog@^1.0.5
npm install @radix-ui/react-dropdown-menu@^2.0.6 @radix-ui/react-hover-card@^1.0.7
npm install @radix-ui/react-label@^2.0.2 @radix-ui/react-menubar@^1.0.4
npm install @radix-ui/react-navigation-menu@^1.1.4 @radix-ui/react-popover@^1.0.7
npm install @radix-ui/react-progress@^1.0.3 @radix-ui/react-radio-group@^1.1.3
npm install @radix-ui/react-scroll-area@^1.0.5 @radix-ui/react-select@^2.0.0
npm install @radix-ui/react-separator@^1.0.3 @radix-ui/react-slot@^1.0.2
npm install @radix-ui/react-switch@^1.0.3 @radix-ui/react-tabs@^1.0.4
npm install @radix-ui/react-toast@^1.1.5 @radix-ui/react-toggle@^1.0.3
npm install @radix-ui/react-toggle-group@^1.0.4 @radix-ui/react-tooltip@^1.0.7
npm install class-variance-authority@^0.7.0 clsx@^2.0.0
npm install tailwind-merge@^2.0.0 tailwindcss-animate@^1.0.7

# Instalar dependencias de desarrollo
npm install --save-dev @types/node@^20.0.0 @types/react@18.2.0
npm install --save-dev @types/react-dom@18.2.0 autoprefixer@^10.0.1
npm install --save-dev eslint@^8.0.0 eslint-config-next@^14.0.0
npm install --save-dev postcss@^8.0.0 tailwindcss@^3.3.0 typescript@^5.0.0
\`\`\`

#### Opción B: Usando yarn

\`\`\`bash
# **IMPORTANTE:** Antes de instalar, asegúrate de que tu package.json tenga las siguientes líneas:
# "react": "18.2.0",
# "react-dom": "18.2.0",
# "@types/react": "18.2.0",
# "@types/react-dom": "18.2.0",
# Y que NO tenga "@radix-ui/react-sheet" (ya no existe)

# 1. Limpia la caché de yarn (si aplica)
yarn cache clean

# 2. Elimina node_modules y yarn.lock para asegurar una instalación limpia
rm -rf node_modules yarn.lock

# 3. Instala todas las dependencias del proyecto
yarn install

# O instalar dependencias específicas
yarn add next@^14.0.0 react@18.2.0 react-dom@18.2.0
yarn add react-router-dom@^6.20.0 recharts@^2.8.0 lucide-react@^0.294.0
# ... (continuar con el resto de dependencias, EXCLUYENDO @radix-ui/react-sheet)

# Instalar dependencias de desarrollo
yarn add -D @types/node@^20.0.0 @types/react@18.2.0 @types/react-dom@18.2.0
yarn add -D autoprefixer@^10.0.1 eslint@^8.0.0 eslint-config-next@^14.0.0
yarn add -D postcss@^8.0.0 tailwindcss@^3.3.0 typescript@^5.0.0
\`\`\`

### 3. Instalación Rápida con Script

También puedes usar este script para instalar todas las dependencias de una vez. **Asegúrate de que tu `package.json` ya esté actualizado con las versiones `18.2.0` de React y SIN `@radix-ui/react-sheet` antes de ejecutar este script.**

\`\`\`bash
# Crear un script de instalación
cat > install-deps.sh << 'EOF'
#!/bin/bash
echo "🚀 Instalando dependencias del Business Innovation Viewer..."

# 1. Limpia la caché de npm
npm cache clean --force

# 2. Elimina node_modules y package-lock.json para asegurar una instalación limpia
rm -rf node_modules package-lock.json

# Dependencias principales
npm install next@^14.0.0 react@18.2.0 react-dom@18.2.0 react-router-dom@^6.20.0 recharts@^2.8.0 lucide-react@^0.294.0

# Radix UI Components (SIN react-sheet que ya no existe)
npm install @radix-ui/react-accordion@^1.1.2 @radix-ui/react-alert-dialog@^1.0.5 @radix-ui/react-avatar@^1.0.4 @radix-ui/react-checkbox@^1.0.4 @radix-ui/react-collapsible@^1.0.3 @radix-ui/react-dialog@^1.0.5 @radix-ui/react-dropdown-menu@^2.0.6 @radix-ui/react-hover-card@^1.0.7 @radix-ui/react-label@^2.0.2 @radix-ui/react-menubar@^1.0.4 @radix-ui/react-navigation-menu@^1.1.4 @radix-ui/react-popover@^1.0.7 @radix-ui/react-progress@^1.0.3 @radix-ui/react-radio-group@^1.1.3 @radix-ui/react-scroll-area@^1.0.5 @radix-ui/react-select@^2.0.0 @radix-ui/react-separator@^1.0.3 @radix-ui/react-slot@^1.0.2 @radix-ui/react-switch@^1.0.3 @radix-ui/react-tabs@^1.0.4 @radix-ui/react-toast@^1.1.5 @radix-ui/react-toggle@^1.0.3 @radix-ui/react-toggle-group@^1.0.4 @radix-ui/react-tooltip@^1.0.7

# Utilidades de CSS
npm install class-variance-authority@^0.7.0 clsx@^2.0.0 tailwind-merge@^2.0.0 tailwindcss-animate@^1.0.7

# Dependencias de desarrollo
npm install --save-dev @types/node@^20.0.0 @types/react@18.2.0 @types/react-dom@18.2.0 autoprefixer@^10.0.1 eslint@^8.0.0 eslint-config-next@^14.0.0 postcss@^8.0.0 tailwindcss@^3.3.0 typescript@^5.0.0

echo "✅ ¡Instalación completada!"
echo "🎯 Ejecuta 'npm run dev' para iniciar el servidor de desarrollo"
EOF

# Hacer el script ejecutable y ejecutarlo
chmod +x install-deps.sh
./install-deps.sh
\`\`\`

### 4. Verificar la Instalación

\`\`\`bash
# Verificar que todas las dependencias se instalaron correctamente
npm list --depth=0

# Verificar que no hay vulnerabilidades críticas
npm audit

# Ejecutar verificación de tipos TypeScript
npm run type-check
\`\`\`

## Ejecutar el Proyecto

### Modo Desarrollo

\`\`\`bash
npm run dev
# o
yarn dev
\`\`\`

El proyecto estará disponible en: `http://localhost:3000`

### Modo Producción

\`\`\`bash
# Construir el proyecto
npm run build

# Iniciar en modo producción
npm run start
\`\`\`

### Otros Comandos Útiles

\`\`\`bash
# Ejecutar linter
npm run lint

# Verificar tipos TypeScript
npm run type-check
\`\`\`

## Estructura del Proyecto

\`\`\`
business-innovation-viewer/
├── app/                    # App Router de Next.js
├── components/            # Componentes React reutilizables
│   ├── ui/               # Componentes de UI (shadcn/ui)
│   └── pages/            # Componentes de páginas
├── public/               # Archivos estáticos
├── styles/               # Archivos de estilos
├── package.json          # Dependencias y scripts
├── tailwind.config.ts    # Configuración de Tailwind CSS
├── tsconfig.json         # Configuración de TypeScript
└── next.config.mjs       # Configuración de Next.js
\`\`\`

## Notas Importantes sobre Radix UI

### Cambios en @radix-ui/react-sheet

**IMPORTANTE:** `@radix-ui/react-sheet` ya no existe como paquete independiente. Hemos incluido un componente Sheet personalizado en `components/ui/sheet.tsx` que está basado en `@radix-ui/react-dialog` y sigue las mejores prácticas de la comunidad.

Si necesitas usar el componente Sheet en tu código, simplemente importa:

\`\`\`tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
\`\`\`

## Solución de Problemas Comunes

### Error: "Module not found"

\`\`\`bash
# Limpiar caché de npm y reinstalar
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Error de versiones de Node.js

\`\`\`bash
# Usar nvm para cambiar a la versión correcta
nvm install 18
nvm use 18
\`\`\`

### Problemas con TypeScript

\`\`\`bash
# Reinstalar tipos de TypeScript
npm install --save-dev @types/node @types/react @types/react-dom
\`\`\`

### Error de permisos (macOS/Linux)

\`\`\`bash
# Usar sudo solo si es necesario
sudo npm install -g npm@latest
\`\`\`

## Variables de Entorno (Opcional)

Si el proyecto requiere variables de entorno, crea un archivo `.env.local`:

\`\`\`bash
# Crear archivo de variables de entorno
cp .env.example .env.local
# Editar con tus valores específicos
\`\`\`

## Soporte

Si encuentras problemas durante la instalación:

1. Verifica que tienes las versiones correctas de Node.js y npm
2. Limpia la caché: `npm cache clean --force`
3. Elimina `node_modules` y reinstala: `rm -rf node_modules && npm install`
4. Consulta la documentación oficial de Next.js: https://nextjs.org/docs

---

¡Listo! Ya tienes el proyecto **Business Innovation Viewer** configurado y funcionando en tu entorno local. 🎉
