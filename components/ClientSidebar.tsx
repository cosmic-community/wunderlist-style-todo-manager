'use client'

import { useState, useEffect, useCallback } from 'react'
import { List } from '@/types'
import Sidebar from '@/components/Sidebar'

interface ClientSidebarProps {
  currentListSlug?: string
}

export default function ClientSidebar({ currentListSlug }: ClientSidebarProps) {
  const [lists, setLists] = useState<List[]>([])

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

  return (
    <Sidebar 
      lists={lists} 
      currentListSlug={currentListSlug} 
      onListCreated={handleListCreated}
    />
  )
}