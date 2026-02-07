'use client'

import { CheckCircle2, Plus, Sparkles, ListChecks } from 'lucide-react'

interface EmptyStateProps {
  variant?: 'tasks' | 'completed' | 'list' | 'no-list-selected'
  listName?: string
  onCreateList?: () => void
}

export default function EmptyState({ variant = 'tasks', listName, onCreateList }: EmptyStateProps) {
  if (variant === 'completed') {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          All caught up!
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          No completed tasks yet. Check off some tasks to see them here.
        </p>
      </div>
    )
  }

  // Changed: New variant for when no list is selected on the All Tasks view
  if (variant === 'no-list-selected') {
    return (
      <div className="text-center py-16 px-4">
        {/* Illustration */}
        <div className="relative inline-block mb-6">
          {/* Main circle with list icon */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 flex items-center justify-center shadow-lg shadow-blue-100/50 dark:shadow-blue-900/20">
            <ListChecks className="w-12 h-12 text-blue-500 dark:text-blue-400" />
          </div>
          
          {/* Decorative floating elements */}
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '2s' }}>
            <div className="w-2 h-2 rounded-full bg-yellow-400 dark:bg-yellow-500" />
          </div>
          <div className="absolute -bottom-1 -left-3 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.5s' }}>
            <div className="w-2 h-2 rounded-full bg-green-400 dark:bg-green-500" />
          </div>
        </div>

        {/* Text content */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No tasks yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed">
          Select a list from the sidebar or create a new one to start adding tasks.
        </p>

        {/* Changed: Create list button */}
        {onCreateList && (
          <button
            onClick={onCreateList}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create a List</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="text-center py-16 px-4">
      {/* Illustration */}
      <div className="relative inline-block mb-6">
        {/* Main circle with checkmark */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 flex items-center justify-center shadow-lg shadow-blue-100/50 dark:shadow-blue-900/20">
          <CheckCircle2 className="w-12 h-12 text-blue-500 dark:text-blue-400" />
        </div>
        
        {/* Decorative floating elements */}
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '2s' }}>
          <div className="w-2 h-2 rounded-full bg-yellow-400 dark:bg-yellow-500" />
        </div>
        <div className="absolute -bottom-1 -left-3 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.5s' }}>
          <div className="w-2 h-2 rounded-full bg-green-400 dark:bg-green-500" />
        </div>
        <div className="absolute top-1/2 -right-4 w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-purple-500" />
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {listName ? `${listName} is empty` : 'No tasks yet'}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed">
        {listName 
          ? 'Start adding tasks to this list to stay organized and track your progress.'
          : 'Create your first task to get started. Stay organized and accomplish more!'}
      </p>

      {/* Helper hint */}
      <div className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/50 px-4 py-2 rounded-full">
        <Plus className="w-4 h-4" />
        <span>Use the form below to add a task</span>
      </div>
    </div>
  )
}