'use client'

import { useState, useRef, useEffect } from 'react'
import { List } from '@/types'
import { Plus, X } from 'lucide-react'

interface CreateListFormProps {
  onListCreated: (list: List) => void
  // Changed: Add callback to replace optimistic list with real one
  onListReplaced?: (tempId: string, realList: List) => void
  // Changed: Add callback to notify when list creation starts/ends
  onCreatingStateChange?: (isCreating: boolean) => void
  // Changed: Add callback for navigation after successful creation
  onNavigateToList?: (slug: string) => void
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
]

export default function CreateListForm({ onListCreated, onListReplaced, onCreatingStateChange, onNavigateToList }: CreateListFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError('')
    
    // Changed: Notify parent that creation is starting
    onCreatingStateChange?.(true)

    // Changed: Create optimistic list with a temporary ID
    const tempId = `temp-${Date.now()}`
    const tempSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const optimisticList: List = {
      id: tempId,
      slug: tempSlug,
      title: name.trim(),
      type: 'lists',
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      metadata: {
        name: name.trim(),
        description: description.trim() || undefined,
        color: color
      }
    }

    // Optimistically add the list
    onListCreated(optimisticList)

    // Prepare list data for API
    const listData = { name: name.trim(), description: description.trim(), color }
    
    // Reset form immediately for better UX
    setName('')
    setDescription('')
    setColor('#3b82f6')
    setIsOpen(false)

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create list')
      }

      // Changed: Get the real list from API and replace the optimistic one
      const data = await response.json()
      if (data.list) {
        if (onListReplaced) {
          onListReplaced(tempId, data.list)
        }
        // Changed: Navigate to the new list after successful creation
        if (onNavigateToList) {
          onNavigateToList(data.list.slug)
        }
      }
    } catch (err) {
      console.error('Error creating list:', err)
      setError(err instanceof Error ? err.message : 'Failed to create list')
      // Note: The optimistic list will remain unless we implement a rollback
      // For now, the polling will correct it on the next fetch
    } finally {
      setIsSubmitting(false)
      // Changed: Notify parent that creation is complete
      onCreatingStateChange?.(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setName('')
    setDescription('')
    setColor('#3b82f6')
    setError('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Create List</span>
      </button>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">New List</h4>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="List name"
            className="w-full px-3 py-2 text-base bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={isSubmitting}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 text-base bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => setColor(presetColor)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  color === presetColor ? 'ring-2 ring-offset-2 ring-accent dark:ring-offset-gray-800 scale-110' : ''
                }`}
                style={{ backgroundColor: presetColor }}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="flex-1 px-3 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  )
}