'use client'

import { Toaster, ToastBar } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-color)',
          borderRadius: '0.5rem',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        success: {
          iconTheme: {
            primary: 'var(--toast-success)',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--toast-error)',
            secondary: 'white',
          },
        },
      }}
    >
      {(t) => (
        <ToastBar
          toast={t}
          style={{
            ...t.style,
            animation: t.visible
              ? 'slideInFromRight 0.2s ease-out forwards'
              : 'slideOutToRight 0.15s ease-in forwards',
          }}
        />
      )}
    </Toaster>
  )
}
