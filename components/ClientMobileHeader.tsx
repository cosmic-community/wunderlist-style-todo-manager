'use client'

import { useState, useEffect, useCallback, useRef, Dispatch, SetStateAction } from 'react'
import { List } from '@/types'
import MobileHeader from '@/components/MobileHeader'
import { getCachedLists, setCachedLists, hasCachedLists, clearCachedLists } from '@/lib/listsCache'
import { useAuth } from '@/contexts/AuthContext'

export interface ClientMobileHeaderProps {
  currentListSlug?: string
  onListChange?: (slug?: string) => void
  onCreatingStateChange?: Dispatch<SetStateAction<boolean>>
  onListRefresh?: () => void
  // Changed: Callback to register the menu open function
  onMenuOpenRegister?: (openFn: () => void) => void
}

export default function ClientMobileHeader({ currentListSlug, onListChange, onCreatingStateChange, onListRefresh, onMenuOpenRegister }: ClientMobileHeaderProps) {
  // Changed: Initialize lists from cache to prevent refetch on navigation
  const [lists, setLists] = useState<List[]>(getCachedLists() || [])
  // Changed: Track menu open state here so we can expose open function
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Changed: Stable callback to open the menu
  const openMenu = useCallback(() => setIsMenuOpen(true), [])

  // Changed: Stable callback to close the menu
  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  // Changed: Register the menu open function with parent - use stable callback
  useEffect(() => {
    if (onMenuOpenRegister) {
      onMenuOpenRegister(openMenu)
    }
  }, [onMenuOpenRegister, openMenu])
  // Changed: Only show loading if we don't have cached data
  const [isLoading, setIsLoading] = useState(!hasCachedLists())
  // Changed: Track lists that are still syncing (have temporary IDs)
  const [syncingListSlugs, setSyncingListSlugs] = useState<Set<string>>(new Set())
  // Track deleted list IDs to prevent them from reappearing on fetch
  const deletedListIds = useRef<Set<string>>(new Set())
  // Track auth state to refetch lists on login/logout
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const prevAuthState = useRef<boolean | null>(null)

  const fetchLists = useCallback(async () => {
    try {
      // Changed: Only show loading if we don't have cached data
      if (!hasCachedLists()) {
        setIsLoading(true)
      }
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        // Filter out any lists that were recently deleted (to handle race conditions)
        const filteredLists = (data.lists as List[]).filter(
          list => !deletedListIds.current.has(list.id)
        )

        // Changed: Only update lists if they don't have temporary IDs
        // This prevents replacing optimistic updates with fetched data
        setLists(prevLists => {
          // Keep any lists with temporary IDs from optimistic updates
          const tempLists = prevLists.filter(list => list.id.startsWith('temp-'))

          // Merge temporary lists with fetched lists, avoiding duplicates
          const fetchedIds = new Set(filteredLists.map(list => list.id))
          const uniqueTempLists = tempLists.filter(list => !fetchedIds.has(list.id))

          const newLists = [...filteredLists, ...uniqueTempLists]
          // Changed: Update the shared cache
          setCachedLists(newLists)
          return newLists
        })
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Changed: Only fetch on mount if we don't have cached data
  // This prevents refetching when navigating between lists
  useEffect(() => {
    if (!hasCachedLists()) {
      fetchLists()
    } else {
      // Already have cached data, just mark as loaded
      setIsLoading(false)
    }
  }, [fetchLists])

  // Refetch lists when authentication state changes (login/logout)
  useEffect(() => {
    // Skip if auth is still loading
    if (isAuthLoading) return
    
    // Check if auth state has changed
    if (prevAuthState.current !== null && prevAuthState.current !== isAuthenticated) {
      // Clear the cache and refetch lists
      clearCachedLists()
      deletedListIds.current.clear()
      setIsLoading(true)
      fetchLists()
    }
    
    // Update previous auth state
    prevAuthState.current = isAuthenticated
  }, [isAuthenticated, isAuthLoading, fetchLists])

  const handleListCreated = (newList: List) => {
    // Optimistically add the new list
    setLists(prevLists => {
      const newLists = [...prevLists, newList]
      // Changed: Update the shared cache
      setCachedLists(newLists)
      return newLists
    })
    // Changed: Mark this list slug as syncing if it has a temp ID
    if (newList.id.startsWith('temp-')) {
      setSyncingListSlugs(prev => new Set(prev).add(newList.slug))
    }
  }

  // Changed: Add handler to replace optimistic list with real one
  const handleListReplaced = (tempId: string, realList: List) => {
    setLists(prevLists => {
      // Find the temp list to get its slug
      const tempList = prevLists.find(list => list.id === tempId)
      if (tempList) {
        // Remove the old slug from syncing set
        setSyncingListSlugs(prev => {
          const newSet = new Set(prev)
          newSet.delete(tempList.slug)
          return newSet
        })
      }
      const newLists = prevLists.map(list =>
        list.id === tempId ? realList : list
      )
      // Changed: Update the shared cache
      setCachedLists(newLists)
      return newLists
    })
  }

  const handleListUpdated = (listId: string, updates: Partial<List['metadata']>) => {
    // Optimistically update the list
    setLists(prevLists => {
      const newLists = prevLists.map(list =>
        list.id === listId
          ? {
            ...list,
            title: updates.name || list.title,
            metadata: { ...list.metadata, ...updates }
          }
          : list
      )
      // Changed: Update the shared cache
      setCachedLists(newLists)
      return newLists
    })

    // Changed: Trigger parent refresh when list is updated
    if (onListRefresh) {
      onListRefresh()
    }
  }

  const handleListDeleted = (listId: string) => {
    // Find the list being deleted to check if we need to redirect
    const deletedList = lists.find(l => l.id === listId)

    // Add to deleted set to prevent reappearing on fetch
    deletedListIds.current.add(listId)

    // Optimistically remove the list
    setLists(prevLists => {
      const newLists = prevLists.filter(list => list.id !== listId)
      // Changed: Update the shared cache
      setCachedLists(newLists)
      return newLists
    })

    // Changed: Also remove from syncing set if present
    if (deletedList) {
      setSyncingListSlugs(prev => {
        const newSet = new Set(prev)
        newSet.delete(deletedList.slug)
        return newSet
      })
    }

    // If we're currently viewing the deleted list, go back to all tasks
    if (deletedList && deletedList.slug === currentListSlug) {
      if (onListChange) {
        onListChange(undefined)
      }
    }
  }

  // Changed: Handle list navigation without page refresh
  const handleListClick = (slug?: string) => {
    if (onListChange) {
      onListChange(slug)
    }
  }

  // Changed: Add refresh handler
  const handleRefresh = () => {
    fetchLists()
  }

  // Changed: Handle creating state change and pass to parent
  const handleCreatingStateChange = (isCreating: boolean) => {
    if (onCreatingStateChange) {
      onCreatingStateChange(isCreating)
    }
  }

  return (
    <MobileHeader
      lists={lists}
      currentListSlug={currentListSlug}
      isLoading={isLoading}
      syncingListSlugs={syncingListSlugs}
      isMenuOpen={isMenuOpen}
      onMenuClose={closeMenu}
      onListCreated={handleListCreated}
      onListReplaced={handleListReplaced}
      onListUpdated={handleListUpdated}
      onListDeleted={handleListDeleted}
      onListClick={handleListClick}
      onRefresh={handleRefresh}
      onCreatingStateChange={handleCreatingStateChange}
    />
  )
}