'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { List } from '@/types'
import MobileHeader from '@/components/MobileHeader'

export interface ClientMobileHeaderProps {
  currentListSlug?: string
  onListChange?: (slug?: string) => void
  onListRefresh?: () => void
}

export default function ClientMobileHeader({ currentListSlug, onListChange, onListRefresh }: ClientMobileHeaderProps) {
  const [lists, setLists] = useState<List[]>([])
  const [currentList, setCurrentList] = useState<List | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  // Changed: Track lists that are still syncing (have temporary IDs)
  const [syncingListSlugs, setSyncingListSlugs] = useState<Set<string>>(new Set())
  const router = useRouter()
  // Track deleted list IDs to prevent them from reappearing on fetch
  const deletedListIds = useRef<Set<string>>(new Set())

  const fetchLists = useCallback(async () => {
    try {
      setIsLoading(true)
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
          
          return [...filteredLists, ...uniqueTempLists]
        })
        
        if (currentListSlug) {
          const found = filteredLists.find((l: List) => l.slug === currentListSlug)
          setCurrentList(found)
        } else {
          setCurrentList(undefined)
        }
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentListSlug])

  // Changed: Fetch only on mount and when currentListSlug changes, no polling
  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const handleListCreated = (newList: List) => {
    // Optimistically add the new list
    setLists(prevLists => [...prevLists, newList])
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
      return prevLists.map(list => 
        list.id === tempId ? realList : list
      )
    })
  }

  const handleListUpdated = (listId: string, updates: Partial<List['metadata']>) => {
    // Optimistically update the list
    setLists(prevLists => 
      prevLists.map(list => 
        list.id === listId 
          ? { 
              ...list, 
              title: updates.name || list.title,
              metadata: { ...list.metadata, ...updates } 
            } 
          : list
      )
    )
    
    // Update current list if it was the one edited
    if (currentList?.id === listId) {
      setCurrentList(prev => prev ? {
        ...prev,
        title: updates.name || prev.title,
        metadata: { ...prev.metadata, ...updates }
      } : undefined)
    }
    
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
    setLists(prevLists => prevLists.filter(list => list.id !== listId))
    
    // Changed: Also remove from syncing set if present
    if (deletedList) {
      setSyncingListSlugs(prev => {
        const newSet = new Set(prev)
        newSet.delete(deletedList.slug)
        return newSet
      })
    }
    
    // Clear current list if it was deleted
    if (deletedList && deletedList.slug === currentListSlug) {
      setCurrentList(undefined)
      if (onListChange) {
        onListChange(undefined)
      }
    }
  }

  // Changed: Handle list navigation without page refresh
  const handleListClick = (slug?: string) => {
    if (onListChange) {
      onListChange(slug)
    } else {
      // Fallback to router navigation if no callback provided
      if (slug) {
        router.push(`/lists/${slug}`)
      } else {
        router.push('/')
      }
    }
  }

  // Changed: Add refresh handler
  const handleRefresh = () => {
    fetchLists()
  }

  return (
    <MobileHeader 
      lists={lists} 
      currentList={currentList}
      isLoading={isLoading}
      syncingListSlugs={syncingListSlugs}
      onListDeleted={handleListDeleted}
      onListCreated={handleListCreated}
      onListReplaced={handleListReplaced}
      onListUpdated={handleListUpdated}
      onListClick={handleListClick}
      onRefresh={handleRefresh}
    />
  )
}