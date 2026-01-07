'use client'

import { useState, useEffect } from 'react'
import { Task, List } from '@/types'
import TaskList from '@/components/TaskList'
import { Loader2 } from 'lucide-react'

interface ClientTaskListProps {
  listSlug?: string
}

export default function ClientTaskList({ listSlug }: ClientTaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Changed: Fetch data when listSlug changes
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const [tasksRes, listsRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/lists')
        ])

        if (!tasksRes.ok || !listsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const tasksData = await tasksRes.json()
        const listsData = await listsRes.json()

        let filteredTasks = tasksData.tasks as Task[]
        if (listSlug) {
          filteredTasks = filteredTasks.filter(
            task => task.metadata.list?.slug === listSlug
          )
        }

        setTasks(filteredTasks)
        setLists(listsData.lists)
        setError(null)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load tasks')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [listSlug])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <TaskList 
      initialTasks={tasks} 
      lists={lists} 
      listSlug={listSlug} 
    />
  )
}