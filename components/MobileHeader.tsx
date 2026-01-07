'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { List } from '@/types'
import { Menu, X, CheckSquare, ListTodo, Trash2, MoreVertical } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

interface MobileHeaderProps {
  lists: List[]
  currentList?: List
  onListDeleted?: (listId: string) => void
}

export default function MobileHeader({ lists, currentList, onListDeleted }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState<List | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  
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
    </>
  )
}