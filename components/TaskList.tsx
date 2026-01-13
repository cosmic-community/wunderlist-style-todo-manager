'use client'

import Link from 'next/link'
import { useCallback, useState, useEffect, useRef } from 'react'
import { Task, List } from '@/types'
import TaskCard from '@/components/TaskCard'
import AddTaskForm from '@/components/AddTaskForm'
import EmptyState from '@/components/EmptyState'
import AllDoneCelebration from '@/components/AllDoneCelebration'
import { ChevronRight, Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

// Sortable wrapper component for TaskCard
interface SortableTaskCardProps {
  task: Task
  lists: List[]
  onOptimisticToggle: (taskId: string) => void
  onOptimisticDelete: (taskId: string) => void
  onOptimisticUpdate: (taskId: string, updates: Partial<Task['metadata']>) => void
  onSyncComplete: (taskId: string) => void
  onAnimationComplete: (taskId: string) => void
  onModalOpenChange: (isOpen: boolean) => void
  isDragDisabled: boolean
}

function SortableTaskCard({
  task,
  lists,
  onOptimisticToggle,
  onOptimisticDelete,
  onOptimisticUpdate,
  onSyncComplete,
  onAnimationComplete,
  onModalOpenChange,
  isDragDisabled,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isDragDisabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        lists={lists}
        onOptimisticToggle={onOptimisticToggle}
        onOptimisticDelete={onOptimisticDelete}
        onOptimisticUpdate={onOptimisticUpdate}
        onSyncComplete={onSyncComplete}
        onAnimationComplete={onAnimationComplete}
        isDragging={isDragging}
        showDragHandle={true}
        dragHandleListeners={isDragDisabled ? undefined : listeners}
        dragHandleAttributes={attributes}
        onModalOpenChange={onModalOpenChange}
      />
    </div>
  )
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
  // Changed: Track active dragging task for overlay
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  // Changed: Track if we're in the middle of a reorder operation
  const isReorderingRef = useRef(false)
  // Changed: Store local order values to preserve during server sync
  const localOrderMapRef = useRef<Map<string, number>>(new Map())
  // Changed: AbortController to cancel pending reorder requests
  const reorderAbortControllerRef = useRef<AbortController | null>(null)
  // Changed: Track if any modal is open to disable dragging
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Changed: Track if we should show the "all done" celebration
  const [showAllDoneCelebration, setShowAllDoneCelebration] = useState(false)
  // Changed: Track if user just completed a task (for triggering celebration)
  const justCompletedTaskRef = useRef(false)

  // Changed: Set up drag and drop sensors with touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold before drag starts on touch
        tolerance: 5, // Allow 5px movement during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

        // Check if we have a local order value to preserve
        const localOrder = localOrderMapRef.current.get(serverTask.id)
        const shouldPreserveOrder = isReorderingRef.current && localOrder !== undefined

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
                : (hasPendingUpdate ? localTask.metadata.completed : serverTask.metadata.completed),
              // Preserve local order if we're reordering
              order: shouldPreserveOrder ? localOrder : serverTask.metadata.order
            }
          })
        } else {
          // No pending state, use server data but preserve order if reordering
          mergedTasks.push({
            ...serverTask,
            metadata: {
              ...serverTask.metadata,
              order: shouldPreserveOrder ? localOrder : serverTask.metadata.order
            }
          })
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

  // Changed: Ref for celebration timer
  const celebrationTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Changed: Detect when all tasks are completed and show celebration
  useEffect(() => {
    // Only check if user just completed a task
    if (!justCompletedTaskRef.current) {
      return
    }

    // Calculate real pending tasks (excluding celebrating ones since they're about to be completed)
    const realPendingCount = tasks.filter(
      task => !task.metadata.completed && !celebratingTasks.has(task.id)
    ).length
    const totalTasks = tasks.length

    // Only show celebration if:
    // 1. User just completed a task
    // 2. Now we have 0 pending tasks (all completed)
    // 3. We have tasks (not an empty list)
    // 4. No timer already running
    const shouldCelebrate =
      realPendingCount === 0 &&
      totalTasks > 0 &&
      !celebrationTimerRef.current

    if (shouldCelebrate) {
      // Reset the flag
      justCompletedTaskRef.current = false

      // Wait a brief moment before showing the celebration
      celebrationTimerRef.current = setTimeout(() => {
        setShowAllDoneCelebration(true)
        celebrationTimerRef.current = null
      }, 400)
    } else {
      // Reset the flag if we're not celebrating
      justCompletedTaskRef.current = false
    }
  }, [tasks, celebratingTasks])

  // Changed: Cleanup timer on unmount only
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current)
      }
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

        // Changed: If task is becoming completed, add to celebrating set and mark that user just completed a task
        if (newCompletedState) {
          justCompletedTaskRef.current = true
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

  // Changed: Handler for modal open/close to disable dragging when modal is open
  const handleModalOpenChange = useCallback((isOpen: boolean) => {
    setIsModalOpen(isOpen)
  }, [])

  // Changed: Handler for when the all-done celebration completes
  const handleCelebrationComplete = useCallback(() => {
    setShowAllDoneCelebration(false)
  }, [])

  // Changed: Handle drag start - store the active task for the overlay
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }, [tasks])

  // Changed: Handle drag end - reorder tasks and persist to API
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || active.id === over.id) {
      return
    }

    // Get only pending (non-completed) tasks for reordering - SORTED by current order
    const pendingTasksList = tasks
      .filter(task => !task.metadata.completed || celebratingTasks.has(task.id))
      .sort((a, b) => {
        const orderA = a.metadata.order ?? Infinity
        const orderB = b.metadata.order ?? Infinity
        if (orderA !== orderB) return orderA - orderB
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })
    
    const oldIndex = pendingTasksList.findIndex(t => t.id === active.id)
    const newIndex = pendingTasksList.findIndex(t => t.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Reorder the pending tasks
    const reorderedPendingTasks = arrayMove(pendingTasksList, oldIndex, newIndex)

    // Assign new order values
    const updatedPendingTasks = reorderedPendingTasks.map((task, index) => ({
      ...task,
      metadata: { ...task.metadata, order: index }
    }))

    // Store local order values to preserve during server sync
    isReorderingRef.current = true
    localOrderMapRef.current.clear()
    updatedPendingTasks.forEach((task, index) => {
      localOrderMapRef.current.set(task.id, index)
    })

    // Merge back with completed tasks - update order values in the full tasks array
    const newTasks = tasks.map(task => {
      const updatedTask = updatedPendingTasks.find(t => t.id === task.id)
      if (updatedTask) {
        return updatedTask
      }
      return task
    })

    // Optimistically update local state
    setTasks(newTasks)

    // Persist to server
    try {
      // Abort any pending reorder request
      if (reorderAbortControllerRef.current) {
        reorderAbortControllerRef.current.abort()
      }
      
      // Create new abort controller for this request
      reorderAbortControllerRef.current = new AbortController()
      
      const reorderData = updatedPendingTasks.map((task, index) => ({
        id: task.id,
        order: index
      }))

      console.log('Sending reorder request:', JSON.stringify(reorderData, null, 2))

      const response = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: reorderData }),
        signal: reorderAbortControllerRef.current.signal
      })

      const result = await response.json()
      console.log('Reorder response:', JSON.stringify(result, null, 2))

      if (!response.ok) {
        console.error('Reorder failed:', result)
        // Revert on error
        isReorderingRef.current = false
        localOrderMapRef.current.clear()
        reorderAbortControllerRef.current = null
        setTasks(tasks)
      } else {
        // Success - clear reordering flag after a delay to let server catch up
        setTimeout(() => {
          isReorderingRef.current = false
          localOrderMapRef.current.clear()
          reorderAbortControllerRef.current = null
        }, 2000)
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Reorder request aborted')
        return
      }
      console.error('Error saving task order:', error)
      // Revert on error
      isReorderingRef.current = false
      localOrderMapRef.current.clear()
      reorderAbortControllerRef.current = null
      setTasks(tasks)
    }
  }, [tasks, celebratingTasks])

  // Changed: Include celebrating tasks in pending list so they stay visible during animation
  // Sort by order field if available, otherwise by created_at
  const pendingTasks = tasks
    .filter(task => !task.metadata.completed || celebratingTasks.has(task.id))
    .sort((a, b) => {
      const orderA = a.metadata.order ?? Infinity
      const orderB = b.metadata.order ?? Infinity
      if (orderA !== orderB) return orderA - orderB
      // Fall back to created_at for tasks without order
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  // Changed: Exclude celebrating tasks from completed list temporarily
  const completedTasks = tasks.filter(task => task.metadata.completed && !celebratingTasks.has(task.id))

  return (
    <>
      {/* Changed: Task list with proper spacing - added pb-28 for larger mobile bottom padding */}
      <div className="space-y-2.5 md:space-y-2 pb-28 md:pb-24">
        {/* Pending Tasks - with drag and drop support */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pendingTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5 md:space-y-2">
              {pendingTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  lists={lists}
                  onOptimisticToggle={handleOptimisticToggle}
                  onOptimisticDelete={handleOptimisticDelete}
                  onOptimisticUpdate={handleOptimisticUpdate}
                  onSyncComplete={clearPendingState}
                  onAnimationComplete={handleAnimationComplete}
                  onModalOpenChange={handleModalOpenChange}
                  isDragDisabled={isModalOpen}
                />
              ))}
            </div>
          </SortableContext>

          {/* Drag overlay for smooth visual feedback */}
          <DragOverlay>
            {activeTask ? (
              <div className="opacity-90">
                <TaskCard
                  task={activeTask}
                  lists={lists}
                  onOptimisticToggle={() => {}}
                  onOptimisticDelete={() => {}}
                  onOptimisticUpdate={() => {}}
                  isDragging={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

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
      {/* z-30 ensures it's above sticky header (z-20) but below modals (z-[100]) */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-30">
        {/* Demo notice for unauthenticated users - shown above add task form */}
        {!isAuthenticated && (
          <div className="bg-gray-50 dark:bg-black px-5 md:px-4 pt-4 pb-4">
            <div className="max-w-2xl mx-auto">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-base text-amber-800 dark:text-amber-200 leading-relaxed">
                  👋 You&apos;re viewing the <strong>public demo</strong>.{' '}
                  <Link href="/signup" className="font-medium underline">
                    Sign up
                  </Link>
                  {' '}to create your own private Cosmic todo experience!
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-800 p-5 md:p-4 safe-area-inset-bottom">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {/* Add Task Form - takes available space, min-w-0 allows shrinking */}
            <div className="flex-1 min-w-0">
              <AddTaskForm
                lists={lists}
                listSlug={listSlug}
                onOptimisticAdd={handleOptimisticAdd}
              />
            </div>

            {/* Changed: Menu button - mobile only, secondary style with border, flex-shrink-0 keeps it fixed */}
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

      {/* Changed: All done celebration when all tasks are completed */}
      {showAllDoneCelebration && (
        <AllDoneCelebration onComplete={handleCelebrationComplete} />
      )}
    </>
  )
}