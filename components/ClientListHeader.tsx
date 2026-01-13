'use client'

import { useState, useEffect, useRef } from 'react'
import { List } from '@/types'
import EditListModal from '@/components/EditListModal'
import { Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ClientListHeaderProps {
  listSlug: string
  refreshKey?: number
  // Changed: Added callback to notify parent about description presence
  onDescriptionChange?: (hasDescription: boolean) => void
}

export default function ClientListHeader({ listSlug, refreshKey, onDescriptionChange }: ClientListHeaderProps) {
  const [list, setList] = useState<List | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 10
  const isMountedRef = useRef(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    isMountedRef.current = true

    const fetchList = async () => {
      try {
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
        
        if (foundList) {
          if (isMountedRef.current) {
            setList(foundList)
            setIsLoading(false)
            setRetryCount(0)
            // Changed: Notify parent about description presence
            if (onDescriptionChange) {
              onDescriptionChange(!!foundList.metadata?.description)
            }
          }
        } else {
          // List not found, retry
          if (retryCount < maxRetries) {
            setTimeout(() => {
              if (isMountedRef.current) {
                setRetryCount(prev => prev + 1)
              }
            }, 500)
          } else {
            if (isMountedRef.current) {
              setIsLoading(false)
              // Changed: No description if list not found
              if (onDescriptionChange) {
                onDescriptionChange(false)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching list:', error)
        if (isMountedRef.current) {
          setIsLoading(false)
          // Changed: No description on error
          if (onDescriptionChange) {
            onDescriptionChange(false)
          }
        }
      }
    }

    fetchList()

    return () => {
      isMountedRef.current = false
    }
  }, [listSlug, retryCount, refreshKey, onDescriptionChange])

  // Changed: Handler for optimistic list update - matches EditListModal's expected signature
  const handleOptimisticUpdate = (listId: string, updates: Partial<List['metadata']>) => {
    if (list && list.id === listId) {
      const updatedList: List = {
        ...list,
        metadata: {
          ...list.metadata,
          ...updates
        }
      }
      setList(updatedList)
      // Changed: Notify parent about description change after update
      if (onDescriptionChange) {
        onDescriptionChange(!!updatedList.metadata?.description)
      }
    }
  }

  // Changed: Handler for optimistic list delete - matches EditListModal's expected signature
  const handleOptimisticDelete = (listId: string) => {
    if (list && list.id === listId) {
      setList(null)
    }
  }

  // Changed: Handler for refresh
  const handleRefresh = () => {
    setRetryCount(prev => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="mb-4 md:mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
      </div>
    )
  }

  if (!list) {
    return null
  }

  return (
    <>
      <div className="mb-4 md:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {list.metadata.name}
            </h1>
            {list.metadata.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {list.metadata.description}
              </p>
            )}
          </div>
          {/* Changed: Only show settings button for authenticated users */}
          {isAuthenticated && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Edit list"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Edit Modal - Changed: Updated props to match EditListModal interface */}
      {showEditModal && (
        <EditListModal
          list={list}
          onClose={() => setShowEditModal(false)}
          onOptimisticUpdate={handleOptimisticUpdate}
          onOptimisticDelete={handleOptimisticDelete}
          onRefresh={handleRefresh}
        />
      )}
    </>
  )
}