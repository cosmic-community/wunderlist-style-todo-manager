'use client'

import { useState, useEffect } from 'react'
import { List } from '@/types'
import SkeletonLoader from './SkeletonLoader'

interface ClientListHeaderProps {
  listSlug: string
}

export default function ClientListHeader({ listSlug }: ClientListHeaderProps) {
  const [list, setList] = useState<List | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Changed: Track retry attempts for newly created lists
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 10 // Max retries over ~5 seconds

  useEffect(() => {
    const fetchList = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/lists')
        if (!response.ok) {
          throw new Error('Failed to fetch lists')
        }
        
        const data = await response.json()
        const foundList = data.lists.find((l: List) => l.slug === listSlug)
        
        if (foundList) {
          setList(foundList)
          setRetryCount(0) // Reset retry count on success
        } else {
          // Changed: If list not found, it might still be creating - retry
          if (retryCount < maxRetries) {
            // Wait 500ms before retrying
            setTimeout(() => {
              setRetryCount(prev => prev + 1)
            }, 500)
          } else {
            setError('List not found')
          }
        }
      } catch (err) {
        console.error('Error fetching list:', err)
        setError('Failed to load list')
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [listSlug, retryCount])

  // Changed: Show loading state while retrying
  if (isLoading || (retryCount > 0 && retryCount < maxRetries && !list)) {
    return <SkeletonLoader variant="header" />
  }

  if (error || !list) {
    return (
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {error || 'List not found'}
        </h1>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div 
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
        />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {list.metadata.name || list.title}
        </h1>
      </div>
      {list.metadata.description && (
        <p className="text-gray-600 dark:text-gray-400 mt-1 ml-7">
          {list.metadata.description}
        </p>
      )}
    </div>
  )
}