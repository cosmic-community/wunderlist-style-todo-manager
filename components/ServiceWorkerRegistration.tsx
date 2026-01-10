'use client'

import { useEffect, useState } from 'react'

export default function ServiceWorkerRegistration() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker after page load
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered successfully:', registration.scope)

            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 60 * 60 * 1000) // Check every hour

            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, show update banner
                    console.log('[PWA] New content available, showing update banner')
                    setWaitingWorker(newWorker)
                    setShowUpdateBanner(true)
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  const handleReload = () => {
    if (waitingWorker) {
      // Tell the waiting service worker to activate immediately
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      
      // Listen for the controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page to get the new content
        window.location.reload()
      })
    }
  }

  const handleDismiss = () => {
    setShowUpdateBanner(false)
  }

  if (!showUpdateBanner) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md mx-4 flex items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-sm">New version available!</p>
          <p className="text-xs text-blue-100 mt-0.5">Update now to get the latest features</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors px-3 py-1.5 text-sm"
            aria-label="Dismiss update notification"
          >
            Later
          </button>
          <button
            onClick={handleReload}
            className="bg-white text-blue-600 hover:bg-blue-50 transition-colors px-4 py-1.5 rounded-md font-medium text-sm"
            aria-label="Reload to update"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  )
}