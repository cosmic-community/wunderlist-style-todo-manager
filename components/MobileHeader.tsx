'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { List } from '@/types'
import { CheckSquare, Menu, X, MoreHorizontal, Pencil, Trash2, UserPlus, Inbox, LogIn, UserPlus as SignupIcon, Loader2, Plus } from 'lucide-react'
import CreateListModal from './CreateListModal'
import EditListModal from './EditListModal'
import SkeletonLoader from './SkeletonLoader'
import UserMenu from './UserMenu'
import InviteModal from './InviteModal'
import { useAuth } from '@/contexts/AuthContext'

interface MobileHeaderProps {
  lists: List[]
  currentListSlug?: string
  isLoading?: boolean
  syncingListSlugs?: Set<string>
  // Changed: Menu state is now controlled by parent
  isMenuOpen?: boolean
  onMenuClose?: () => void
  onListCreated?: (list: List) => void
  onListReplaced?: (tempId: string, realList: List) => void
  onListUpdated?: (listId: string, updates: Partial<List['metadata']>) => void
  onListDeleted?: (listId: string) => void
  onListClick?: (slug?: string) => void
  onRefresh?: () => void
  onCreatingStateChange?: (isCreating: boolean) => void
}

export default function MobileHeader({ 
  lists, 
  currentListSlug, 
  isLoading = false, 
  syncingListSlugs = new Set(),
  isMenuOpen = false,
  onMenuClose,
  onListCreated, 
  onListReplaced, 
  onListUpdated, 
  onListDeleted,
  onListClick,
  onRefresh,
  onCreatingStateChange
}: MobileHeaderProps) {
  // Changed: Helper to close menu
  const closeMenu = () => {
    if (onMenuClose) {
      onMenuClose()
    }
  }
  const [editingList, setEditingList] = useState<List | null>(null)
  const [invitingList, setInvitingList] = useState<List | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated } = useAuth()

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    closeMenu()
  }, [currentListSlug])

  const handleListCreated = (list: List) => {
    if (onListCreated) {
      onListCreated(list)
    }
  }

  const handleListReplaced = (tempId: string, realList: List) => {
    if (onListReplaced) {
      onListReplaced(tempId, realList)
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

  const handleInviteClick = (e: React.MouseEvent, list: List) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(null)
    if (isAuthenticated) {
      setInvitingList(list)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, listId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(null)
    handleOptimisticDelete(listId)
    
    fetch(`/api/lists/${listId}`, {
      method: 'DELETE'
    }).catch(error => {
      console.error('Error deleting list:', error)
    })
  }

  const handleListNavigation = (e: React.MouseEvent, slug?: string, isSyncing?: boolean) => {
    e.preventDefault()
    
    if (isSyncing) {
      return
    }
    
    closeMenu()
    
    if (onListClick) {
      onListClick(slug)
    }
  }

  const handleNavigateToList = (slug: string) => {
    closeMenu()
    if (onListClick) {
      onListClick(slug)
    }
  }

  const handleCreatingStateChange = (isCreating: boolean) => {
    if (onCreatingStateChange) {
      onCreatingStateChange(isCreating)
    }
  }

  return (
    <>

      {/* Changed: Full-page menu takeover */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900 safe-area-inset-top safe-area-inset-bottom overflow-y-auto">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-accent" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cosmic Todo</h2>
            </div>
          </div>

          {/* Content area with scroll */}
          <div className="p-5 pb-32">
            {/* User menu or auth buttons */}
            {isAuthenticated ? (
              <div className="mb-6 -mx-3">
                <UserMenu />
              </div>
            ) : (
              <div className="mb-6 space-y-3">
                <Link
                  href="/login"
                  onClick={() => closeMenu()}
                  className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium text-lg transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => closeMenu()}
                  className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-lg transition-colors"
                >
                  <SignupIcon className="w-5 h-5" />
                  Sign Up
                </Link>
              </div>
            )}

            {/* Navigation */}
            <nav className="space-y-2">
              <button
                onClick={(e) => handleListNavigation(e, undefined)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${
                  !currentListSlug
                    ? 'bg-accent-light dark:bg-accent/20 text-accent dark:text-accent'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Inbox className="w-6 h-6" />
                <span className="font-medium text-lg">All Tasks</span>
              </button>

              {isLoading ? (
                <div className="pt-6">
                  <div className="pb-3 px-4">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lists
                    </h3>
                  </div>
                  <SkeletonLoader variant="list" count={3} />
                </div>
              ) : lists.length > 0 && (
                <>
                  <div className="pt-6 pb-3 px-4">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lists
                    </h3>
                  </div>
                  
                  {lists.map((list) => {
                    const isSyncing = syncingListSlugs.has(list.slug)
                    
                    return (
                      <div key={list.id} className="relative group">
                        <div className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${
                          isSyncing
                            ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50'
                            : currentListSlug === list.slug
                              ? 'bg-accent-light dark:bg-accent/20 text-accent dark:text-accent'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}>
                          <button
                            onClick={(e) => handleListNavigation(e, list.slug, isSyncing)}
                            disabled={isSyncing}
                            className={`flex-1 flex items-center gap-4 text-left ${isSyncing ? 'cursor-not-allowed' : ''}`}
                          >
                            {isSyncing ? (
                              <Loader2 className="w-6 h-6 flex-shrink-0 animate-spin text-gray-400" />
                            ) : (
                              <div 
                                className="w-6 h-6 rounded-full flex-shrink-0"
                                style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
                              />
                            )}
                            <span className={`font-medium text-lg flex-1 truncate ${isSyncing ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                              {list.metadata.name || list.title}
                            </span>
                          </button>
                          
                          {isSyncing && (
                            <span className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">
                              Saving...
                            </span>
                          )}
                          
                          {!isSyncing && (
                            <button
                              onClick={(e) => toggleMenu(e, list.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                              aria-label="List options"
                            >
                              <MoreHorizontal className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                        
                        {openMenuId === list.id && !isSyncing && (
                          <div 
                            ref={menuRef}
                            className="absolute right-4 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                          >
                            {isAuthenticated && (
                              <button
                                onClick={(e) => handleInviteClick(e, list)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <UserPlus className="w-5 h-5" />
                                Invite
                              </button>
                            )}
                            <button
                              onClick={(e) => handleEditClick(e, list)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Pencil className="w-5 h-5" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, list.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-lg text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Trash2 className="w-5 h-5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              )}

              {/* Create list button */}
              <div className="pt-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full flex items-center gap-4 px-4 py-4 text-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <Plus className="w-6 h-6" />
                  <span className="font-medium">Create List</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Changed: Close button fixed at bottom right for easy thumb access */}
          <div className="fixed bottom-6 right-4 safe-area-inset-bottom">
            <button
              onClick={() => closeMenu()}
              className="w-14 h-14 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onListCreated={handleListCreated}
          onListReplaced={handleListReplaced}
          onCreatingStateChange={handleCreatingStateChange}
          onNavigateToList={handleNavigateToList}
        />
      )}

      {/* Edit List Modal */}
      {editingList && (
        <EditListModal
          list={editingList}
          onClose={() => setEditingList(null)}
          onOptimisticUpdate={handleOptimisticUpdate}
          onOptimisticDelete={handleOptimisticDelete}
          onRefresh={onRefresh}
        />
      )}

      {/* Invite Modal */}
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
