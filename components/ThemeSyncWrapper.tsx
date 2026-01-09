'use client'

import { useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from './ThemeProvider'

// Changed: Made children prop required and properly typed
interface ThemeSyncWrapperProps {
  children: ReactNode
}

export default function ThemeSyncWrapper({ children }: ThemeSyncWrapperProps) {
  const { user, isLoading } = useAuth()
  const { syncWithUserPreference } = useTheme()

  // Changed: Sync theme preferences when user logs in
  useEffect(() => {
    if (!isLoading && user) {
      syncWithUserPreference(user.color_theme, user.style_theme)
    }
  }, [user, isLoading, syncWithUserPreference])

  // Changed: Always render children
  return <>{children}</>
}