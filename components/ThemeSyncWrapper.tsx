'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from './ThemeProvider'

export default function ThemeSyncWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const { syncWithUserPreference } = useTheme()

  // Changed: Sync theme preferences when user logs in
  useEffect(() => {
    if (!isLoading && user) {
      syncWithUserPreference(user.color_theme, user.style_theme)
    }
  }, [user, isLoading, syncWithUserPreference])

  return <>{children}</>
}