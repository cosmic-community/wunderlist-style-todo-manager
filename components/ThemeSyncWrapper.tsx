'use client'

import { useEffect } from 'react'
import { useAuthSafe } from '@/contexts/AuthContext'
import { useTheme } from '@/components/ThemeProvider'

// Changed: This component syncs the user's theme preference from auth to the theme provider
// It's a separate component to avoid circular dependencies and prerender issues
export default function ThemeSyncWrapper() {
  const auth = useAuthSafe()
  const { syncWithUserPreference } = useTheme()

  useEffect(() => {
    // Sync theme when user logs in or their preference changes
    if (auth?.user?.color_theme) {
      syncWithUserPreference(auth.user.color_theme)
    }
  }, [auth?.user?.color_theme, syncWithUserPreference])

  // This component doesn't render anything
  return null
}