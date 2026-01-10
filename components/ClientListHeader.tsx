'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { List } from '@/types'

interface ClientListHeaderProps {
  listSlug: string
  refreshKey?: number
}

export default function ClientListHeader({ listSlug, refreshKey }: ClientListHeaderProps) {
  const [list, setList] = useState<List | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 10
  const isFetchingRef = useRef(false)

  const fetchList = useCallback(async (): Promise<List | null> => {
    try {
      // Changed: Add cache-busting timestamp to prevent stale data
      const response = await fetch(`/api/lists?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch lists')
      }
      
      const data = await response.json()
      const foundList = data.lists.find((l: List) => l.slug === listSlug)
      return foundList || null
    } catch (error) {
      console.error('Error fetching list:', error)
      return null
    }
  }, [listSlug])

  useEffect(() => {
    if (isFetchingRef.current) {
      return
    }

    const loadData = async () => {
      isFetchingRef.current = true
      setIsLoading(true)
      
      const foundList = await fetchList()
      
      if (!foundList) {
        // List not found - might still be creating
        if (retryCount < maxRetries) {
          isFetchingRef.current = false
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 500)
          return // Don't set isLoading to false yet
        }
      } else {
        setList(foundList)
        setRetryCount(0)
      }
      
      setIsLoading(false)
      isFetchingRef.current = false
    }

    loadData()
  }, [listSlug, retryCount, fetchList])

  // Changed: Reset state when listSlug changes
  useEffect(() => {
    setList(null)
    setRetryCount(0)
    isFetchingRef.current = false
  }, [listSlug])

  // Changed: Refresh when refreshKey changes
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      isFetchingRef.current = false
      setRetryCount(prev => prev) // Trigger re-fetch
      
      const refreshData = async () => {
        const foundList = await fetchList()
        if (foundList) {
          setList(foundList)
        }
      }
      
      refreshData()
    }
  }, [refreshKey, fetchList])

  if (isLoading || !list) {
    return (
      <div className="mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
        />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {list.metadata.name}
        </h1>
      </div>
      {list.metadata.description && (
        <p className="text-gray-600 dark:text-gray-400 ml-7">
          {list.metadata.description}
        </p>
      )}
    </div>
  )
}