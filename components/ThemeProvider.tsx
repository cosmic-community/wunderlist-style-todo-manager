'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { ColorTheme, StyleTheme } from '@/types'

type Theme = 'light' | 'dark'

// Changed: Added four new feminine themes to the valid style themes list
const VALID_STYLE_THEMES: StyleTheme[] = ['default', 'ocean', 'forest', 'sunset', 'rose', 'lavender', 'peach', 'mint']

interface ThemeContextType {
  theme: Theme
  userThemePreference: ColorTheme
  styleTheme: StyleTheme
  toggleTheme: () => void
  setThemePreference: (preference: ColorTheme) => void
  setStyleTheme: (theme: StyleTheme) => void
  // Changed: Added method to sync with user preference from auth
  syncWithUserPreference: (colorPreference: ColorTheme | undefined, stylePreference: StyleTheme | undefined) => void
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
  const [styleTheme, setStyleThemeState] = useState<StyleTheme>('default')
  const [mounted, setMounted] = useState(false)

  // Changed: Function to apply theme to document - now also applies to html element
  const applyTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme)
    if (typeof document !== 'undefined') {
      // Changed: Apply dark class to both html and body to prevent white background when scrolling
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      document.body.classList.toggle('dark', newTheme === 'dark')
    }
  }, [])

  // Changed: Function to apply style theme to document - updated to include new themes
  const applyStyleTheme = useCallback((newStyleTheme: StyleTheme) => {
    setStyleThemeState(newStyleTheme)
    if (typeof document !== 'undefined') {
      // Remove all style theme classes including new feminine themes
      document.documentElement.classList.remove(
        'theme-default', 'theme-ocean', 'theme-forest', 'theme-sunset',
        'theme-rose', 'theme-lavender', 'theme-peach', 'theme-mint'
      )
      // Add the new style theme class
      document.documentElement.classList.add(`theme-${newStyleTheme}`)
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

  // Changed: Initialize theme on mount from localStorage only - updated validation
  useEffect(() => {
    setMounted(true)
    
    // Check localStorage for saved color preference
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

    // Check localStorage for saved style theme - updated to include new themes
    const savedStyleTheme = localStorage.getItem('styleTheme') as StyleTheme | null
    if (savedStyleTheme && VALID_STYLE_THEMES.includes(savedStyleTheme)) {
      applyStyleTheme(savedStyleTheme)
    } else {
      applyStyleTheme('default')
    }
  }, [applyTheme, applyStyleTheme, resolveTheme])

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

  // Changed: Set style theme
  const setStyleTheme = (theme: StyleTheme) => {
    localStorage.setItem('styleTheme', theme)
    applyStyleTheme(theme)
  }

  // Changed: Method to sync theme with user preference from auth context - updated validation
  const syncWithUserPreference = useCallback((colorPreference: ColorTheme | undefined, stylePreference: StyleTheme | undefined) => {
    if (colorPreference && ['light', 'dark', 'system'].includes(colorPreference)) {
      setUserThemePreference(colorPreference)
      localStorage.setItem('theme', colorPreference)
      applyTheme(resolveTheme(colorPreference))
    }
    if (stylePreference && VALID_STYLE_THEMES.includes(stylePreference)) {
      localStorage.setItem('styleTheme', stylePreference)
      applyStyleTheme(stylePreference)
    }
  }, [applyTheme, applyStyleTheme, resolveTheme])

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      userThemePreference, 
      styleTheme,
      toggleTheme, 
      setThemePreference,
      setStyleTheme,
      syncWithUserPreference 
    }}>
      {children}
    </ThemeContext.Provider>
  )
}