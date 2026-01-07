'use client'

import { useState } from 'react'
import { Task, List } from '@/types'
import { Star } from 'lucide-react'

interface TaskCardProps {
  task: Task
  lists: List[]
  onOptimisticToggle: (taskId: string) => void
  onOptimisticDelete: (taskId: string) => void
  onOptimisticUpdate: (taskId: string, updates: Partial<Task['metadata']>) => void
  onOptimisticStar: (taskId: string) => void
}

export default function TaskCard({ 
  task, 
  onOptimisticToggle,
  onOptimisticStar
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const handleToggleComplete = () => {
    // Optimistic update - instant feedback
    onOptimisticToggle(task.id)
    
    // Background sync with server
    fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.metadata.completed })
    }).catch(console.error)
  }
  
  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Optimistic update - instant feedback
    onOptimisticStar(task.id)
    
    // Background sync with server
    fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: !task.metadata.starred })
    }).catch(console.error)
  }
  
  return (
    <div 
      className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-800 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          task.metadata.completed
            ? 'bg-gray-600 border-gray-600'
            : 'border-gray-500 hover:border-gray-400'
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
        task.metadata.completed ? 'text-gray-500 line-through' : 'text-white'
      }`}>
        {task.metadata.title}
      </span>
      
      {/* Star */}
      <button
        onClick={handleToggleStar}
        className={`flex-shrink-0 p-1 transition-all ${
          task.metadata.starred 
            ? 'text-yellow-400' 
            : isHovered ? 'text-gray-500 hover:text-gray-400' : 'text-gray-700'
        }`}
        aria-label={task.metadata.starred ? 'Remove star' : 'Add star'}
      >
        <Star className="w-5 h-5" fill={task.metadata.starred ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}