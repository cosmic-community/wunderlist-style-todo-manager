'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { Task, List } from '@/types'
import TaskCard from '@/components/TaskCard'
import AddTaskForm from '@/components/AddTaskForm'
import { ChevronRight, Loader2 } from 'lucide-react'

interface TaskListProps {
  initialTasks: Task[]
  lists: List[]
  listSlug?: string
}

// Track pending state changes for a task
interface PendingTaskState {
  completed?: boolean
  // Add other fields here as needed for other optimistic updates
}

export default function TaskList({ initialTasks, lists, listSlug }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(true)
  // Track temporary task IDs for newly added tasks
  const pendingNewTasksRef = useRef<Set<string>>(new Set())
  // Track pending state changes for existing tasks (keyed by task ID)
  const pendingStateChangesRef = useRef<Map<string, PendingTaskState>>(new Map())
  // Changed: Track deleted task IDs to prevent them from reappearing on fetch
  const deletedTaskIdsRef = useRef<Set<string>>(new Set())
  // Changed: Track tasks that are currently celebrating (showing confetti + fade out)
  // Now stores timestamp when animation started for more precise timing
  const [celebratingTasks, setCelebratingTasks] = useState<Map<string, number>>(new Map())

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    // Changed: Skip fetch if there are pending deletes to avoid race conditions
    if (deletedTaskIdsRef.current.size > 0) {
      return
    }
    
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      
      if (mountedRef.current) {
        // Filter by list if listSlug is provided
        let filteredTasks = data.tasks as Task[]
        if (listSlug) {
          filteredTasks = filteredTasks.filter(
            task => task.metadata.list?.slug === listSlug
          )
        }
        
        // Changed: Filter out any tasks that were recently deleted (to handle race conditions)
        filteredTasks = filteredTasks.filter(
          task => !deletedTaskIdsRef.current.has(task.id)
        )
        
        // Merge server tasks with pending optimistic state
        setTasks(prevTasks => {
          // Handle pending new tasks (tasks not yet on server)
          const pendingNewTasks = prevTasks.filter(task => 
            pendingNewTasksRef.current.has(task.id)
          )
          
          // Check if any pending new tasks now exist on server (by matching title)
          const serverTaskTitles = new Set(filteredTasks.map(t => t.metadata.title))
          
          // Remove pending new tasks that are now on server
          pendingNewTasks.forEach(pendingTask => {
            if (serverTaskTitles.has(pendingTask.metadata.title)) {
              pendingNewTasksRef.current.delete(pendingTask.id)
            }
          })
          
          // Keep only pending new tasks not yet on server
          const stillPendingNewTasks = pendingNewTasks.filter(task => 
            pendingNewTasksRef.current.has(task.id)
          )
          
          // Apply pending state changes to server tasks
          const tasksWithPendingState = filteredTasks.map(serverTask => {
            const pendingState = pendingStateChangesRef.current.get(serverTask.id)
            if (pendingState) {
              // Check if server state now matches our optimistic state
              // If so, clear the pending state
              if (pendingState.completed !== undefined && 
                  serverTask.metadata.completed === pendingState.completed) {
                pendingStateChangesRef.current.delete(serverTask.id)
                return serverTask
              }
              
              // Server doesn't match yet, keep our optimistic state
              return {
                ...serverTask,
                metadata: {
                  ...serverTask.metadata,
                  ...(pendingState.completed !== undefined && { completed: pendingState.completed })
                }
              }
            }
            return serverTask
          })
          
          // Combine: pending new tasks first, then server tasks with applied pending state
          return [...stillPendingNewTasks, ...tasksWithPendingState]
        })
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }, [listSlug])

  // Initial load and polling for real-time updates
  useEffect(() => {
    mountedRef.current = true
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchTasks, 3000)
    
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [fetchTasks])

  // Handlers for optimistic updates
  const handleOptimisticAdd = useCallback((task: Task) => {
    // Track this as a pending/optimistic new task
    pendingNewTasksRef.current.add(task.id)
    setTasks(prev => [task, ...prev])
    // Don't immediately fetch - let the polling handle it
    // This prevents the flicker where the task disappears then reappears
  }, [])

  // Changed: Updated toggle handler to track celebrating tasks with smoother timing
  const handleOptimisticToggle = useCallback((taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId)
      if (task) {
        // Track the new completed state as pending
        const newCompletedState = !task.metadata.completed
        pendingStateChangesRef.current.set(taskId, { completed: newCompletedState })
        
        // Changed: If task is becoming completed, add to celebrating map with timestamp
        if (newCompletedState) {
          setCelebratingTasks(prevCelebrating => {
            const newMap = new Map(prevCelebrating)
            newMap.set(taskId, Date.now())
            return newMap
          })
          
          // Changed: Remove from celebrating after animation fully completes (1000ms to match TaskCard)
          setTimeout(() => {
            setCelebratingTasks(prevCelebrating => {
              const newMap = new Map(prevCelebrating)
              newMap.delete(taskId)
              return newMap
            })
          }, 1000)
        }
      }
      
      return prev.map(task => 
        task.id === taskId 
          ? { ...task, metadata: { ...task.metadata, completed: !task.metadata.completed } }
          : task
      )
    })
    // Don't immediately fetch - let the polling handle it
    // This prevents the flicker where the task reverts then updates
  }, [])

  const handleOptimisticDelete = useCallback((taskId: string) => {
    // Changed: Add to deleted set to prevent reappearing on fetch
    deletedTaskIdsRef.current.add(taskId)
    
    // Remove from all pending tracking
    pendingNewTasksRef.current.delete(taskId)
    pendingStateChangesRef.current.delete(taskId)
    // Changed: Also remove from celebrating if deleting
    setCelebratingTasks(prev => {
      const newMap = new Map(prev)
      newMap.delete(taskId)
      return newMap
    })
    setTasks(prev => prev.filter(task => task.id !== taskId))
    
    // Changed: Clear the deleted ID after a delay to allow server sync
    // This prevents the task from reappearing during the delete request
    setTimeout(() => {
      deletedTaskIdsRef.current.delete(taskId)
    }, 5000)
  }, [])

  const handleOptimisticUpdate = useCallback((taskId: string, updates: Partial<Task['metadata']>) => {
    // Track completed state if it's being updated
    if (updates.completed !== undefined) {
      const currentPending = pendingStateChangesRef.current.get(taskId) || {}
      pendingStateChangesRef.current.set(taskId, { ...currentPending, completed: updates.completed })
    }
    
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, metadata: { ...task.metadata, ...updates } }
        : task
    ))
    // Don't immediately fetch - let the polling handle it
  }, [])

  // Function to clear pending state for a task (called after successful server sync)
  const clearPendingState = useCallback((taskId: string) => {
    pendingStateChangesRef.current.delete(taskId)
  }, [])

  // Changed: Include celebrating tasks in pending list so they stay visible during animation
  const pendingTasks = tasks.filter(task => !task.metadata.completed || celebratingTasks.has(task.id))
  // Changed: Exclude celebrating tasks from completed list temporarily
  const completedTasks = tasks.filter(task => task.metadata.completed && !celebratingTasks.has(task.id))
  
  return (
    <>
      {/* Changed: Task list with bottom padding for fixed add form */}
      <div className="space-y-2 pb-24">
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}
        
        {/* Pending Tasks */}
        {pendingTasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            lists={lists}
            onOptimisticToggle={handleOptimisticToggle}
            onOptimisticDelete={handleOptimisticDelete}
            onOptimisticUpdate={handleOptimisticUpdate}
            onSyncComplete={clearPendingState}
          />
        ))}
        
        {/* Completed Section - Collapsible */}
        {completedTasks.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-2"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`} />
              <span className="text-sm font-medium">Completed ({completedTasks.length})</span>
            </button>
            
            {showCompleted && (
              <div className="space-y-2 mt-2">
                {completedTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    lists={lists}
                    onOptimisticToggle={handleOptimisticToggle}
                    onOptimisticDelete={handleOptimisticDelete}
                    onOptimisticUpdate={handleOptimisticUpdate}
                    onSyncComplete={clearPendingState}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Empty State */}
        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No tasks yet. Add your first task below!</p>
          </div>
        )}
      </div>
      
      {/* Changed: Fixed Add Task Form at bottom */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 z-10">
        <div className="max-w-2xl mx-auto">
          <AddTaskForm 
            lists={lists} 
            listSlug={listSlug} 
            onOptimisticAdd={handleOptimisticAdd}
          />
        </div>
      </div>
    </>
  )
}