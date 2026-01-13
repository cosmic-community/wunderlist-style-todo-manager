'use client'

import { useState, useRef, useEffect } from 'react'
import { Task, List } from '@/types'
import { Plus } from 'lucide-react'

interface AddTaskFormProps {
  lists: List[]
  listSlug?: string
  onOptimisticAdd?: (task: Task) => void
}

export default function AddTaskForm({ lists, listSlug, onOptimisticAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shouldFocus, setShouldFocus] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when shouldFocus becomes true (after task submission)
  // Changed: Use preventScroll to avoid iOS scrolling the page when focusing
  useEffect(() => {
    if (shouldFocus && !isSubmitting) {
      inputRef.current?.focus({ preventScroll: true })
      setShouldFocus(false)
    }
  }, [shouldFocus, isSubmitting])

  // Get current list ID from slug
  const currentList = listSlug ? lists.find(l => l.slug === listSlug) : null
  const currentListId = currentList?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    const taskTitle = title.trim()
    setTitle('')

    // Changed: Create optimistic task with all required properties including 'type'
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      title: taskTitle,
      slug: taskTitle.toLowerCase().replace(/\s+/g, '-'),
      type: 'tasks', // Changed: Added required 'type' property
      created_at: new Date().toISOString(),
      metadata: {
        title: taskTitle,
        completed: false,
        list: currentListId || '',
        order: 0, // Changed: New tasks go to the top
        priority: { key: 'medium', value: 'Medium' } // Default priority
      }
    }

    // Add optimistically
    if (onOptimisticAdd) {
      onOptimisticAdd(optimisticTask)
    }

    // Send to server in background
    try {
      // Changed: Fixed API payload - use 'list' instead of 'list_id' to match API route
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          list: currentListId || '', // Changed: Use 'list' to match API route expectations
          order: 0, // New tasks go to the top
          priority: 'medium' // Default priority
        })
      })
    } catch (error) {
      console.error('Error creating task:', error)
      // Note: We could revert the optimistic add here if needed
    } finally {
      setIsSubmitting(false)
      setShouldFocus(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      {/* Changed: Increased icon size for mobile */}
      <div className="flex-shrink-0">
        <div className="w-7 h-7 md:w-6 md:h-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
          <Plus className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      
      {/* Changed: Increased text size and padding for mobile, min-w-0 allows shrinking */}
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a Task"
        autoCapitalize="words"
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-lg md:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 py-2"
        disabled={isSubmitting}
      />
      
      {title.trim() && (
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-shrink-0 px-4 py-2.5 md:py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium text-base md:text-sm transition-colors disabled:opacity-50"
        >
          Add
        </button>
      )}
    </form>
  )
}