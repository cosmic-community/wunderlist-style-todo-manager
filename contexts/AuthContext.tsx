'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { AuthUser, CheckboxPosition, ColorTheme, StyleTheme } from '@/types'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (updates: Partial<AuthUser>) => void
  // Changed: Added preference update methods
  updateCheckboxPosition: (position: CheckboxPosition) => Promise<{ success: boolean; error?: string }>
  updateColorTheme: (theme: ColorTheme) => Promise<{ success: boolean; error?: string }>
  updateStyleTheme: (theme: StyleTheme) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        return { success: true }
      }
      
      return { success: false, error: data.error || 'Login failed' }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, display_name: displayName })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        return { success: true }
      }
      
      return { success: false, error: data.error || 'Signup failed' }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }

  // Changed: Added updateUser to update user state without fetching from server
  const updateUser = (updates: Partial<AuthUser>) => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  // Changed: Added updateCheckboxPosition method
  const updateCheckboxPosition = async (position: CheckboxPosition) => {
    try {
      const response = await fetch('/api/auth/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkbox_position: position })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser(prev => prev ? { ...prev, checkbox_position: position } : null)
        return { success: true }
      }
      
      return { success: false, error: data.error || 'Failed to update preference' }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  // Changed: Added updateColorTheme method
  const updateColorTheme = async (theme: ColorTheme) => {
    try {
      const response = await fetch('/api/auth/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color_theme: theme })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser(prev => prev ? { ...prev, color_theme: theme } : null)
        return { success: true }
      }
      
      return { success: false, error: data.error || 'Failed to update preference' }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  // Changed: Added updateStyleTheme method
  const updateStyleTheme = async (theme: StyleTheme) => {
    try {
      const response = await fetch('/api/auth/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style_theme: theme })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser(prev => prev ? { ...prev, style_theme: theme } : null)
        return { success: true }
      }
      
      return { success: false, error: data.error || 'Failed to update preference' }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      refreshUser,
      updateUser,
      updateCheckboxPosition,
      updateColorTheme,
      updateStyleTheme
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Changed: Added a safe hook that doesn't throw when used outside AuthProvider
export function useAuthSafe() {
  const context = useContext(AuthContext)
  return context // Returns undefined if not within provider
}