'use client'

import { useState, useEffect, useRef } from 'react'
import { List, User } from '@/types'
import { X, Trash2, UserMinus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

interface EditListModalProps {
  list: List
  onClose: () => void
  onOptimisticUpdate: (listId: string, updates: Partial<List['metadata']>) => void
  onOptimisticDelete: (listId: string) => void
  onRefresh?: () => void // Changed: Added refresh callback
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

export default function EditListModal({ list, onClose, onOptimisticUpdate, onOptimisticDelete, onRefresh }: EditListModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: list.metadata.name,
    description: list.metadata.description || '',
    color: list.metadata.color || '#3b82f6'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // Changed: Added state for tracking user removal
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Changed: Add escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])
  
  // Changed: Add click outside handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  // Changed: Helper function to check if current user is the owner
  const isOwner = (): boolean => {
    if (!user) return false
    const ownerId = typeof list.metadata.owner === 'string' 
      ? list.metadata.owner 
      : list.metadata.owner?.id
    return ownerId === user.id
  }

  // Changed: Helper function to get shared users as User objects
  const getSharedUsers = (): User[] => {
    const sharedWith = list.metadata.shared_with || []
    return sharedWith.filter((u): u is User => typeof u === 'object' && u !== null && 'id' in u)
  }

  // Changed: Helper function to get display name for a user
  const getUserDisplayName = (userObj: User): string => {
    return userObj.metadata?.display_name || userObj.title || 'Unknown User'
  }

  // Changed: Handler for removing a shared user
  const handleRemoveUser = async (userId: string) => {
    if (removingUserId) return
    
    setRemovingUserId(userId)
    
    try {
      const response = await fetch(`/api/lists/${list.id}/remove-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove user')
      }
      
      // Update the list's shared_with in the optimistic update
      const currentSharedWith = list.metadata.shared_with || []
      const updatedSharedWith = currentSharedWith.filter(u => {
        const id = typeof u === 'string' ? u : u.id
        return id !== userId
      })
      
      onOptimisticUpdate(list.id, { shared_with: updatedSharedWith })
      
      // Also update local list state
      list.metadata.shared_with = updatedSharedWith
      
      if (onRefresh) {
        onRefresh()
      }
      
      toast.success('User removed from list')
    } catch (error) {
      console.error('Error removing user:', error)
      toast.error('Failed to remove user')
    } finally {
      setRemovingUserId(null)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    
    // Build optimistic updates
    const optimisticUpdates: Partial<List['metadata']> = {
      name: formData.name,
      description: formData.description || undefined,
      color: formData.color
    }
    
    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update list')
      }
      
      // Update UI and close modal after successful save
      onOptimisticUpdate(list.id, optimisticUpdates)
      if (onRefresh) {
        onRefresh()
      }
      onClose()
      toast.success('List updated')
    } catch (error) {
      console.error('Error updating list:', error)
      toast.error('Failed to update list')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDelete = async () => {
    if (isDeleting) return
    
    setIsDeleting(true)
    const listName = list.metadata.name
    
    // Optimistically delete and close immediately
    onOptimisticDelete(list.id)
    onClose()
    
    // Send to server in background
    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete list')
      }
      
      toast.success(`List "${listName}" deleted`)
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error('Failed to delete list')
    } finally {
      setIsDeleting(false)
    }
  }

  const sharedUsers = getSharedUsers()
  const ownerCanEdit = isOwner() || !list.metadata.owner
  
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit List</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {showDeleteConfirm ? (
          <div className="p-4 space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete &quot;{list.metadata.name}&quot;? This action cannot be undone.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Note: Tasks in this list will not be deleted, but they will no longer be associated with this list.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete List'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
                autoComplete="off"
                disabled={!ownerCanEdit}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
                disabled={!ownerCanEdit}
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
                    onClick={() => ownerCanEdit && setFormData({ ...formData, color: presetColor })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      formData.color === presetColor ? 'ring-2 ring-offset-2 ring-accent dark:ring-offset-gray-900 scale-110' : ''
                    } ${!ownerCanEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: presetColor }}
                    disabled={!ownerCanEdit}
                  />
                ))}
              </div>
            </div>

            {/* Changed: Added shared users section with remove functionality */}
            {sharedUsers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shared With
                </label>
                <div className="space-y-2">
                  {sharedUsers.map((sharedUser) => (
                    <div
                      key={sharedUser.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent">
                          {getUserDisplayName(sharedUser).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getUserDisplayName(sharedUser)}
                          </p>
                          {sharedUser.metadata?.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {sharedUser.metadata.email}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Changed: Only show remove button if current user is the owner */}
                      {ownerCanEdit && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(sharedUser.id)}
                          disabled={removingUserId === sharedUser.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Remove user"
                        >
                          {removingUserId === sharedUser.id ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <UserMinus className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Changed: Show message if user is not the owner */}
            {!ownerCanEdit && list.metadata.owner && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Only the list owner can edit this list.
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-2 pt-2">
              {ownerCanEdit && (
                <>
                  <button
                    type="submit"
                    disabled={!formData.name.trim() || isSubmitting}
                    className="flex-1 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    title="Delete list"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {ownerCanEdit ? 'Cancel' : 'Close'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}