'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/components/ThemeProvider'
import { CheckSquare, ArrowLeft, Loader2, AlertCircle, CheckCircle, User, Lock, Mail, Send, Palette, LayoutList, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { CheckboxPosition, ColorTheme, StyleTheme } from '@/types'

export default function SettingsPage() {
  const { user, isLoading: authLoading, isAuthenticated, refreshUser, updateCheckboxPosition, updateStyleTheme } = useAuth()
  const { userThemePreference, setThemePreference, styleTheme, setStyleTheme } = useTheme()
  const router = useRouter()
  
  // Profile form state
  const [displayName, setDisplayName] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')
  
  // Password reset state
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetError, setResetError] = useState('')

  // Changed: Preferences state
  const [checkboxPosition, setCheckboxPosition] = useState<CheckboxPosition>('left')
  const [preferencesLoading, setPreferencesLoading] = useState(false)
  const [preferencesSuccess, setPreferencesSuccess] = useState('')
  const [preferencesError, setPreferencesError] = useState('')

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name)
      setCheckboxPosition(user.checkbox_position || 'left')
    }
  }, [user])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileLoading(true)

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName })
      })

      const data = await response.json()

      if (response.ok) {
        setProfileSuccess('Profile updated successfully!')
        await refreshUser()
        setTimeout(() => setProfileSuccess(''), 3000)
      } else {
        setProfileError(data.error || 'Failed to update profile')
      }
    } catch {
      setProfileError('Network error')
    }

    setProfileLoading(false)
  }

  // Changed: Replaced password change form with password reset email function
  const handlePasswordReset = async () => {
    if (!user?.email) return
    
    setResetError('')
    setResetSuccess('')
    setResetLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })

      const data = await response.json()

      if (response.ok) {
        setResetSuccess('Password reset email sent! Check your inbox for instructions.')
        setTimeout(() => setResetSuccess(''), 5000)
      } else {
        setResetError(data.error || 'Failed to send reset email')
      }
    } catch {
      setResetError('Network error')
    }

    setResetLoading(false)
  }

  // Changed: Handle checkbox position change
  const handleCheckboxPositionChange = async (position: CheckboxPosition) => {
    setPreferencesError('')
    setPreferencesSuccess('')
    setPreferencesLoading(true)
    
    // Optimistic update
    setCheckboxPosition(position)

    const result = await updateCheckboxPosition(position)

    if (result.success) {
      setPreferencesSuccess('Preferences updated!')
      setTimeout(() => setPreferencesSuccess(''), 3000)
    } else {
      setPreferencesError(result.error || 'Failed to update preferences')
      // Revert on error
      setCheckboxPosition(user?.checkbox_position || 'left')
    }

    setPreferencesLoading(false)
  }

  // Changed: Handle color theme change
  const handleColorThemeChange = async (theme: ColorTheme) => {
    setPreferencesError('')
    setPreferencesSuccess('')
    setPreferencesLoading(true)

    await setThemePreference(theme)
    
    setPreferencesSuccess('Theme updated!')
    setTimeout(() => setPreferencesSuccess(''), 3000)
    setPreferencesLoading(false)
  }

  // Changed: Handle style theme change
  const handleStyleThemeChange = async (theme: StyleTheme) => {
    setPreferencesError('')
    setPreferencesSuccess('')
    setPreferencesLoading(true)

    // Update local theme immediately
    setStyleTheme(theme)
    
    // Persist to server
    const result = await updateStyleTheme(theme)

    if (result.success) {
      setPreferencesSuccess('Style theme updated!')
      setTimeout(() => setPreferencesSuccess(''), 3000)
    } else {
      setPreferencesError(result.error || 'Failed to update style theme')
    }

    setPreferencesLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Changed: Style theme options with preview colors
  const styleThemes: { key: StyleTheme; label: string; color: string; darkColor: string }[] = [
    { key: 'default', label: 'Default', color: 'bg-blue-500', darkColor: 'bg-blue-600' },
    { key: 'ocean', label: 'Ocean', color: 'bg-cyan-500', darkColor: 'bg-cyan-600' },
    { key: 'forest', label: 'Forest', color: 'bg-green-500', darkColor: 'bg-green-600' },
    { key: 'sunset', label: 'Sunset', color: 'bg-orange-500', darkColor: 'bg-orange-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Section */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent-light dark:bg-accent/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account information</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </span>
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Success/Error Messages */}
            {profileSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{profileError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={profileLoading || displayName === user.display_name}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {profileLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </section>

        {/* Changed: Preferences Section */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customize your experience</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Checkbox Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <span className="flex items-center gap-2">
                  <LayoutList className="w-4 h-4" />
                  Checkbox Position
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleCheckboxPositionChange('left')}
                  disabled={preferencesLoading}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    checkboxPosition === 'left'
                      ? 'border-accent bg-accent-light dark:bg-accent/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    checkboxPosition === 'left' ? 'border-accent bg-accent' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {checkboxPosition === 'left' && (
                      <svg className="w-full h-full text-white p-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    checkboxPosition === 'left' ? 'text-accent-dark dark:text-accent' : 'text-gray-700 dark:text-gray-300'
                  }`}>Left Side</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCheckboxPositionChange('right')}
                  disabled={preferencesLoading}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 flex-row-reverse ${
                    checkboxPosition === 'right'
                      ? 'border-accent bg-accent-light dark:bg-accent/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    checkboxPosition === 'right' ? 'border-accent bg-accent' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {checkboxPosition === 'right' && (
                      <svg className="w-full h-full text-white p-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    checkboxPosition === 'right' ? 'text-accent-dark dark:text-accent' : 'text-gray-700 dark:text-gray-300'
                  }`}>Right Side</span>
                </button>
              </div>
            </div>

            {/* Color Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <span className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color Theme
                </span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleColorThemeChange('light')}
                  disabled={preferencesLoading}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    userThemePreference === 'light'
                      ? 'border-accent bg-accent-light dark:bg-accent/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 shadow-sm" />
                  <span className={`text-xs font-medium ${
                    userThemePreference === 'light' ? 'text-accent-dark dark:text-accent' : 'text-gray-700 dark:text-gray-300'
                  }`}>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleColorThemeChange('dark')}
                  disabled={preferencesLoading}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    userThemePreference === 'dark'
                      ? 'border-accent bg-accent-light dark:bg-accent/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-900 border-2 border-gray-700" />
                  <span className={`text-xs font-medium ${
                    userThemePreference === 'dark' ? 'text-accent-dark dark:text-accent' : 'text-gray-700 dark:text-gray-300'
                  }`}>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleColorThemeChange('system')}
                  disabled={preferencesLoading}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    userThemePreference === 'system'
                      ? 'border-accent bg-accent-light dark:bg-accent/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-gray-900 border-2 border-gray-300" />
                  <span className={`text-xs font-medium ${
                    userThemePreference === 'system' ? 'text-accent-dark dark:text-accent' : 'text-gray-700 dark:text-gray-300'
                  }`}>System</span>
                </button>
              </div>
            </div>

            {/* Changed: Style Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Style Theme
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {styleThemes.map((theme) => (
                  <button
                    key={theme.key}
                    type="button"
                    onClick={() => handleStyleThemeChange(theme.key)}
                    disabled={preferencesLoading}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      styleTheme === theme.key
                        ? 'border-accent bg-accent-light dark:bg-accent/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${theme.color} dark:${theme.darkColor} shadow-sm`} />
                    <span className={`text-xs font-medium ${
                      styleTheme === theme.key ? 'text-accent-dark dark:text-accent' : 'text-gray-700 dark:text-gray-300'
                    }`}>{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Success/Error Messages */}
            {preferencesSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{preferencesSuccess}</span>
              </div>
            )}
            {preferencesError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{preferencesError}</span>
              </div>
            )}
          </div>
        </section>

        {/* Password Section - Changed: Replaced form with reset button */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent-light dark:bg-accent/20 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Reset your password via email</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click the button below to receive a password reset link at <strong className="text-gray-900 dark:text-white">{user.email}</strong>. 
              You&apos;ll be able to create a new password from the link in the email.
            </p>

            {/* Success/Error Messages */}
            {resetSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{resetSuccess}</span>
              </div>
            )}
            {resetError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{resetError}</span>
              </div>
            )}

            {/* Changed: Updated button to use default accent color and smaller size */}
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resetLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Reset Email
                </>
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}