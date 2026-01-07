'use client'

interface SkeletonLoaderProps {
  variant?: 'task' | 'list' | 'header' | 'sidebar' | 'text'
  count?: number
  className?: string
}

export default function SkeletonLoader({ variant = 'task', count = 1, className = '' }: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  if (variant === 'task') {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className={`bg-white dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-800 animate-pulse ${className}`}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </>
    )
  }

  if (variant === 'list') {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2 animate-pulse ${className}`}>
            <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
          </div>
        ))}
      </>
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

  return null
}