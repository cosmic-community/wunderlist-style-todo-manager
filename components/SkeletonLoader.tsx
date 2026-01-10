'use client'

import { useAuth } from '@/contexts/AuthContext'

interface SkeletonLoaderProps {
  variant?: 'task' | 'list' | 'header' | 'sidebar' | 'text' | 'creating-list'
  count?: number
  className?: string
}

export default function SkeletonLoader({ variant = 'task', count = 1, className = '' }: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)
  
  // Changed: Get checkbox position from user preferences for task skeleton
  const { user } = useAuth()
  const checkboxPosition = user?.checkbox_position || 'left'

  if (variant === 'task') {
    return (
      // Changed: Added space-y-2 wrapper to match TaskList spacing and prevent layout shift
      <div className="space-y-2.5 md:space-y-2">
        {skeletons.map((i) => (
          <div key={i} className={`bg-white dark:bg-gray-900 rounded-xl px-4 py-4 md:py-3 border border-gray-200 dark:border-gray-800 animate-pulse ${className}`}>
            {/* Changed: Conditionally reverse flex direction based on checkbox position */}
            <div 
              className="flex items-center gap-3"
              style={{ flexDirection: checkboxPosition === 'right' ? 'row-reverse' : 'row' }}
            >
              <div className="w-7 h-7 md:w-6 md:h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 md:h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'list') {
    return (
      // Changed: Added space-y-1 wrapper to match Sidebar list spacing
      <div className="space-y-1">
        {skeletons.map((i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2 animate-pulse ${className}`}>
            <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'header') {
    return (
      <div className={`mb-6 animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-64" />
      </div>
    )
  }

  if (variant === 'sidebar') {
    return (
      <div className={`space-y-1 animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4" />
        {skeletons.map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={`animate-pulse ${className}`}>
        {skeletons.map((i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2" />
        ))}
      </div>
    )
  }

  // Changed: Add creating-list variant for showing loading state when creating a new list
  if (variant === 'creating-list') {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <div className="relative">
          {/* Animated circles */}
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Creating your list...</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">This will only take a moment</p>
      </div>
    )
  }

  return null
}