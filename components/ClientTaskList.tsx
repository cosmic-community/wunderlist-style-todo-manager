'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Task, List } from '@/types'
import TaskList from './TaskList'
import SkeletonLoader from './SkeletonLoader'

interface ClientTaskListProps {
  listSlug?: string
  refreshKey?: number // Changed: Added refreshKey prop to trigger refresh from parent
}

export default function ClientTaskList({ listSlug, refreshKey }: ClientTaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [list, setList] = useState<List | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Changed: Track retry attempts for newly created lists
  const [listRetryCount, setListRetryCount] = useState(0)
  const maxRetries = 10
  
  // Changed: Use refs to track fetch state and prevent infinite loops
  const isFetchingRef = useRef(false)
  const lastListIdRef = useRef<string | null>(null)
  const hasFetchedTasksRef = useRef(false)

  // Changed: Fetch lists data - memoized without list dependency
  const fetchLists = useCallback(async (): Promise<{ found: boolean; foundList: List | null }> => {
    try {
      const response = await fetch('/api/lists')
      if (!response.ok) {
        throw new Error('Failed to fetch lists')
      }
      
      const data = await response.json()
      setLists(data.lists || [])
      
      if (listSlug) {
        const foundList = data.lists.find((l: List) => l.slug === listSlug)
        if (foundList) {
          return { found: true, foundList }
        }
        return { found: false, foundList: null }
      }
      
      return { found: true, foundList: null }
    } catch (err) {
      console.error('Error fetching lists:', err)
      return { found: false, foundList: null }
    }
  }, [listSlug])

  // Changed: Fetch tasks - takes listId as parameter to avoid dependency on list state
  // Changed: Fixed query parameter to use 'list' instead of 'listId' to match API route
  const fetchTasksForList = useCallback(async (listId: string | null) => {
    try {
      // Changed: Use 'list' query param to match the API route expectation
      const url = listSlug && listId ? `/api/tasks?list=${listId}` : '/api/tasks'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError('Failed to load tasks')
    }
  }, [listSlug])

  // Changed: Single effect for initial load and retry logic - prevents infinite loops
  useEffect(() => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return
    }
    
    const loadData = async () => {
      isFetchingRef.current = true
      setIsLoading(true)
      setError(null)
      
      const { found, foundList } = await fetchLists()
      
      if (listSlug && !found) {
        // List not found - might still be creating
        if (listRetryCount < maxRetries) {
          isFetchingRef.current = false
          setTimeout(() => {
            setListRetryCount(prev => prev + 1)
          }, 500)
          return // Don't set isLoading to false yet
        } else {
          setError('List not found')
          setIsLoading(false)
          isFetchingRef.current = false
          return
        }
      }
      
      // Update list state if we found it
      if (foundList) {
        setList(foundList)
        setListRetryCount(0)
        
        // Changed: Only fetch tasks if we haven't already fetched for this list
        if (lastListIdRef.current !== foundList.id) {
          lastListIdRef.current = foundList.id
          await fetchTasksForList(foundList.id)
          hasFetchedTasksRef.current = true
        }
      } else if (!listSlug) {
        // No specific list needed, fetch all tasks
        if (!hasFetchedTasksRef.current) {
          await fetchTasksForList(null)
          hasFetchedTasksRef.current = true
        }
      }
      
      setIsLoading(false)
      isFetchingRef.current = false
    }
    
    loadData()
  }, [listSlug, listRetryCount, fetchLists, fetchTasksForList])

  // Changed: Reset refs when listSlug changes (navigating to different list)
  useEffect(() => {
    hasFetchedTasksRef.current = false
    lastListIdRef.current = null
    setList(null)
    setListRetryCount(0)
  }, [listSlug])

  // Changed: Effect to refresh data when refreshKey changes (triggered by parent after list update)
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      // Reset refs and trigger a fresh fetch
      hasFetchedTasksRef.current = false
      lastListIdRef.current = null
      isFetchingRef.current = false
      setListRetryCount(prev => prev) // Trigger re-fetch by updating state
      
      // Force a new fetch
      const refreshData = async () => {
        setIsLoading(true)
        const { found, foundList } = await fetchLists()
        
        if (foundList) {
          setList(foundList)
          await fetchTasksForList(foundList.id)
        } else if (!listSlug) {
          await fetchTasksForList(null)
        }
        
        setIsLoading(false)
      }
      
      refreshData()
    }
  }, [refreshKey, fetchLists, fetchTasksForList, listSlug])

  // Changed: Show loading while list is being found (for newly created lists)
  if (isLoading || (listSlug && !list && listRetryCount > 0 && listRetryCount < maxRetries)) {
    return (
      <div className="space-y-3">
        <SkeletonLoader variant="task" count={3} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  // Changed: Use TaskList with correct props interface
  return (
    <div>
      <TaskList 
        initialTasks={tasks}
        lists={lists}
        listSlug={listSlug}
      />
    </div>
  )
}