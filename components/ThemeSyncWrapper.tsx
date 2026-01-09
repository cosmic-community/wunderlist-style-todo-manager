'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from './ThemeProvider'

// Changed: Made children prop optional since this component is used for side effects only
export default function ThemeSyncWrapper({ children }: { children?: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const { syncWithUserPreference } = useTheme()

  // Changed: Sync theme preferences when user logs in
  useEffect(() => {
    if (!isLoading && user) {
      syncWithUserPreference(user.color_theme, user.style_theme)
    }
  }, [user, isLoading, syncWithUserPreference])

  // Changed: Return children if provided, otherwise return null
  return children ? <>{children}</> : null
}