"use client"

import { useEffect } from 'react'

/**
 * Componente para registrar el Service Worker
 * Mejora el rendimiento cacheando APIs de rechequeos en el navegador
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Solo registrar en producción y si el navegador lo soporta
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration.scope)
          
          // Detectar actualizaciones del SW
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New Service Worker available. Refresh to update.')
                  // Opcional: Mostrar notificación al usuario
                  if (confirm('Hay una nueva versión disponible. ¿Recargar?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error)
        })
      
      // Limpiar SW cuando no esté en rechequeos (opcional)
      return () => {
        // No hacer nada, dejar el SW activo
      }
    } else {
      console.log('ℹ️ Service Worker not supported or not in production')
    }
  }, [])

  return null // No renderiza nada
}

