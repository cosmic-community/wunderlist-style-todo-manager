'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { List } from '@/types'
import Sidebar from '@/components/Sidebar'

interface ClientSidebarProps {
  currentListSlug?: string
}

export default function ClientSidebar({ currentListSlug }: ClientSidebarProps) {
  const [lists, setLists] = useState<List[]>([])
  const router = useRouter()

  const fetchLists = useCallback(async () => {
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists)
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
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
    
    // Optimistically remove the list
    setLists(prevLists => prevLists.filter(list => list.id !== listId))
    
    // If we're currently viewing the deleted list, redirect to home
    if (deletedList && deletedList.slug === currentListSlug) {
      router.push('/')
    }
  }

  return (
    <Sidebar 
      lists={lists} 
      currentListSlug={currentListSlug} 
      onListCreated={handleListCreated}
      onListUpdated={handleListUpdated}
      onListDeleted={handleListDeleted}
    />
  )
}