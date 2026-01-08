'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { ColorTheme } from '@/types'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  userThemePreference: ColorTheme
  toggleTheme: () => void
  setThemePreference: (preference: ColorTheme) => void
  // Changed: Added method to sync with user preference from auth
  syncWithUserPreference: (preference: ColorTheme | undefined) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  // Changed: Removed useAuth dependency to prevent prerender errors
  // Theme state is now managed independently
  const [theme, setTheme] = useState<Theme>('dark')
  const [userThemePreference, setUserThemePreference] = useState<ColorTheme>('system')
  const [mounted, setMounted] = useState(false)

  // Changed: Function to apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme)
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
  }, [])

  // Changed: Function to resolve theme based on preference
  const resolveTheme = useCallback((preference: ColorTheme): Theme => {
    if (preference === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'dark' // Default for SSR
    }
    return preference as Theme
  }, [])

  // Changed: Initialize theme on mount from localStorage only
  useEffect(() => {
    setMounted(true)
    
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('theme') as ColorTheme | null
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setUserThemePreference(savedTheme)
      applyTheme(resolveTheme(savedTheme))
    } else {
      // Default to system preference
      setUserThemePreference('system')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(prefersDark ? 'dark' : 'light')
    }
  }, [applyTheme, resolveTheme])

  // Changed: Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (!mounted || userThemePreference !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mounted, userThemePreference, applyTheme])

  // Changed: Toggle between light and dark (not system)
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setUserThemePreference(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // Changed: Set specific theme preference (without auth dependency)
  const setThemePreference = (preference: ColorTheme) => {
    setUserThemePreference(preference)
    localStorage.setItem('theme', preference)
    applyTheme(resolveTheme(preference))
  }

  // Changed: Method to sync theme with user preference from auth context
  const syncWithUserPreference = useCallback((preference: ColorTheme | undefined) => {
    if (preference && ['light', 'dark', 'system'].includes(preference)) {
      setUserThemePreference(preference)
      localStorage.setItem('theme', preference)
      applyTheme(resolveTheme(preference))
    }
  }, [applyTheme, resolveTheme])

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      userThemePreference, 
      toggleTheme, 
      setThemePreference,
      syncWithUserPreference 
    }}>
      {children}
    </ThemeContext.Provider>
  )
}