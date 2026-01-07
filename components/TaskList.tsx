'use client'

import { Task, List } from '@/types'
import TaskCard from '@/components/TaskCard'
import AddTaskForm from '@/components/AddTaskForm'

interface TaskListProps {
  tasks: Task[]
  lists: List[]
  listSlug?: string
}

export default function TaskList({ tasks, lists, listSlug }: TaskListProps) {
  const pendingTasks = tasks.filter(task => !task.metadata.completed)
  const completedTasks = tasks.filter(task => task.metadata.completed)
  
  return (
    <div className="space-y-6">
      {/* Add Task Form */}
      <AddTaskForm lists={lists} listSlug={listSlug} />
      
      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-2">
          {pendingTasks.map((task) => (
            <TaskCard key={task.id} task={task} lists={lists} />
          ))}
        </div>
      )}
      
      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>Completed</span>
            <span className="text-sm text-gray-500">({completedTasks.length})</span>
          </h2>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} lists={lists} />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {pendingTasks.length === 0 && completedTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tasks yet. Add your first task above!</p>
        </div>
      )}
    </div>
  )
}