'use client'

import { useState, useRef, useEffect } from 'react'
import { List, Task } from '@/types'

interface AddTaskFormProps {
  lists: List[]
  listSlug?: string
  onOptimisticAdd: (task: Task) => void
}

export default function AddTaskForm({ lists, listSlug, onOptimisticAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const defaultList = lists.find(list => list.slug === listSlug)
  
  // Changed: Focus input on mount for immediate task entry
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])
  
  // Changed: Re-focus input whenever title is cleared (after submission)
  useEffect(() => {
    if (title === '' && !isSubmitting && inputRef.current) {
      inputRef.current.focus()
    }
  }, [title, isSubmitting])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    
    // Create optimistic task with temporary ID
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      slug: `temp-${Date.now()}`,
      title: title,
      type: 'tasks',
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      metadata: {
        title: title,
        completed: false,
        list: defaultList
      }
    }
    
    // Optimistically add the task immediately
    onOptimisticAdd(optimisticTask)
    
    // Reset form immediately
    const taskTitle = title
    setTitle('')
    
    // Send to server in background
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          list: defaultList?.id || ''
        })
      })
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTitle('')
      inputRef.current?.blur()
    }
  }
  
  // Changed: Always show the input form - no collapsed button state
  // This allows for rapid task entry without clicking to expand
  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a Task"
          className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-base"
          disabled={isSubmitting}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
    </form>
  )
}