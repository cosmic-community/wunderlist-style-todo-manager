'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { List } from '@/types'
import Sidebar from '@/components/Sidebar'

interface ClientSidebarProps {
  currentListSlug?: string
  onListChange?: (slug?: string) => void // Changed: Add callback for list changes
}

export default function ClientSidebar({ currentListSlug, onListChange }: ClientSidebarProps) {
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
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
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLists()
    
    // Poll for list updates
    const interval = setInterval(fetchLists, 5000)
    return () => clearInterval(interval)
  }, [fetchLists])

  const handleListCreated = (newList: List) => {
    // Optimistically add the new list
    setLists(prevLists => [...prevLists, newList])
  }

  // Changed: Add handler to replace optimistic list with real one
  const handleListReplaced = (tempId: string, realList: List) => {
    setLists(prevLists => 
      prevLists.map(list => 
        list.id === tempId ? realList : list
      )
    )
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
  }

  const handleListDeleted = (listId: string) => {
    // Find the list being deleted to check if we need to redirect
    const deletedList = lists.find(l => l.id === listId)
    
    // Add to deleted set to prevent reappearing on fetch
    deletedListIds.current.add(listId)
    
    // Optimistically remove the list
    setLists(prevLists => prevLists.filter(list => list.id !== listId))
    
    // If we're currently viewing the deleted list, redirect to home
    if (deletedList && deletedList.slug === currentListSlug) {
      if (onListChange) {
        onListChange(undefined)
      } else {
        router.replace('/')
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

  return (
    <Sidebar 
      lists={lists} 
      currentListSlug={currentListSlug} 
      isLoading={isLoading}
      onListCreated={handleListCreated}
      onListReplaced={handleListReplaced}
      onListUpdated={handleListUpdated}
      onListDeleted={handleListDeleted}
      onListClick={handleListClick}
    />
  )
}