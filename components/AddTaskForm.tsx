'use client'

import { useState, useRef, useEffect } from 'react'
import { List, Task } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

interface AddTaskFormProps {
  lists: List[]
  listSlug?: string
  onOptimisticAdd: (task: Task) => void
}

export default function AddTaskForm({ lists, listSlug, onOptimisticAdd }: AddTaskFormProps) {
  // Changed: Get checkbox position from user preferences
  const { user } = useAuth()
  const checkboxPosition = user?.checkbox_position || 'left'
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    
    // Changed: Use list ID instead of list object for consistency
    const listId = defaultList?.id || ''
    
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
        list: listId // Changed: Use list ID string instead of list object
      }
    }
    
    // Optimistically add the task immediately
    onOptimisticAdd(optimisticTask)
    
    // Reset form immediately
    const taskTitle = title
    setTitle('')
    
    // Changed: Immediately refocus the input after clearing - don't wait for API
    // Using requestAnimationFrame ensures this happens after React's state update
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    })
    
    // Send to server in background
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          list: listId // Changed: Use list ID string instead of defaultList?.id
        })
      })
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
      // Changed: Refocus again after submission completes to ensure keyboard stays open
      if (inputRef.current) {
        inputRef.current.focus()
      }
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
  // Changed: Added relative z-index to ensure form appears above task checkmarks
  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-800 relative z-20">
      <div 
        className="flex items-center gap-3"
        style={{
          // Changed: Reverse flex direction when checkbox is on right
          flexDirection: checkboxPosition === 'right' ? 'row-reverse' : 'row',
        }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a Task"
          className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-base"
          // Changed: Removed disabled={isSubmitting} to allow focus during API request
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          // Changed: Added autoFocus for immediate focus on mount/re-render
          autoFocus
          // Changed: Added enterKeyHint to show "done" or appropriate key on mobile
          enterKeyHint="done"
        />
      </div>
    </form>
  )
}