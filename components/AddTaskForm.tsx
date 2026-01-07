'use client'

import { useState, useTransition } from 'react'
import { List } from '@/types'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AddTaskFormProps {
  lists: List[]
  listSlug?: string
}

export default function AddTaskForm({ lists, listSlug }: AddTaskFormProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    list: ''
  })
  
  const defaultList = lists.find(list => list.slug === listSlug)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    
    const taskData = {
      ...formData,
      list: formData.list || defaultList?.id || ''
    }
    
    // Reset form immediately for instant feedback
    const currentFormData = { ...formData }
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      list: ''
    })
    setIsExpanded(false)
    
    // Use transition to make the update feel instant
    startTransition(async () => {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        })
        
        if (response.ok) {
          // Wait a bit for the API to settle before refreshing
          await new Promise(resolve => setTimeout(resolve, 150))
          router.refresh()
        } else {
          // Restore form data on failure
          setFormData(currentFormData)
          setIsExpanded(true)
          alert('Failed to create task. Please try again.')
        }
      } catch (error) {
        console.error('Error creating task:', error)
        // Restore form data on error
        setFormData(currentFormData)
        setIsExpanded(true)
        alert('Failed to create task. Please try again.')
      }
    })
  }
  
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">{isPending ? 'Adding...' : 'Add Task'}</span>
      </button>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Task title"
        className="w-full text-lg font-medium border-none outline-none mb-2"
        autoFocus
        required
        disabled={isPending}
      />
      
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description (optional)"
        className="w-full text-sm text-gray-600 border-none outline-none resize-none mb-3"
        rows={2}
        disabled={isPending}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isPending}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        
        <input
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isPending}
        />
        
        <select
          value={formData.list}
          onChange={(e) => setFormData({ ...formData, list: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isPending}
        >
          <option value="">
            {defaultList ? defaultList.title : 'No List'}
          </option>
          {lists.filter(list => list.id !== defaultList?.id).map((list) => (
            <option key={list.id} value={list.id}>{list.title}</option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending || !formData.title.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Adding...' : 'Add Task'}
        </button>
        
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false)
            setFormData({
              title: '',
              description: '',
              priority: 'medium',
              due_date: '',
              list: ''
            })
          }}
          disabled={isPending}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}