'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { List, User } from '@/types'
import { Users, ChevronDown, Settings, Inbox, UserPlus } from 'lucide-react'
import EditListModal from './EditListModal'
import InviteModal from './InviteModal'

interface ClientListHeaderProps {
  listSlug: string
  refreshKey?: number
  onListChange?: (slug?: string) => void
  onListUpdated?: (listId: string, updates: Partial<List['metadata']>) => void
  onListDeleted?: (listId: string) => void
  onRefresh?: () => void
}

export default function ClientListHeader({ listSlug, refreshKey, onListChange, onListUpdated, onListDeleted, onRefresh }: ClientListHeaderProps) {
  const [list, setList] = useState<List | null>(null)
  const [allLists, setAllLists] = useState<List[]>([])
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
  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  // State for invite modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  // State for list selector dropdown
  const [showListSelector, setShowListSelector] = useState(false)
  const listSelectorRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sharedDropdownRef.current && !sharedDropdownRef.current.contains(event.target as Node)) {
        setShowSharedDropdown(false)
      }
      if (listSelectorRef.current && !listSelectorRef.current.contains(event.target as Node)) {
        setShowListSelector(false)
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
      // Store all lists for the list selector dropdown
      setAllLists(data.lists || [])
      const foundList = data.lists.find((l: List) => l.slug === listSlug)
      return foundList || null
    } catch (error) {
      console.error('Error fetching list:', error)
      return null
    }
  }, [listSlug])

  // Handle list selection from dropdown
  const handleListSelect = (slug?: string) => {
    setShowListSelector(false)
    if (onListChange) {
      onListChange(slug)
    }
  }

  // Handle optimistic update from edit modal
  const handleOptimisticUpdate = (listId: string, updates: Partial<List['metadata']>) => {
    // Update local list state
    if (list && list.id === listId) {
      setList({
        ...list,
        title: updates.name || list.title,
        metadata: { ...list.metadata, ...updates }
      })
    }
    // Notify parent
    if (onListUpdated) {
      onListUpdated(listId, updates)
    }
  }

  // Handle optimistic delete from edit modal
  const handleOptimisticDelete = (listId: string) => {
    if (onListDeleted) {
      onListDeleted(listId)
    }
    // Navigate to All Tasks after deletion
    if (onListChange) {
      onListChange(undefined)
    }
  }

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
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {/* List selector dropdown - covers entire title area */}
          <div className="relative" ref={listSelectorRef}>
            <button
              onClick={() => setShowListSelector(!showListSelector)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="Switch list"
            >
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
              />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {list.metadata.name}
              </h1>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showListSelector ? 'rotate-180' : ''}`} />
            </button>

            {/* List selector dropdown menu */}
            {showListSelector && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-80 overflow-y-auto">
                {/* All Tasks option */}
                <button
                  onClick={() => handleListSelect(undefined)}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
                >
                  <Inbox className="w-5 h-5 text-gray-500" />
                  <span className="truncate font-medium">All Tasks</span>
                </button>
                
                {allLists.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                )}
                
                {allLists.map((listItem) => (
                  <button
                    key={listItem.id}
                    onClick={() => handleListSelect(listItem.slug)}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2.5 transition-colors ${
                      listItem.slug === listSlug
                        ? 'bg-accent/10 text-accent'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: listItem.metadata.color || '#3b82f6' }}
                    />
                    <span className="truncate">{listItem.metadata.name || listItem.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* Settings button */}
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Edit list settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Shared users dropdown */}
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
                    {/* Invite button */}
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setShowSharedDropdown(false)
                          setShowInviteModal(true)
                        }}
                        className="w-full px-3 py-2 text-sm text-left text-accent hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Invite someone</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {list.metadata.description && (
          <p className="text-gray-600 dark:text-gray-400 ml-7">
            {list.metadata.description}
          </p>
        )}
      </div>

      {/* Edit List Modal */}
      {showEditModal && (
        <EditListModal
          list={list}
          onClose={() => setShowEditModal(false)}
          onOptimisticUpdate={handleOptimisticUpdate}
          onOptimisticDelete={handleOptimisticDelete}
          onRefresh={onRefresh}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          listId={list.id}
          listName={list.metadata.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  )
}