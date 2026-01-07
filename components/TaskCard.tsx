'use client'

import { useState } from 'react'
import { Task, List } from '@/types'
import { Trash2 } from 'lucide-react'

interface TaskCardProps {
  task: Task
  lists: List[]
  onOptimisticToggle: (taskId: string) => void
  onOptimisticDelete: (taskId: string) => void
  onOptimisticUpdate: (taskId: string, updates: Partial<Task['metadata']>) => void
  onSyncComplete?: (taskId: string) => void
}

export default function TaskCard({ 
  task, 
  onOptimisticToggle,
  onOptimisticDelete,
  onSyncComplete
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const handleToggleComplete = async () => {
    if (isUpdating) return
    setIsUpdating(true)
    
    // Optimistic update - instant feedback
    onOptimisticToggle(task.id)
    
    // Background sync with server
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.metadata.completed })
      })
      
      if (response.ok && onSyncComplete) {
        // Server confirmed the change, clear pending state
        onSyncComplete(task.id)
      }
    } catch (error) {
      console.error('Error toggling task:', error)
      // Revert on error
      onOptimisticToggle(task.id)
    } finally {
      setIsUpdating(false)
    }
  }
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleting) return
    
    setIsDeleting(true)
    
    // Optimistic delete - instant feedback
    onOptimisticDelete(task.id)
    
    // Background sync with server
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting task:', error)
      // Note: We don't revert on error since the task is already removed from UI
      // A page refresh will restore it if the delete failed
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }
  
  return (
    <div className="relative">
      <div 
        className="bg-white dark:bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-800"
        onClick={handleToggleComplete}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggleComplete()
          }}
          className="flex-shrink-0"
          aria-label={task.metadata.completed ? 'Mark as incomplete' : 'Mark as complete'}
          disabled={isUpdating}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.metadata.completed
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}>
            {task.metadata.completed && (
              <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            )}
          </div>
        </button>
        
        {/* Title */}
        <span className={`flex-1 text-base transition-all ${
          task.metadata.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'
        }`}>
          {task.metadata.title}
        </span>
        
        {/* Delete button - only show for completed tasks */}
        {task.metadata.completed && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteConfirm(true)
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            aria-label="Delete task"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Delete Confirmation Popover */}
      {showDeleteConfirm && (
        <div className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[200px]">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Delete this task?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(false)
              }}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}