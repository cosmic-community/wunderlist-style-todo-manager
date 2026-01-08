'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Task, List, TaskPriority } from '@/types'

interface EditTaskModalProps {
  task: Task
  lists: List[]
  onClose: () => void
  onOptimisticUpdate: (taskId: string, updates: Partial<Task['metadata']>) => void
}

export default function EditTaskModal({ task, lists, onClose, onOptimisticUpdate }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.metadata.title)
  const [description, setDescription] = useState(task.metadata.description || '')
  const [priority, setPriority] = useState<TaskPriority>(task.metadata.priority?.key || 'medium')
  const [dueDate, setDueDate] = useState(task.metadata.due_date || '')
  const [listId, setListId] = useState(
    task.metadata.list && typeof task.metadata.list === 'object' 
      ? task.metadata.list.id 
      : task.metadata.list || ''
  )
  const [isLoading, setIsLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Changed: Add escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Changed: Add click outside handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Optimistic update
    onOptimisticUpdate(task.id, {
      title,
      description: description || undefined,
      priority: { key: priority, value: priority.charAt(0).toUpperCase() + priority.slice(1) },
      due_date: dueDate || undefined,
      list: listId || undefined
    })

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          due_date: dueDate,
          list: listId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      onClose()
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      {/* Changed: Improved responsive modal with fixed header/footer and scrollable content */}
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700"
      >
        {/* Changed: Fixed header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Changed: Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4">
          <form id="edit-task-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Title
              </label>
              {/* Changed: Improved dark mode input styling */}
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Description
              </label>
              {/* Changed: Improved dark mode textarea styling */}
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Priority
              </label>
              {/* Changed: Improved dark mode select styling */}
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Due Date
              </label>
              {/* Changed: Improved dark mode date input styling */}
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            <div>
              <label htmlFor="list" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                List
              </label>
              {/* Changed: Improved dark mode select styling */}
              <select
                id="list"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="">No List</option>
                {lists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.metadata.name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Changed: Fixed footer with buttons */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex gap-3">
            {/* Changed: Improved dark mode button styling */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-task-form"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}