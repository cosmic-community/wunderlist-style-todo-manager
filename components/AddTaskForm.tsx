'use client'

import { useState, useRef, useEffect } from 'react'
import { List, Task } from '@/types'
import { Plus } from 'lucide-react'

interface AddTaskFormProps {
  lists: List[]
  listSlug?: string
  onOptimisticAdd: (task: Task) => void
}

export default function AddTaskForm({ lists, listSlug, onOptimisticAdd }: AddTaskFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const defaultList = lists.find(list => list.slug === listSlug)
  
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    
    // Create optimistic task with temporary ID
    // Note: 'starred' is optional and may not exist in the content model
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
    setIsExpanded(false)
    
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
      setIsExpanded(false)
      setTitle('')
    }
  }
  
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-xl text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition-colors"
      >
        <Plus className="w-5 h-5 text-indigo-400" />
        <span>Add a Task</span>
      </button>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-gray-500 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!title.trim()) {
              setIsExpanded(false)
            }
          }}
          placeholder="Add a Task"
          className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base"
          disabled={isSubmitting}
        />
      </div>
    </form>
  )
}