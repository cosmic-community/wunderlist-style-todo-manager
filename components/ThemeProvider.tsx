'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ColorTheme } from '@/types'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  userThemePreference: ColorTheme
  toggleTheme: () => void
  setThemePreference: (preference: ColorTheme) => void
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
  const { user, updateColorTheme } = useAuth()
  // Changed: Initialize with 'dark' to provide stable SSR value
  const [theme, setTheme] = useState<Theme>('dark')
  const [userThemePreference, setUserThemePreference] = useState<ColorTheme>('system')
  const [mounted, setMounted] = useState(false)

  // Changed: Function to apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }, [])

  // Changed: Function to resolve theme based on preference
  const resolveTheme = useCallback((preference: ColorTheme): Theme => {
    if (preference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return preference as Theme
  }, [])

  // Changed: Initialize theme on mount
  useEffect(() => {
    setMounted(true)
    
    // Check for user preference from auth context first
    const userPref = user?.color_theme
    if (userPref) {
      setUserThemePreference(userPref)
      applyTheme(resolveTheme(userPref))
      return
    }
    
    // Fall back to localStorage
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
  }, [user?.color_theme, applyTheme, resolveTheme])

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
    
    // Update in backend if user is logged in
    if (user) {
      updateColorTheme(newTheme)
    }
  }

  // Changed: Set specific theme preference
  const setThemePreference = async (preference: ColorTheme) => {
    setUserThemePreference(preference)
    localStorage.setItem('theme', preference)
    applyTheme(resolveTheme(preference))
    
    // Update in backend if user is logged in
    if (user) {
      await updateColorTheme(preference)
    }
  }

  // Changed: Always provide context value to prevent SSR errors
  return (
    <ThemeContext.Provider value={{ theme, userThemePreference, toggleTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  )
}