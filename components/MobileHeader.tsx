'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { List } from '@/types'
import { Menu, X, CheckSquare, ListTodo, Trash2, Pencil, Plus } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

interface MobileHeaderProps {
  lists: List[]
  currentList?: List
  onListDeleted?: (listId: string) => void
  onListCreated?: (list: List) => void
  onListUpdated?: (listId: string, updates: Partial<List['metadata']>) => void
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

export default function MobileHeader({ lists, currentList, onListDeleted, onListCreated, onListUpdated }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState<List | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const router = useRouter()
  
  // Create form state
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createColor, setCreateColor] = useState('#3b82f6')
  const [isCreating, setIsCreating] = useState(false)
  
  // Edit form state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('#3b82f6')
  const [isUpdating, setIsUpdating] = useState(false)
  
  const handleDeleteList = async (list: List, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setListToDelete(list)
  }
  
  const confirmDelete = async () => {
    if (!listToDelete || isDeleting) return
    
    setIsDeleting(true)
    const listId = listToDelete.id
    const wasCurrentList = currentList?.id === listId
    
    // Optimistically update UI
    if (onListDeleted) {
      onListDeleted(listId)
    }
    
    setListToDelete(null)
    setIsMenuOpen(false)
    
    // Redirect if we deleted the current list
    if (wasCurrentList) {
      router.replace('/')
    }
    
    // Send to server in background
    try {
      await fetch(`/api/lists/${listId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting list:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleEditList = (list: List, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditName(list.metadata.name)
    setEditDescription(list.metadata.description || '')
    setEditColor(list.metadata.color || '#3b82f6')
    setEditingList(list)
  }
  
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim() || isCreating) return
    
    setIsCreating(true)
    
    // Create optimistic list
    const optimisticList: List = {
      id: `temp-${Date.now()}`,
      slug: createName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: createName.trim(),
      type: 'lists',
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      metadata: {
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        color: createColor
      }
    }
    
    // Optimistically add the list
    if (onListCreated) {
      onListCreated(optimisticList)
    }
    
    // Reset form and close
    const listData = { name: createName.trim(), description: createDescription.trim(), color: createColor }
    setCreateName('')
    setCreateDescription('')
    setCreateColor('#3b82f6')
    setShowCreateForm(false)
    
    try {
      await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listData)
      })
    } catch (error) {
      console.error('Error creating list:', error)
    } finally {
      setIsCreating(false)
    }
  }
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingList || !editName.trim() || isUpdating) return
    
    setIsUpdating(true)
    
    const optimisticUpdates: Partial<List['metadata']> = {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      color: editColor
    }
    
    // Optimistically update
    if (onListUpdated) {
      onListUpdated(editingList.id, optimisticUpdates)
    }
    
    const listId = editingList.id
    setEditingList(null)
    
    try {
      await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          color: editColor
        })
      })
    } catch (error) {
      console.error('Error updating list:', error)
    } finally {
      setIsUpdating(false)
    }
  }
  
  const closeCreateForm = () => {
    setShowCreateForm(false)
    setCreateName('')
    setCreateDescription('')
    setCreateColor('#3b82f6')
  }
  
  const closeEditForm = () => {
    setEditingList(null)
    setEditName('')
    setEditDescription('')
    setEditColor('#3b82f6')
  }
  
  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {currentList ? currentList.title : 'All Tasks'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <nav 
            className="fixed top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-1">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  !currentList
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <ListTodo className="w-5 h-5" />
                <span className="font-medium">All Tasks</span>
              </Link>
              
              {lists.length > 0 && (
                <>
                  <div className="pt-4 pb-2 px-3">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lists
                    </h3>
                  </div>
                  
                  {lists.map((list) => (
                    <div 
                      key={list.id}
                      className={`flex items-center gap-2 rounded-lg transition-colors ${
                        currentList?.slug === list.slug
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Link
                        href={`/lists/${list.slug}`}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex-1 flex items-center gap-3 px-3 py-2 ${
                          currentList?.slug === list.slug
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
                        />
                        <span className="font-medium truncate">{list.title}</span>
                      </Link>
                      
                      {/* Edit button for list */}
                      <button
                        onClick={(e) => handleEditList(list, e)}
                        className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        aria-label={`Edit ${list.title}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      
                      {/* Delete button for list */}
                      <button
                        onClick={(e) => handleDeleteList(list, e)}
                        className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        aria-label={`Delete ${list.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </>
              )}
              
              {/* Create List Button/Form */}
              <div className="pt-4">
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create List</span>
                  </button>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">New List</h4>
                      <button
                        onClick={closeCreateForm}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleCreateSubmit} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                          placeholder="List name"
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isCreating}
                          autoFocus
                        />
                      </div>
                      
                      <div>
                        <textarea
                          value={createDescription}
                          onChange={(e) => setCreateDescription(e.target.value)}
                          placeholder="Description (optional)"
                          rows={2}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          disabled={isCreating}
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
                              onClick={() => setCreateColor(presetColor)}
                              className={`w-6 h-6 rounded-full transition-transform ${
                                createColor === presetColor ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800 scale-110' : ''
                              }`}
                              style={{ backgroundColor: presetColor }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={closeCreateForm}
                          className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          disabled={isCreating}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!createName.trim() || isCreating}
                          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isCreating ? 'Creating...' : 'Create'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {listToDelete && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full p-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete List</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete &quot;{listToDelete.metadata.name}&quot;? This action cannot be undone.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Note: Tasks in this list will not be deleted, but they will no longer be associated with this list.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setListToDelete(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit List Modal */}
      {editingList && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit List</h3>
              <button
                onClick={closeEditForm}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={2}
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
                      onClick={() => setEditColor(presetColor)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        editColor === presetColor ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900 scale-110' : ''
                      }`}
                      style={{ backgroundColor: presetColor }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditForm}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim() || isUpdating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}