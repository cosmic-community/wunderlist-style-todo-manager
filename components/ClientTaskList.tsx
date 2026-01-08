'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import TaskCard from './TaskCard'
import AddTaskForm from './AddTaskForm'
import SkeletonLoader from './SkeletonLoader'
import type { Task, List } from '@/types'

interface ClientTaskListProps {
  listId?: string
  listSlug?: string
}

// Changed: Maximum time to wait for a new list to be created (30 seconds)
const MAX_POLL_TIME = 30000
// Changed: Polling interval (1 second)
const POLL_INTERVAL = 1000

export default function ClientTaskList({ listId, listSlug }: ClientTaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Changed: Track if we're waiting for list to be created
  const [isWaitingForList, setIsWaitingForList] = useState(false)
  // Changed: Track if list was found
  const [listFound, setListFound] = useState(false)
  // Changed: Add state for collapsible completed section
  const [showCompleted, setShowCompleted] = useState(false)
  // Changed: Track tasks that are currently celebrating (showing confetti + fade out)
  const [celebratingTasks, setCelebratingTasks] = useState<Map<string, number>>(new Map())
  // Changed: Track poll start time
  const pollStartTime = useRef<number | null>(null)
  // Changed: Track if component is mounted
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Fetch tasks and lists
  useEffect(() => {
    let pollTimeout: NodeJS.Timeout | null = null

    const fetchData = async () => {
      if (!isMounted.current) return

      try {
        // Fetch lists first to check if our list exists
        const listsResponse = await fetch('/api/lists')
        if (!isMounted.current) return
        
        if (listsResponse.ok) {
          const listsData = await listsResponse.json()
          const fetchedLists = listsData.lists || []
          setLists(fetchedLists)

          // Changed: Check if the target list exists (if we're looking for a specific list)
          if (listSlug) {
            const targetList = fetchedLists.find((l: List) => l.slug === listSlug)
            
            if (targetList) {
              // Changed: List found, fetch tasks
              setListFound(true)
              setIsWaitingForList(false)
              pollStartTime.current = null

              const tasksUrl = `/api/tasks?listSlug=${listSlug}`
              const tasksResponse = await fetch(tasksUrl)
              if (!isMounted.current) return
              
              if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json()
                setTasks(tasksData.tasks || [])
              }
              setIsLoading(false)
            } else {
              // Changed: List not found - check if we should keep polling
              if (pollStartTime.current === null) {
                pollStartTime.current = Date.now()
                setIsWaitingForList(true)
                setIsLoading(false)
              }

              const elapsed = Date.now() - pollStartTime.current

              if (elapsed < MAX_POLL_TIME) {
                // Changed: Keep polling - list might still be creating
                pollTimeout = setTimeout(fetchData, POLL_INTERVAL)
              } else {
                // Changed: Exceeded max poll time
                setIsWaitingForList(false)
                setIsLoading(false)
              }
            }
          } else if (listId) {
            // Changed: Fetch by listId
            setListFound(true)
            const tasksResponse = await fetch(`/api/tasks?list=${listId}`)
            if (!isMounted.current) return
            
            if (tasksResponse.ok) {
              const tasksData = await tasksResponse.json()
              setTasks(tasksData.tasks || [])
            }
            setIsLoading(false)
          } else {
            // Changed: No specific list, fetch all tasks
            setListFound(true)
            const tasksResponse = await fetch('/api/tasks')
            if (!isMounted.current) return
            
            if (tasksResponse.ok) {
              const tasksData = await tasksResponse.json()
              setTasks(tasksData.tasks || [])
            }
            setIsLoading(false)
          }
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    // Changed: Cleanup function
    return () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout)
      }
    }
  }, [listId, listSlug])

  // Changed: Updated toggle handler to track celebrating tasks with proper timing
  const handleOptimisticToggle = useCallback((taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId)
      if (task) {
        const newCompletedState = !task.metadata.completed
        
        // Changed: If task is becoming completed, add to celebrating map with timestamp
        if (newCompletedState) {
          setCelebratingTasks(prevCelebrating => {
            const newMap = new Map(prevCelebrating)
            newMap.set(taskId, Date.now())
            return newMap
          })
          
          // Changed: Increased delay to 1800ms to match TaskCard's full animation duration
          // TaskCard shows: 1200ms confetti + 500ms collapse + 100ms buffer = 1800ms total
          setTimeout(() => {
            setCelebratingTasks(prevCelebrating => {
              const newMap = new Map(prevCelebrating)
              newMap.delete(taskId)
              return newMap
            })
          }, 1800)
        }
      }
      
      return prev.map(t => 
        t.id === taskId 
          ? { ...t, metadata: { ...t.metadata, completed: !t.metadata.completed } }
          : t
      )
    })
  }, [])

  const handleOptimisticDelete = useCallback((taskId: string) => {
    // Changed: Also remove from celebrating if deleting
    setCelebratingTasks(prev => {
      const newMap = new Map(prev)
      newMap.delete(taskId)
      return newMap
    })
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  const handleOptimisticUpdate = useCallback((taskId: string, updates: Partial<Task['metadata']>) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, metadata: { ...t.metadata, ...updates } }
        : t
    ))
  }, [])

  const handleOptimisticAdd = useCallback((task: Task) => {
    setTasks(prev => [task, ...prev])
  }, [])

  // Changed: Include celebrating tasks in incomplete list so they stay visible during animation
  const incompleteTasks = tasks.filter(t => !t.metadata.completed || celebratingTasks.has(t.id))
  // Changed: Exclude celebrating tasks from completed list temporarily
  const completedTasks = tasks.filter(t => t.metadata.completed && !celebratingTasks.has(t.id))

  // Changed: Merged loading state - show improved skeleton with waiting message when applicable
  if (isLoading || isWaitingForList) {
    return (
      <div className="flex flex-col h-full">
        {/* Skeleton task list matching the loaded UI structure */}
        <div className="flex-1 pb-24 space-y-6" style={{ overflow: 'visible' }}>
          {/* Changed: Show waiting message when polling for list */}
          {isWaitingForList && (
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse text-center">
              Setting up your list...
            </p>
          )}
          <div className="space-y-4" style={{ overflow: 'visible' }}>
            {/* Changed: Use 5 skeleton items for initial load, 3 when waiting for list */}
            <SkeletonLoader variant="task" count={isWaitingForList ? 3 : 5} />
          </div>
        </div>
        
        {/* Changed: Fixed add task form skeleton at bottom */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-800 z-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-800 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    // Changed: Use flex column with relative positioning for fixed add form
    <div className="flex flex-col h-full">
      {/* Changed: Scrollable task area with overflow-visible for confetti */}
      <div className="flex-1 pb-24 space-y-6" style={{ overflow: 'visible' }}>
        <div className="space-y-4" style={{ overflow: 'visible' }}>
          {incompleteTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              lists={lists}
              onOptimisticToggle={handleOptimisticToggle}
              onOptimisticDelete={handleOptimisticDelete}
              onOptimisticUpdate={handleOptimisticUpdate}
            />
          ))}
        </div>

        {/* Changed: Collapsible completed section */}
        {completedTasks.length > 0 && (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-2 w-full"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`} />
              <span className="text-sm font-medium">
                Completed ({completedTasks.length})
              </span>
            </button>
            
            {showCompleted && (
              <div className="space-y-4 mt-2">
                {completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    lists={lists}
                    onOptimisticToggle={handleOptimisticToggle}
                    onOptimisticDelete={handleOptimisticDelete}
                    onOptimisticUpdate={handleOptimisticUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Changed: Fixed add task form at bottom - increased z-index to be above task checkmarks */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-800 z-20">
        <div className="max-w-2xl mx-auto">
          <AddTaskForm
            lists={lists}
            listSlug={listSlug}
            onOptimisticAdd={handleOptimisticAdd}
          />
        </div>
      </div>
    </div>
  )
}