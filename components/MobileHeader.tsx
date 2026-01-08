'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { List } from '@/types'
import { Menu, X, CheckSquare, ListTodo, MoreHorizontal, Pencil, Trash2, UserPlus, LogIn, UserPlus as SignupIcon } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import CreateListForm from './CreateListForm'
import EditListModal from './EditListModal'
import SkeletonLoader from './SkeletonLoader'
import { useAuth } from '@/contexts/AuthContext'

interface MobileHeaderProps {
  lists: List[]
  currentList?: List
  isLoading?: boolean
  onListDeleted: (listId: string) => void
  onListCreated: (list: List) => void
  onListUpdated: (listId: string, updates: Partial<List['metadata']>) => void
  onListClick?: (slug?: string) => void
}

export default function MobileHeader({ lists, currentList, isLoading = false, onListDeleted, onListCreated, onListUpdated, onListClick }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated } = useAuth()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleListCreated = (list: List) => {
    onListCreated(list)
  }

  const handleOptimisticUpdate = (listId: string, updates: Partial<List['metadata']>) => {
    onListUpdated(listId, updates)
  }

  const handleOptimisticDelete = (listId: string) => {
    onListDeleted(listId)
    setIsOpen(false)
  }

  const toggleMenu = (e: React.MouseEvent, listId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(openMenuId === listId ? null : listId)
  }

  const handleEditClick = (e: React.MouseEvent, list: List) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(null)
    setEditingList(list)
  }

  const handleDeleteClick = (e: React.MouseEvent, listId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(null)
    handleOptimisticDelete(listId)
    
    // Send to server in background
    fetch(`/api/lists/${listId}`, {
      method: 'DELETE'
    }).catch(error => {
      console.error('Error deleting list:', error)
    })
  }

  const handleListNavigation = (e: React.MouseEvent, slug?: string) => {
    e.preventDefault()
    setIsOpen(false)
    if (onListClick) {
      onListClick(slug)
    }
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentList ? currentList.title : 'All Tasks'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute top-16 right-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Changed: Show auth buttons if not authenticated */}
              {!isAuthenticated && (
                <div className="mb-4 space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    <SignupIcon className="w-4 h-4" />
                    Sign Up
                  </Link>
                </div>
              )}

              <nav className="space-y-1">
                <button
                  onClick={(e) => handleListNavigation(e, undefined)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    !currentList
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <ListTodo className="w-5 h-5" />
                  <span className="font-medium">All Tasks</span>
                </button>
                
                {isLoading ? (
                  <div className="pt-4">
                    <div className="pb-2 px-3">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Lists
                      </h3>
                    </div>
                    <SkeletonLoader variant="list" count={3} />
                  </div>
                ) : lists.length > 0 && (
                  <>
                    <div className="pt-4 pb-2 px-3">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Lists
                      </h3>
                    </div>
                    
                    {lists.map((list) => (
                      <div key={list.id} className="relative group">
                        <button
                          onClick={(e) => handleListNavigation(e, list.slug)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            currentList?.slug === list.slug
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
                          />
                          <span className="font-medium flex-1 truncate text-left">{list.title}</span>
                          
                          <button
                            onClick={(e) => toggleMenu(e, list.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                            aria-label="List options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </button>
                        
                        {openMenuId === list.id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                          >
                            <button
                              onClick={(e) => handleEditClick(e, list)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, list.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                <div className="pt-4">
                  <CreateListForm 
                    onListCreated={handleListCreated}
                  />
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {editingList && (
        <EditListModal
          list={editingList}
          onClose={() => setEditingList(null)}
          onOptimisticUpdate={handleOptimisticUpdate}
          onOptimisticDelete={handleOptimisticDelete}
        />
      )}
    </>
  )
}