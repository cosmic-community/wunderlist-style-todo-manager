'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CheckSquare, ArrowLeft, Loader2, AlertCircle, CheckCircle, User, Lock, Mail, Send, Settings } from 'lucide-react'
import Link from 'next/link'
import { CheckboxPosition } from '@/types'

export default function SettingsPage() {
  const { user, isLoading: authLoading, isAuthenticated, refreshUser, checkboxPosition, updateCheckboxPosition } = useAuth()
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

  // Changed: Checkbox position state
  const [selectedCheckboxPosition, setSelectedCheckboxPosition] = useState<CheckboxPosition>(checkboxPosition)
  const [preferenceLoading, setPreferenceLoading] = useState(false)
  const [preferenceSuccess, setPreferenceSuccess] = useState('')
  const [preferenceError, setPreferenceError] = useState('')

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name)
    }
  }, [user])

  // Changed: Sync checkbox position with auth context
  useEffect(() => {
    setSelectedCheckboxPosition(checkboxPosition)
  }, [checkboxPosition])

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

  // Changed: Handler for checkbox position update
  const handleCheckboxPositionChange = async (position: CheckboxPosition) => {
    if (position === selectedCheckboxPosition) return
    
    setPreferenceError('')
    setPreferenceSuccess('')
    setPreferenceLoading(true)
    setSelectedCheckboxPosition(position) // Optimistic update

    const result = await updateCheckboxPosition(position)

    if (result.success) {
      setPreferenceSuccess('Preference updated successfully!')
      setTimeout(() => setPreferenceSuccess(''), 3000)
    } else {
      setPreferenceError(result.error || 'Failed to update preference')
      setSelectedCheckboxPosition(checkboxPosition) // Revert on error
    }

    setPreferenceLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

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
            <CheckSquare className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Section */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
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
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
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
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* Changed: Preferences Section - Checkbox Position */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customize your task list appearance</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Checkbox Position
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Choose where the checkbox appears on each task
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Left Side Option */}
                <button
                  type="button"
                  onClick={() => handleCheckboxPositionChange('left')}
                  disabled={preferenceLoading}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedCheckboxPosition === 'left'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedCheckboxPosition === 'left' ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedCheckboxPosition === 'left' && (
                        <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Task name here</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    selectedCheckboxPosition === 'left' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Left Side
                  </span>
                </button>

                {/* Right Side Option */}
                <button
                  type="button"
                  onClick={() => handleCheckboxPositionChange('right')}
                  disabled={preferenceLoading}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedCheckboxPosition === 'right'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Task name here</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedCheckboxPosition === 'right' ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedCheckboxPosition === 'right' && (
                        <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${
                    selectedCheckboxPosition === 'right' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Right Side
                  </span>
                </button>
              </div>
            </div>

            {/* Success/Error Messages for Preferences */}
            {preferenceSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{preferenceSuccess}</span>
              </div>
            )}
            {preferenceError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{preferenceError}</span>
              </div>
            )}

            {preferenceLoading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            )}
          </div>
        </section>

        {/* Password Section - Changed: Replaced form with reset button */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-600" />
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

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resetLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Password Reset Email
                </>
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}