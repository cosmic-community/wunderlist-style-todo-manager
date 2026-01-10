'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { List } from '@/types'
import { Menu, X, CheckSquare, Inbox, MoreHorizontal, Pencil, Trash2, UserPlus, LogIn, UserPlus as SignupIcon, Loader2 } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import CreateListForm from './CreateListForm'
import EditListModal from './EditListModal'
import InviteModal from './InviteModal'
import SkeletonLoader from './SkeletonLoader'
import UserMenu from './UserMenu'
import { useAuth } from '@/contexts/AuthContext'

interface MobileHeaderProps {
  lists: List[]
  currentList?: List
  isLoading?: boolean
  // Changed: Added syncingListSlugs prop for loading state on newly created lists
  syncingListSlugs?: Set<string>
  onListDeleted: (listId: string) => void
  onListCreated: (list: List) => void
  // Changed: Added onListReplaced callback for when API completes
  onListReplaced?: (tempId: string, realList: List) => void
  onListUpdated: (listId: string, updates: Partial<List['metadata']>) => void
  onListClick?: (slug?: string) => void
  onRefresh?: () => void
}

export default function MobileHeader({ lists, currentList, isLoading = false, syncingListSlugs = new Set(), onListDeleted, onListCreated, onListReplaced, onListUpdated, onListClick, onRefresh }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [invitingList, setInvitingList] = useState<List | null>(null)
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

  // Changed: Added handler to pass through list replacement
  const handleListReplaced = (tempId: string, realList: List) => {
    if (onListReplaced) {
      onListReplaced(tempId, realList)
    }
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

  const handleInviteClick = (e: React.MouseEvent, list: List) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(null)
    // Only allow invite if authenticated
    if (isAuthenticated) {
      setInvitingList(list)
    }
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

  // Changed: Handle list navigation - prevent click on syncing lists
  const handleListNavigation = (e: React.MouseEvent, slug?: string, isSyncing?: boolean) => {
    e.preventDefault()
    
    // Changed: Don't allow navigation to syncing lists
    if (isSyncing) {
      return
    }
    
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
            {/* Changed: Use accent color for logo */}
            <CheckSquare className="w-6 h-6 text-accent" />
            {/* Changed: Made title static "Cosmic Todo" */}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Cosmic Todo
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
              {/* Changed: Show user menu if authenticated, auth buttons with demo notice if not */}
              {isAuthenticated ? (
                <div className="mb-4 -mx-3">
                  <UserMenu />
                </div>
              ) : (
                <div className="mb-4">
                  {/* Changed: Added demo experience notice for mobile */}
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                      👋 You&apos;re viewing the <strong>public demo</strong>. Sign up to create your own private Cosmic todo experience!
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
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
                </div>
              )}

              <nav className="space-y-1">
                <button
                  onClick={(e) => handleListNavigation(e, undefined)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    !currentList
                      ? 'bg-accent-light dark:bg-accent/20 text-accent dark:text-accent'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {/* Changed: Use Inbox icon instead of ListTodo */}
                  <Inbox className="w-5 h-5" />
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
                    
                    {lists.map((list) => {
                      // Changed: Check if this list is still syncing (has temp ID)
                      const isSyncing = syncingListSlugs.has(list.slug)
                      
                      return (
                        <div key={list.id} className="relative group">
                          <button
                            onClick={(e) => handleListNavigation(e, list.slug, isSyncing)}
                            disabled={isSyncing}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              isSyncing
                                ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50'
                                : currentList?.slug === list.slug
                                  ? 'bg-accent-light dark:bg-accent/20 text-accent dark:text-accent'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {/* Changed: Show spinner if syncing, otherwise show color dot */}
                            {isSyncing ? (
                              <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-gray-400" />
                            ) : (
                              <div 
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
                              />
                            )}
                            <span className={`font-medium flex-1 truncate text-left ${isSyncing ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                              {list.title}
                            </span>
                            
                            {/* Changed: Show "Saving..." text if syncing */}
                            {isSyncing && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                                Saving...
                              </span>
                            )}
                            
                            {/* More options button - hide if syncing */}
                            {!isSyncing && (
                              <button
                                onClick={(e) => toggleMenu(e, list.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                                aria-label="List options"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            )}
                          </button>
                          
                          {/* Dropdown menu - don't show for syncing lists */}
                          {openMenuId === list.id && !isSyncing && (
                            <div 
                              ref={menuRef}
                              className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                            >
                              {/* Changed: Added invite button - only show if authenticated */}
                              {isAuthenticated && (
                                <button
                                  onClick={(e) => handleInviteClick(e, list)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  Invite
                                </button>
                              )}
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
                      )
                    })}
                  </>
                )}

                <div className="pt-4">
                  <CreateListForm 
                    onListCreated={handleListCreated}
                    onListReplaced={handleListReplaced}
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
          onRefresh={onRefresh}
        />
      )}

      {/* Changed: Added InviteModal - only show if authenticated */}
      {invitingList && isAuthenticated && (
        <InviteModal
          listId={invitingList.id}
          listName={invitingList.metadata.name}
          onClose={() => setInvitingList(null)}
        />
      )}
    </>
  )
}