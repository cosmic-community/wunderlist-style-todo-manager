'use client'

import { useState, useEffect, useRef } from 'react'
import { List } from '@/types'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateListModalProps {
  onClose: () => void
  onListCreated: (list: List) => void
  onListReplaced?: (tempId: string, realList: List) => void
  onCreatingStateChange?: (isCreating: boolean) => void
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

export default function CreateListModal({ 
  onClose, 
  onListCreated, 
  onListReplaced, 
  onCreatingStateChange, 
  onNavigateToList 
}: CreateListModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Focus input on mount
  // Changed: Use preventScroll to avoid iOS scrolling issues
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true })
    }
  }, [])
  
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])
  
  // Click outside handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    setError('')
    
    // Notify parent that creation is starting
    onCreatingStateChange?.(true)
    
    // Create optimistic list with a temporary ID
    const tempId = `temp-${Date.now()}`
    const tempSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const optimisticList: List = {
      id: tempId,
      slug: tempSlug,
      title: formData.name.trim(),
      type: 'lists',
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      metadata: {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color
      }
    }
    
    // Optimistically add the list
    onListCreated(optimisticList)
    
    // Close modal immediately for better UX
    onClose()
    
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create list')
      }
      
      // Get the real list from API and replace the optimistic one
      const data = await response.json()
      if (data.list) {
        if (onListReplaced) {
          onListReplaced(tempId, data.list)
        }
        // Navigate to the new list after successful creation
        if (onNavigateToList) {
          onNavigateToList(data.list.slug)
        }
        // Show success toast
        toast.success(`List "${data.list.metadata.name}" created`)
      }
    } catch (err) {
      console.error('Error creating list:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create list'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
      onCreatingStateChange?.(false)
    }
  }
  
  return (
    <div 
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create List</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter list name"
              className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
              autoComplete="off"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: presetColor })}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.color === presetColor ? 'ring-2 ring-offset-2 ring-accent dark:ring-offset-gray-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={!formData.name.trim() || isSubmitting}
              className="flex-1 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create List'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
