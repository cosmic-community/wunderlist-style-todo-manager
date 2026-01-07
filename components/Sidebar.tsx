'use client'

import Link from 'next/link'
import { List } from '@/types'
import { CheckSquare, ListTodo, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import CreateListForm from './CreateListForm'
import EditListModal from './EditListModal'

interface SidebarProps {
  lists: List[]
  currentListSlug?: string
  onListCreated?: (list: List) => void
  onListUpdated?: (listId: string, updates: Partial<List['metadata']>) => void
  onListDeleted?: (listId: string) => void
}

export default function Sidebar({ lists, currentListSlug, onListCreated, onListUpdated, onListDeleted }: SidebarProps) {
  const [editingList, setEditingList] = useState<List | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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
    if (onListCreated) {
      onListCreated(list)
    }
  }

  const handleOptimisticUpdate = (listId: string, updates: Partial<List['metadata']>) => {
    if (onListUpdated) {
      onListUpdated(listId, updates)
    }
  }

  const handleOptimisticDelete = (listId: string) => {
    if (onListDeleted) {
      onListDeleted(listId)
    }
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

  return (
    <>
      <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Todo Manager</h2>
            </div>
            <ThemeToggle />
          </div>
          
          <nav className="space-y-1">
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                !currentListSlug
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
                  <div key={list.id} className="relative group">
                    <Link
                      href={`/lists/${list.slug}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        currentListSlug === list.slug
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
                      />
                      <span className="font-medium flex-1 truncate">{list.title}</span>
                      
                      {/* More options button */}
                      <button
                        onClick={(e) => toggleMenu(e, list.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                        aria-label="List options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </Link>
                    
                    {/* Dropdown menu */}
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

            {/* Create List Form */}
            <div className="pt-4">
              <CreateListForm onListCreated={handleListCreated} />
            </div>
          </nav>
        </div>
      </aside>

      {/* Edit List Modal */}
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