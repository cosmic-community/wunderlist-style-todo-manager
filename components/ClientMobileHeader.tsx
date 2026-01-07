'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { List } from '@/types'
import MobileHeader from '@/components/MobileHeader'

interface ClientMobileHeaderProps {
  currentListSlug?: string
}

export default function ClientMobileHeader({ currentListSlug }: ClientMobileHeaderProps) {
  const [lists, setLists] = useState<List[]>([])
  const [currentList, setCurrentList] = useState<List | undefined>(undefined)
  const router = useRouter()
  // Track deleted list IDs to prevent them from reappearing on fetch
  const deletedListIds = useRef<Set<string>>(new Set())

  const fetchLists = useCallback(async () => {
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        // Filter out any lists that were recently deleted (to handle race conditions)
        const filteredLists = (data.lists as List[]).filter(
          list => !deletedListIds.current.has(list.id)
        )
        setLists(filteredLists)
        
        if (currentListSlug) {
          const found = filteredLists.find((l: List) => l.slug === currentListSlug)
          setCurrentList(found)
        }
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
    }
  }, [currentListSlug])

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
  }

  const handleListDeleted = (listId: string) => {
    // Find the list being deleted to check if we need to redirect
    const deletedList = lists.find(l => l.id === listId)
    
    // Add to deleted set to prevent reappearing on fetch
    deletedListIds.current.add(listId)
    
    // Optimistically remove the list
    setLists(prevLists => prevLists.filter(list => list.id !== listId))
    
    // Clear current list if it was deleted
    if (deletedList && deletedList.slug === currentListSlug) {
      setCurrentList(undefined)
    }
  }

  return (
    <MobileHeader 
      lists={lists} 
      currentList={currentList} 
      onListDeleted={handleListDeleted}
      onListCreated={handleListCreated}
      onListUpdated={handleListUpdated}
    />
  )
}