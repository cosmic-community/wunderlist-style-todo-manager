'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CheckSquare, ArrowLeft, Loader2, AlertCircle, CheckCircle, User, Lock, Mail, Send } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth()
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

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name)
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