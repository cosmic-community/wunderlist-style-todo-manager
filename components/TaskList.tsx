'use client'

import { useOptimistic, useCallback, useState } from 'react'
import { Task, List } from '@/types'
import TaskCard from '@/components/TaskCard'
import AddTaskForm from '@/components/AddTaskForm'
import { ChevronRight } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  lists: List[]
  listSlug?: string
}

// Types for optimistic actions
type OptimisticAction = 
  | { type: 'add'; task: Task }
  | { type: 'toggle'; taskId: string }
  | { type: 'delete'; taskId: string }
  | { type: 'update'; taskId: string; updates: Partial<Task['metadata']> }
  | { type: 'star'; taskId: string }

export default function TaskList({ tasks, lists, listSlug }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  
  // Optimistic state management for the entire task list
  const [optimisticTasks, addOptimisticAction] = useOptimistic(
    tasks,
    (currentTasks: Task[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add':
          return [action.task, ...currentTasks]
        case 'toggle':
          return currentTasks.map(task => 
            task.id === action.taskId 
              ? { ...task, metadata: { ...task.metadata, completed: !task.metadata.completed } }
              : task
          )
        case 'delete':
          return currentTasks.filter(task => task.id !== action.taskId)
        case 'update':
          return currentTasks.map(task =>
            task.id === action.taskId
              ? { ...task, metadata: { ...task.metadata, ...action.updates } }
              : task
          )
        case 'star':
          return currentTasks.map(task =>
            task.id === action.taskId
              ? { ...task, metadata: { ...task.metadata, starred: !task.metadata.starred } }
              : task
          )
        default:
          return currentTasks
      }
    }
  )

  // Handlers to pass down to child components
  const handleOptimisticAdd = useCallback((task: Task) => {
    addOptimisticAction({ type: 'add', task })
  }, [addOptimisticAction])

  const handleOptimisticToggle = useCallback((taskId: string) => {
    addOptimisticAction({ type: 'toggle', taskId })
  }, [addOptimisticAction])

  const handleOptimisticDelete = useCallback((taskId: string) => {
    addOptimisticAction({ type: 'delete', taskId })
  }, [addOptimisticAction])

  const handleOptimisticUpdate = useCallback((taskId: string, updates: Partial<Task['metadata']>) => {
    addOptimisticAction({ type: 'update', taskId, updates })
  }, [addOptimisticAction])

  const handleOptimisticStar = useCallback((taskId: string) => {
    addOptimisticAction({ type: 'star', taskId })
  }, [addOptimisticAction])

  const pendingTasks = optimisticTasks.filter(task => !task.metadata.completed)
  const completedTasks = optimisticTasks.filter(task => task.metadata.completed)
  
  return (
    <div className="space-y-2">
      {/* Pending Tasks */}
      {pendingTasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          lists={lists}
          onOptimisticToggle={handleOptimisticToggle}
          onOptimisticDelete={handleOptimisticDelete}
          onOptimisticUpdate={handleOptimisticUpdate}
          onOptimisticStar={handleOptimisticStar}
        />
      ))}
      
      {/* Completed Section - Collapsible */}
      {completedTasks.length > 0 && (
        <div className="pt-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors py-2"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`} />
            <span className="text-sm font-medium">Completed</span>
          </button>
          
          {showCompleted && (
            <div className="space-y-2 mt-2">
              {completedTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  lists={lists}
                  onOptimisticToggle={handleOptimisticToggle}
                  onOptimisticDelete={handleOptimisticDelete}
                  onOptimisticUpdate={handleOptimisticUpdate}
                  onOptimisticStar={handleOptimisticStar}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Empty State */}
      {pendingTasks.length === 0 && completedTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tasks yet. Add your first task below!</p>
        </div>
      )}
      
      {/* Add Task Form - Always at bottom */}
      <div className="pt-4">
        <AddTaskForm 
          lists={lists} 
          listSlug={listSlug} 
          onOptimisticAdd={handleOptimisticAdd}
        />
      </div>
    </div>
  )
}