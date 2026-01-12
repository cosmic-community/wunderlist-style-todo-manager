'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { List, User } from '@/types'
import { Users, ChevronDown } from 'lucide-react'

interface ClientListHeaderProps {
  listSlug: string
  refreshKey?: number
}

export default function ClientListHeader({ listSlug, refreshKey }: ClientListHeaderProps) {
  const [list, setList] = useState<List | null>(null)
  // Changed: Start with isLoading false to prevent skeleton on navigation
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 10
  const isFetchingRef = useRef(false)
  // Changed: Track if this is the initial mount
  const isInitialMountRef = useRef(true)
  // State for shared users dropdown
  const [showSharedDropdown, setShowSharedDropdown] = useState(false)
  const sharedDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sharedDropdownRef.current && !sharedDropdownRef.current.contains(event.target as Node)) {
        setShowSharedDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper function to get shared users as User objects
  const getSharedUsers = (list: List): User[] => {
    const sharedWith = list.metadata.shared_with || []
    return sharedWith.filter((u): u is User => typeof u === 'object' && u !== null && 'id' in u)
  }

  // Helper function to get display name for a user
  const getUserDisplayName = (userObj: User): string => {
    return userObj.metadata?.display_name || userObj.title || 'Unknown User'
  }

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
      // Changed: Only show loading on initial mount, not on list changes
      if (isInitialMountRef.current) {
        setIsLoading(true)
      }
      
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
      isInitialMountRef.current = false
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

  // Changed: Only show loading on initial mount with retry logic
  // Changed: Only show title skeleton (no description) to prevent layout shift
  // when loading lists without descriptions - growing is less jarring than shrinking
  if (isLoading && isInitialMountRef.current && !list) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        </div>
      </div>
    )
  }

  // Changed: If no list yet but not initial mount, show nothing (content will load silently)
  if (!list) {
    return null
  }

  const sharedUsers = getSharedUsers(list)
  const hasSharedUsers = sharedUsers.length > 0

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {list.metadata.name}
          </h1>
        </div>

        {/* Shared users dropdown - positioned top right */}
        {hasSharedUsers && (
          <div className="relative" ref={sharedDropdownRef}>
            <button
              onClick={() => setShowSharedDropdown(!showSharedDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label={`Shared with ${sharedUsers.length} user${sharedUsers.length > 1 ? 's' : ''}`}
            >
              <Users className="w-4 h-4" />
              <span>{sharedUsers.length}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSharedDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Shared users dropdown menu */}
            {showSharedDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Shared with
                </div>
                {sharedUsers.map((sharedUser) => (
                  <div
                    key={sharedUser.id}
                    className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                      {getUserDisplayName(sharedUser).charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{getUserDisplayName(sharedUser)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {list.metadata.description && (
        <p className="text-gray-600 dark:text-gray-400 ml-7">
          {list.metadata.description}
        </p>
      )}
    </div>
  )
}