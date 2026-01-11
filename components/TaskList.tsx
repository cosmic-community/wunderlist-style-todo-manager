'use client'

import Link from 'next/link'
import { useCallback, useState, useEffect, useRef } from 'react'
import { Task, List } from '@/types'
import TaskCard from '@/components/TaskCard'
import AddTaskForm from '@/components/AddTaskForm'
import EmptyState from '@/components/EmptyState'
import { ChevronRight, Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface TaskListProps {
  initialTasks: Task[]
  lists: List[]
  listSlug?: string
  onScrollToTop?: () => void
  onOpenMenu?: () => void
}

// Track pending state changes for a task
interface PendingTaskState {
  completed?: boolean
  // Add other fields here as needed for other optimistic updates
}

export default function TaskList({ initialTasks, lists, listSlug, onScrollToTop, onOpenMenu }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const mountedRef = useRef(true)
  const { isAuthenticated } = useAuth()
  // Track pending state changes for existing tasks (keyed by task ID)
  const pendingStateChangesRef = useRef<Map<string, PendingTaskState>>(new Map())
  // Changed: Track deleted task IDs to prevent them from reappearing on fetch
  const deletedTaskIdsRef = useRef<Set<string>>(new Set())
  // Changed: Track tasks that are currently celebrating (showing confetti)
  const [celebratingTasks, setCelebratingTasks] = useState<Set<string>>(new Set())
  // Changed: Track tasks with pending server updates to preserve optimistic state
  const pendingServerUpdatesRef = useRef<Set<string>>(new Set())

  // Changed: Get current list name for empty state
  const currentList = listSlug ? lists.find(l => l.slug === listSlug) : null
  const listName = currentList?.metadata?.name

  // Changed: Smart deduplication function to detect and merge duplicate tasks
  const deduplicateTasks = useCallback((taskList: Task[]): Task[] => {
    const seen = new Map<string, Task>()
    const result: Task[] = []

    for (const task of taskList) {
      // Skip deleted tasks
      if (deletedTaskIdsRef.current.has(task.id)) {
        continue
      }

      // Create a unique key based on title and list to detect duplicates
      // Use the first few characters of created_at as well to handle rapid additions
      const listId = typeof task.metadata.list === 'string'
        ? task.metadata.list
        : task.metadata.list?.id || ''

      const uniqueKey = `${task.metadata.title.trim().toLowerCase()}|${listId}`

      const existingTask = seen.get(uniqueKey)

      if (existingTask) {
        // We found a duplicate! Decide which one to keep
        // Prefer the one with a real ID (not starting with 'temp-')
        const keepNew = !task.id.startsWith('temp-')
        const keepExisting = !existingTask.id.startsWith('temp-')

        if (keepNew && !keepExisting) {
          // New task is real, existing is temp - replace it
          seen.set(uniqueKey, task)
          // Replace in result array
          const index = result.findIndex(t => t.id === existingTask.id)
          if (index !== -1) {
            result[index] = task
          }
        } else if (!keepNew && keepExisting) {
          // Existing is real, new is temp - keep existing, skip new
          continue
        } else if (keepNew && keepExisting) {
          // Both are real IDs - keep the one with the earlier created_at
          const newTime = new Date(task.created_at || '').getTime()
          const existingTime = new Date(existingTask.created_at || '').getTime()

          if (newTime && existingTime && newTime < existingTime) {
            seen.set(uniqueKey, task)
            const index = result.findIndex(t => t.id === existingTask.id)
            if (index !== -1) {
              result[index] = task
            }
          }
          // Otherwise keep existing
        }
        // If both are temp, keep existing (shouldn't happen in practice)
      } else {
        // First time seeing this task
        seen.set(uniqueKey, task)
        result.push(task)
      }
    }

    return result
  }, [])

  // Changed: Smart merge of initialTasks with local state to preserve optimistic updates
  useEffect(() => {
    setTasks(prevTasks => {
      // If we have no previous tasks, just use initialTasks with deduplication
      if (prevTasks.length === 0) {
        return deduplicateTasks(initialTasks.filter(t => !deletedTaskIdsRef.current.has(t.id)))
      }

      // Create a map of current tasks by ID for quick lookup
      const currentTasksMap = new Map(prevTasks.map(t => [t.id, t]))

      // Build the merged task list
      const mergedTasks: Task[] = []
      const processedIds = new Set<string>()

      // First, process tasks that exist in server response
      for (const serverTask of initialTasks) {
        // Skip deleted tasks
        if (deletedTaskIdsRef.current.has(serverTask.id)) {
          continue
        }

        const localTask = currentTasksMap.get(serverTask.id)
        const pendingState = pendingStateChangesRef.current.get(serverTask.id)
        const hasPendingUpdate = pendingServerUpdatesRef.current.has(serverTask.id)

        if (localTask && (pendingState || hasPendingUpdate)) {
          // Changed: Preserve local optimistic state if there's a pending update
          // But merge in any other updated fields from server
          mergedTasks.push({
            ...serverTask,
            metadata: {
              ...serverTask.metadata,
              // Preserve local completed state if pending
              completed: pendingState?.completed !== undefined
                ? pendingState.completed
                : (hasPendingUpdate ? localTask.metadata.completed : serverTask.metadata.completed)
            }
          })
        } else {
          // No pending state, use server data
          mergedTasks.push(serverTask)
        }

        processedIds.add(serverTask.id)
      }

      // Changed: Add optimistic tasks that haven't arrived from server yet
      // These are temp tasks that will be deduplicated when real version arrives
      for (const localTask of prevTasks) {
        if (!processedIds.has(localTask.id) && localTask.id.startsWith('temp-')) {
          if (!deletedTaskIdsRef.current.has(localTask.id)) {
            mergedTasks.push(localTask)
          }
        }
      }

      // Changed: Apply deduplication to handle optimistic tasks being replaced by real ones
      return deduplicateTasks(mergedTasks)
    })
  }, [initialTasks, deduplicateTasks])

  // Changed: Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  // Handlers for optimistic updates
  // Changed: Scroll to top after adding task to fix mobile scroll issues
  const handleOptimisticAdd = useCallback((task: Task) => {
    setTasks(prev => deduplicateTasks([task, ...prev]))
    // Scroll to top after a brief delay to ensure the task is rendered
    if (onScrollToTop) {
      setTimeout(() => {
        onScrollToTop()
      }, 50)
    }
  }, [deduplicateTasks, onScrollToTop])

  // Changed: Toggle handler - add to celebrating set when completing
  const handleOptimisticToggle = useCallback((taskId: string) => {
    // Changed: Mark this task as having a pending server update
    pendingServerUpdatesRef.current.add(taskId)

    setTasks(prev => {
      const task = prev.find(t => t.id === taskId)
      if (task) {
        // Track the new completed state as pending
        const newCompletedState = !task.metadata.completed
        pendingStateChangesRef.current.set(taskId, { completed: newCompletedState })

        // Changed: If task is becoming completed, add to celebrating set
        if (newCompletedState) {
          setCelebratingTasks(prevCelebrating => {
            const newSet = new Set(prevCelebrating)
            newSet.add(taskId)
            return newSet
          })
        }
      }

      return prev.map(task =>
        task.id === taskId
          ? { ...task, metadata: { ...task.metadata, completed: !task.metadata.completed } }
          : task
      )
    })
  }, [])

  // Changed: Handler for when animation completes - remove from celebrating set
  const handleAnimationComplete = useCallback((taskId: string) => {
    setCelebratingTasks(prev => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }, [])

  const handleOptimisticDelete = useCallback((taskId: string) => {
    // Changed: Add to deleted set to prevent reappearing on fetch
    deletedTaskIdsRef.current.add(taskId)

    // Remove from all pending tracking
    pendingStateChangesRef.current.delete(taskId)
    pendingServerUpdatesRef.current.delete(taskId)
    // Changed: Also remove from celebrating if deleting
    setCelebratingTasks(prev => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
    setTasks(prev => prev.filter(task => task.id !== taskId))

    // Changed: Clear the deleted ID after a delay to allow server sync
    // This prevents the task from reappearing during the delete request
    setTimeout(() => {
      deletedTaskIdsRef.current.delete(taskId)
    }, 10000)
  }, [])

  const handleOptimisticUpdate = useCallback((taskId: string, updates: Partial<Task['metadata']>) => {
    // Changed: Mark this task as having a pending server update
    pendingServerUpdatesRef.current.add(taskId)

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

  // Changed: Function to clear pending state for a task (called after successful server sync)
  const clearPendingState = useCallback((taskId: string) => {
    pendingStateChangesRef.current.delete(taskId)
    pendingServerUpdatesRef.current.delete(taskId)
  }, [])

  // Changed: Include celebrating tasks in pending list so they stay visible during animation
  const pendingTasks = tasks.filter(task => !task.metadata.completed || celebratingTasks.has(task.id))
  // Changed: Exclude celebrating tasks from completed list temporarily
  const completedTasks = tasks.filter(task => task.metadata.completed && !celebratingTasks.has(task.id))

  return (
    <>
      {/* Changed: Task list with proper spacing - added pb-28 for larger mobile bottom padding */}
      <div className="space-y-2.5 md:space-y-2 pb-28 md:pb-24">
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
            onAnimationComplete={handleAnimationComplete}
          />
        ))}

        {/* Changed: Completed Section - Collapsible - increased touch targets */}
        {completedTasks.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-3 md:py-2"
            >
              <ChevronRight className={`w-5 h-5 md:w-4 md:h-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`} />
              {/* Changed: Increased text size on mobile */}
              <span className="text-base md:text-sm font-medium">Completed ({completedTasks.length})</span>
            </button>

            {showCompleted && (
              <div className="space-y-2.5 md:space-y-2 mt-2">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    lists={lists}
                    onOptimisticToggle={handleOptimisticToggle}
                    onOptimisticDelete={handleOptimisticDelete}
                    onOptimisticUpdate={handleOptimisticUpdate}
                    onSyncComplete={clearPendingState}
                    onAnimationComplete={handleAnimationComplete}
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

      {/* Changed: Fixed Add Task Form at bottom - proper positioning with larger padding on mobile */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-20">
        {/* Demo notice for unauthenticated users - shown above add task form */}
        {!isAuthenticated && (
          <div className="bg-gray-50 dark:bg-black px-5 md:px-4 pt-4 pb-4">
            <div className="max-w-2xl mx-auto">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-base text-amber-800 dark:text-amber-200 leading-relaxed">
                  👋 You&apos;re viewing the <strong>public demo</strong>. <Link href="/signup" className="font-medium underline">Sign up</Link> to create your own private Cosmic todo experience!
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-800 p-5 md:p-4 safe-area-inset-bottom">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {/* Add Task Form - takes available space */}
            <div className="flex-1">
              <AddTaskForm
                lists={lists}
                listSlug={listSlug}
                onOptimisticAdd={handleOptimisticAdd}
              />
            </div>

            {/* Changed: Menu button - mobile only, secondary style with border */}
            {onOpenMenu && (
              <button
                onClick={onOpenMenu}
                className="md:hidden flex-shrink-0 p-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}