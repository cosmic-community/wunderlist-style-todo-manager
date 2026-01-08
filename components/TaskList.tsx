'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { Task, List } from '@/types'
import TaskCard from '@/components/TaskCard'
import AddTaskForm from '@/components/AddTaskForm'
import EmptyState from '@/components/EmptyState'
import { ChevronRight } from 'lucide-react'

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

  // Changed: Get current list name for empty state
  const currentList = listSlug ? lists.find(l => l.slug === listSlug) : null
  const listName = currentList?.metadata?.name

  // Changed: Update tasks when initialTasks prop changes (list navigation)
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // Changed: Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Handlers for optimistic updates
  const handleOptimisticAdd = useCallback((task: Task) => {
    // Track this as a pending/optimistic new task
    pendingNewTasksRef.current.add(task.id)
    setTasks(prev => [task, ...prev])
  }, [])

  // Changed: Updated toggle handler to track celebrating tasks with proper timing to match TaskCard animation
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
      
      return prev.map(task => 
        task.id === taskId 
          ? { ...task, metadata: { ...task.metadata, completed: !task.metadata.completed } }
          : task
      )
    })
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
      {/* Changed: Task list with bottom padding for fixed add form - added overflow-visible */}
      <div className="space-y-2 pb-24" style={{ overflow: 'visible' }}>
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
        
        {/* Changed: Improved Empty State */}
        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <EmptyState variant="tasks" listName={listName} />
        )}
      </div>
      
      {/* Changed: Fixed Add Task Form at bottom - increased z-index to be above task checkmarks */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 z-20">
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