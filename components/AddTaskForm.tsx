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
  const inputRef = useRef<HTMLInputElement>(null)
  
  const defaultList = lists.find(list => list.slug === listSlug)
  
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
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
        starred: false,
        list: defaultList
      }
    }
    
    // Optimistically add the task immediately
    onOptimisticAdd(optimisticTask)
    
    // Reset form immediately
    setTitle('')
    setIsExpanded(false)
    
    // Send to server in background
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: optimisticTask.metadata.title,
        list: defaultList?.id || ''
      })
    }).catch(console.error)
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
        />
      </div>
    </form>
  )
}