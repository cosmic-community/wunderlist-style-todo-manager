'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import TaskCard from './TaskCard'
import AddTaskForm from './AddTaskForm'
import type { Task, List } from '@/types'

interface ClientTaskListProps {
  listId?: string
  listSlug?: string
}

export default function ClientTaskList({ listId, listSlug }: ClientTaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // Changed: Add state for collapsible completed section
  const [showCompleted, setShowCompleted] = useState(false)

  // Fetch tasks and lists
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch tasks
        const tasksUrl = listId 
          ? `/api/tasks?list=${listId}` 
          : '/api/tasks'
        const tasksResponse = await fetch(tasksUrl)
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData.tasks || [])
        }

        // Fetch lists
        const listsResponse = await fetch('/api/lists')
        if (listsResponse.ok) {
          const listsData = await listsResponse.json()
          setLists(listsData.lists || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [listId])

  const handleOptimisticToggle = (taskId: string) => {
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, metadata: { ...t.metadata, completed: !t.metadata.completed } }
        : t
    ))
  }

  const handleOptimisticDelete = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const handleOptimisticUpdate = (taskId: string, updates: Partial<Task['metadata']>) => {
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, metadata: { ...t.metadata, ...updates } }
        : t
    ))
  }

  const handleOptimisticAdd = (task: Task) => {
    setTasks([...tasks, task])
  }

  const completedTasks = tasks.filter(t => t.metadata.completed)
  const incompleteTasks = tasks.filter(t => !t.metadata.completed)

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading tasks...
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      <div className="space-y-4">
        {incompleteTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            lists={lists}
            onOptimisticToggle={handleOptimisticToggle}
            onOptimisticDelete={handleOptimisticDelete}
            onOptimisticUpdate={handleOptimisticUpdate}
          />
        ))}
      </div>

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Task</span>
        </button>
      )}

      {showAddForm && (
        <AddTaskForm
          lists={lists}
          listSlug={listSlug}
          onOptimisticAdd={handleOptimisticAdd}
        />
      )}

      {/* Changed: Collapsible completed section */}
      {completedTasks.length > 0 && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-2 w-full"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`} />
            <span className="text-sm font-medium">
              Completed ({completedTasks.length})
            </span>
          </button>
          
          {showCompleted && (
            <div className="space-y-4 mt-2">
              {completedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  lists={lists}
                  onOptimisticToggle={handleOptimisticToggle}
                  onOptimisticDelete={handleOptimisticDelete}
                  onOptimisticUpdate={handleOptimisticUpdate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}