'use client'

import { useState, useCallback, useEffect } from 'react'
import { Task, List, CheckboxPosition } from '@/types'
import TaskCard from '@/components/TaskCard'
import AddTaskForm from '@/components/AddTaskForm'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/contexts/AuthContext'

interface ClientTaskListProps {
  initialTasks: Task[]
  lists: List[]
  listSlug?: string
  showAddForm?: boolean
}

export default function ClientTaskList({ 
  initialTasks, 
  lists, 
  listSlug,
  showAddForm = true 
}: ClientTaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set())
  const { checkboxPosition } = useAuth() // Changed: Get checkbox position from auth context
  
  // Changed: Sync with initialTasks when they change (e.g., after server refresh)
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])
  
  // Optimistic toggle - instant UI update
  const handleOptimisticToggle = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, metadata: { ...task.metadata, completed: !task.metadata.completed } }
        : task
    ))
    setPendingTasks(prev => new Set(prev).add(taskId))
  }, [])
  
  // Optimistic delete - instant UI removal
  const handleOptimisticDelete = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }, [])
  
  // Optimistic update - instant UI update for task properties
  const handleOptimisticUpdate = useCallback((taskId: string, updates: Partial<Task['metadata']>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, metadata: { ...task.metadata, ...updates } }
        : task
    ))
  }, [])
  
  // Changed: Optimistic add - instant UI addition
  const handleOptimisticAdd = useCallback((task: Task) => {
    setTasks(prev => [task, ...prev])
  }, [])
  
  // Clear pending state after sync
  const handleSyncComplete = useCallback((taskId: string) => {
    setPendingTasks(prev => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }, [])
  
  // Filter tasks for this list if listSlug is provided
  const filteredTasks = listSlug 
    ? tasks.filter(task => {
        const taskList = task.metadata.list
        if (typeof taskList === 'string') {
          // Changed: Match by list ID or slug
          const matchingList = lists.find(l => l.id === taskList || l.slug === taskList)
          return matchingList?.slug === listSlug
        }
        return taskList?.slug === listSlug
      })
    : tasks
  
  // Separate incomplete and completed tasks
  const incompleteTasks = filteredTasks.filter(task => !task.metadata.completed)
  const completedTasks = filteredTasks.filter(task => task.metadata.completed)
  
  return (
    <div className="space-y-3">
      {/* Changed: Show add form at top if enabled, pass checkbox position */}
      {showAddForm && (
        <AddTaskForm 
          lists={lists} 
          listSlug={listSlug} 
          onOptimisticAdd={handleOptimisticAdd}
          checkboxPosition={checkboxPosition}
        />
      )}
      
      {/* Incomplete tasks */}
      {incompleteTasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          lists={lists}
          onOptimisticToggle={handleOptimisticToggle}
          onOptimisticDelete={handleOptimisticDelete}
          onOptimisticUpdate={handleOptimisticUpdate}
          onSyncComplete={handleSyncComplete}
          checkboxPosition={checkboxPosition}
        />
      ))}
      
      {/* Empty state when no incomplete tasks */}
      {incompleteTasks.length === 0 && completedTasks.length === 0 && !showAddForm && (
        <EmptyState listSlug={listSlug} />
      )}
      
      {/* Completed tasks section */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                lists={lists}
                onOptimisticToggle={handleOptimisticToggle}
                onOptimisticDelete={handleOptimisticDelete}
                onOptimisticUpdate={handleOptimisticUpdate}
                onSyncComplete={handleSyncComplete}
                checkboxPosition={checkboxPosition}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}