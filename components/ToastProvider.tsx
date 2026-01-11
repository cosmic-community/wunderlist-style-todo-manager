'use client'

import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
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
    />
  )
}
