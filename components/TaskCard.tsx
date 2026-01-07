'use client'

import { useState, useOptimistic, useEffect } from 'react'
import { Task, List } from '@/types'
import { Calendar, Flag, Trash2, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import EditTaskModal from '@/components/EditTaskModal'

interface TaskCardProps {
  task: Task
  lists: List[]
}

export default function TaskCard({ task, lists }: TaskCardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Optimistic state for task completion - syncs with task prop changes
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    task.metadata.completed,
    (state, newCompleted: boolean) => newCompleted
  )
  
  // Sync optimistic state when task prop changes (from server updates)
  useEffect(() => {
    setOptimisticCompleted(task.metadata.completed)
  }, [task.metadata.completed, setOptimisticCompleted])
  
  const handleToggleComplete = async () => {
    // Optimistically update UI immediately
    setOptimisticCompleted(!optimisticCompleted)
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !optimisticCompleted })
      })
      
      if (response.ok) {
        // Refresh to get latest data from server
        router.refresh()
      } else {
        // Revert on failure
        setOptimisticCompleted(task.metadata.completed)
      }
    } catch (error) {
      console.error('Error toggling task:', error)
      // Revert on error
      setOptimisticCompleted(task.metadata.completed)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all ${
        optimisticCompleted ? 'opacity-60' : ''
      } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            className="mt-1 flex-shrink-0"
            aria-label={optimisticCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              optimisticCompleted
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300 hover:border-blue-600'
            }`}>
              {optimisticCompleted && (
                <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              )}
            </div>
          </button>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-gray-900 transition-all ${
              optimisticCompleted ? 'line-through text-gray-500' : ''
            }`}>
              {task.metadata.title}
            </h3>
            
            {task.metadata.description && (
              <p className="text-sm text-gray-600 mt-1">{task.metadata.description}</p>
            )}
            
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {task.metadata.priority && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  getPriorityColor(task.metadata.priority.value)
                }`}>
                  <Flag className="w-3 h-3" />
                  {task.metadata.priority.value}
                </span>
              )}
              
              {task.metadata.due_date && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.metadata.due_date)}
                </span>
              )}
              
              {task.metadata.list && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.metadata.list.metadata.color || '#3b82f6' }}
                  />
                  {task.metadata.list.title}
                </span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              aria-label="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {isEditing && (
        <EditTaskModal
          task={task}
          lists={lists}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  )
}