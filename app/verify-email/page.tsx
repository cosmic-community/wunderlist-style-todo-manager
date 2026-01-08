'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

function VerifyEmailContent() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [autoVerifying, setAutoVerifying] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  
  const emailParam = searchParams.get('email')
  const codeParam = searchParams.get('code')
  const isInvite = searchParams.get('invite') === 'true'

  // Auto-verify if code is in URL
  useEffect(() => {
    if (codeParam && emailParam && !isVerified && !autoVerifying) {
      setAutoVerifying(true)
      setCode(codeParam)
      handleVerify(codeParam, emailParam)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam, emailParam, isVerified, autoVerifying])

  const handleVerify = async (verifyCode?: string, verifyEmail?: string) => {
    const codeToUse = verifyCode || code
    const emailToUse = verifyEmail || emailParam
    
    if (!codeToUse || !emailToUse) {
      setError('Verification code and email are required')
      return
    }
    
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, code: codeToUse })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setIsVerified(true)
        // Changed: Refresh the auth context to get updated user data
        await refreshUser()
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setError(data.error || 'Verification failed')
      }
    } catch {
      setError('Network error')
    }
    
    setIsLoading(false)
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Email verified!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isInvite 
                ? 'Your account is ready. Redirecting to your shared lists...'
                : 'Your account is now active. Redirecting...'}
            </p>
            
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <CheckSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cosmic Todo</h1>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
            {isInvite ? 'Accept Invitation' : 'Verify your email'}
          </h2>
          
          {emailParam && (
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Enter the verification code sent to <strong>{emailParam}</strong>
            </p>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {autoVerifying ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white text-center text-2xl tracking-widest font-mono"
                  placeholder="XXXXXX"
                  maxLength={6}
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>
            </form>
          )}
          
          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}