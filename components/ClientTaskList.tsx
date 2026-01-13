'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Task, List } from '@/types'
import TaskList from './TaskList'
import SkeletonLoader from './SkeletonLoader'
import { useAuth } from '@/contexts/AuthContext'

interface ClientTaskListProps {
  listSlug?: string
  refreshKey?: number
  onScrollToTop?: () => void
  onOpenMenu?: () => void
}

// Changed: Polling interval for real-time updates (5 seconds)
const POLLING_INTERVAL = 5000

export default function ClientTaskList({ listSlug, refreshKey, onScrollToTop, onOpenMenu }: ClientTaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [list, setList] = useState<List | null>(null)
  // Changed: Start with isLoading true to show skeleton until data loads
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [listRetryCount, setListRetryCount] = useState(0)
  const maxRetries = 10
  
  // Changed: Track auth state to refetch on login/logout
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const prevAuthStateRef = useRef<boolean | null>(null)
  
  // Changed: Use refs to track fetch state and prevent infinite loops
  const isFetchingRef = useRef(false)
  const lastListIdRef = useRef<string | null>(null)
  const hasFetchedTasksRef = useRef(false)
  // Changed: Ref for polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  // Changed: Track if component is mounted
  const isMountedRef = useRef(true)
  // Changed: Track last fetch timestamp to detect changes
  const lastTasksHashRef = useRef<string>('')
  // Changed: Track the previous listSlug to detect navigation
  const prevListSlugRef = useRef<string | undefined>(listSlug)

  // Changed: Generate a simple hash of tasks for change detection
  const generateTasksHash = useCallback((taskList: Task[]): string => {
    return taskList
      .map(t => `${t.id}:${t.metadata.completed}:${t.metadata.title}:${t.metadata.order ?? ''}:${t.modified_at || ''}`)
      .sort()
      .join('|')
  }, [])

  // Changed: Fetch lists data - memoized without list dependency
  const fetchLists = useCallback(async (): Promise<{ found: boolean; foundList: List | null }> => {
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
      
      if (isMountedRef.current) {
        setLists(data.lists || [])
      }
      
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
  // Changed: Added silent mode for polling to avoid flashing loading states
  const fetchTasksForList = useCallback(async (listId: string | null, silent: boolean = false): Promise<Task[]> => {
    try {
      // Changed: Add cache-busting timestamp to prevent stale data
      const url = listSlug && listId 
        ? `/api/tasks?list=${listId}&_t=${Date.now()}` 
        : `/api/tasks?_t=${Date.now()}`
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      const fetchedTasks = data.tasks || []
      
      // Changed: Only update state if data actually changed (prevents unnecessary re-renders)
      const newHash = generateTasksHash(fetchedTasks)
      
      if (isMountedRef.current && (newHash !== lastTasksHashRef.current || !silent)) {
        lastTasksHashRef.current = newHash
        setTasks(fetchedTasks)
      }
      
      return fetchedTasks
    } catch (err) {
      console.error('Error fetching tasks:', err)
      if (!silent && isMountedRef.current) {
        setError('Failed to load tasks')
      }
      return []
    }
  }, [listSlug, generateTasksHash])

  // Changed: Polling function for real-time updates
  const pollForUpdates = useCallback(async () => {
    if (!isMountedRef.current || isFetchingRef.current) {
      return
    }

    // Changed: Silently fetch updates without showing loading state
    const currentListId = lastListIdRef.current
    
    if (listSlug && currentListId) {
      // Fetch tasks for the specific list
      await fetchTasksForList(currentListId, true)
    } else if (!listSlug) {
      // Fetch all tasks
      await fetchTasksForList(null, true)
    }
    
    // Changed: Also refresh lists to detect any changes (new lists, updated names, etc.)
    await fetchLists()
  }, [listSlug, fetchTasksForList, fetchLists])

  // Changed: Start polling when component mounts and data is loaded
  const startPolling = useCallback(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    // Start new polling interval
    pollingIntervalRef.current = setInterval(() => {
      pollForUpdates()
    }, POLLING_INTERVAL)
  }, [pollForUpdates])

  // Changed: Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Changed: Single effect for initial load and retry logic - prevents infinite loops
  useEffect(() => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return
    }
    
    const loadData = async () => {
      isFetchingRef.current = true
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
      
      if (isMountedRef.current) {
        setIsLoading(false)
      }
      isFetchingRef.current = false
      
      // Changed: Start polling after initial load completes
      startPolling()
    }
    
    loadData()
  }, [listSlug, listRetryCount, fetchLists, fetchTasksForList, startPolling])

  // Changed: Reset refs when listSlug changes (navigating to different list)
  useEffect(() => {
    // Only trigger loading state if the listSlug actually changed (not on initial mount)
    if (prevListSlugRef.current !== listSlug) {
      // Show loading skeleton when navigating to a different list
      setIsLoading(true)
      setTasks([]) // Clear old tasks to prevent flash of stale content
    }
    
    hasFetchedTasksRef.current = false
    lastListIdRef.current = null
    lastTasksHashRef.current = ''
    setList(null)
    setListRetryCount(0)
    
    // Update the previous slug ref
    prevListSlugRef.current = listSlug
  }, [listSlug])

  // Changed: Effect to refresh data when refreshKey changes (triggered by parent after list update)
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      // Reset refs and trigger a fresh fetch
      hasFetchedTasksRef.current = false
      lastListIdRef.current = null
      lastTasksHashRef.current = ''
      isFetchingRef.current = false
      setListRetryCount(prev => prev) // Trigger re-fetch by updating state
      
      // Force a new fetch
      const refreshData = async () => {
        const { found, foundList } = await fetchLists()
        
        if (foundList) {
          setList(foundList)
          lastListIdRef.current = foundList.id
          await fetchTasksForList(foundList.id)
        } else if (!listSlug) {
          await fetchTasksForList(null)
        }
      }
      
      refreshData()
    }
  }, [refreshKey, fetchLists, fetchTasksForList, listSlug])

  // Changed: Effect to refresh data when auth state changes (login/logout)
  useEffect(() => {
    // Skip if auth is still loading
    if (isAuthLoading) return

    const authStateChanged = prevAuthStateRef.current !== null && prevAuthStateRef.current !== isAuthenticated
    
    if (authStateChanged) {
      // Auth state changed - clear everything and refetch
      setTasks([])
      setLists([])
      setList(null)
      setIsLoading(true)
      hasFetchedTasksRef.current = false
      lastListIdRef.current = null
      lastTasksHashRef.current = ''
      isFetchingRef.current = false
      setListRetryCount(0)
      
      // Force a new fetch
      const refreshData = async () => {
        const { found, foundList } = await fetchLists()
        
        if (foundList) {
          setList(foundList)
          lastListIdRef.current = foundList.id
          await fetchTasksForList(foundList.id)
          hasFetchedTasksRef.current = true
        } else if (!listSlug) {
          await fetchTasksForList(null)
          hasFetchedTasksRef.current = true
        }
        
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
      
      refreshData()
    }
    
    prevAuthStateRef.current = isAuthenticated
  }, [isAuthenticated, isAuthLoading, fetchLists, fetchTasksForList, listSlug])

  // Changed: Cleanup polling on unmount and handle visibility changes
  useEffect(() => {
    isMountedRef.current = true
    
    // Changed: Handle tab visibility - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        // Resume polling and immediately fetch fresh data
        pollForUpdates()
        startPolling()
      }
    }
    
    // Changed: Handle window focus - refresh data when user returns to tab
    const handleFocus = () => {
      pollForUpdates()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      isMountedRef.current = false
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [stopPolling, startPolling, pollForUpdates])

  // Changed: Show loading skeleton when loading (initial load or navigating between lists)
  if (isLoading) {
    return <SkeletonLoader variant="task" count={3} />
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
        onScrollToTop={onScrollToTop}
        onOpenMenu={onOpenMenu}
      />
    </div>
  )
}