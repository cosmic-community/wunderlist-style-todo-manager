'use client'

import { useState, useRef, useEffect } from 'react'
import { List } from '@/types'
import { CheckSquare, Menu, X, MoreHorizontal, Pencil, Trash2, UserPlus, Inbox, LogIn, UserPlus as SignupIcon, Loader2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import CreateListModal from './CreateListModal'
import EditListModal from './EditListModal'
import SkeletonLoader from './SkeletonLoader'
import UserMenu from './UserMenu'
import InviteModal from './InviteModal'
import ConfirmationModal from './ConfirmationModal'
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
  // Changed: Added state for delete confirmation modal
  const [listToDelete, setListToDelete] = useState<List | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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

  // Changed: Show confirmation modal instead of deleting immediately
  const handleDeleteClick = (e: React.MouseEvent, listId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(null)

    const list = lists.find(l => l.id === listId)
    if (list) {
      setListToDelete(list)
    }
  }

  // Changed: Handler for actually deleting after confirmation
  const handleConfirmDelete = async () => {
    if (!listToDelete || isDeleting) return

    setIsDeleting(true)
    const listName = listToDelete.metadata.name || listToDelete.title || 'List'
    const listId = listToDelete.id

    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete list')
      }

      // Only update UI and close modal after successful deletion
      handleOptimisticDelete(listId)
      setListToDelete(null)
      toast.success(`"${listName}" deleted`)
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error('Failed to delete list')
    } finally {
      setIsDeleting(false)
    }
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

  // Changed: Handler for clicking Cosmic Todo title to navigate to all tasks (home)
  const handleTitleClick = () => {
    closeMenu()
    if (onListClick) {
      onListClick(undefined)
    }
  }

  return (
    <>

      {/* Changed: Full-page menu takeover */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900 safe-area-inset-top safe-area-inset-bottom overflow-y-auto">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-800">
            {/* Changed: Made Cosmic Todo clickable to navigate to home (all tasks) */}
            <button
              onClick={handleTitleClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <CheckSquare className="w-8 h-8 text-accent" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cosmic Todo</h2>
            </button>
          </div>

          {/* Content area with scroll */}
          <div className="p-5 pb-32">
            {/* Navigation */}
            <nav className="space-y-2">
              <button
                onClick={(e) => handleListNavigation(e, undefined)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${!currentListSlug
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
                        <div className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${isSyncing
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

                  {/* Changed: Create list button at bottom of lists section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="w-full flex items-center gap-4 px-4 py-4 text-lg text-accent hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="font-medium">Create list</span>
                    </button>
                  </div>
                </>
              )}

              {/* Create list button - shown when no lists */}
              {!isLoading && lists.length === 0 && (
                <div className="pt-4">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full flex items-center gap-4 px-4 py-4 text-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="font-medium">Create List</span>
                  </button>
                </div>
              )}
            </nav>
          </div>

          {/* Changed: Bottom section with user menu/auth buttons and close button */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
            {/* User menu or auth buttons */}
            {isAuthenticated ? (
              <div className="p-5 pb-3">
                <UserMenu isMobile />
              </div>
            ) : (
              <div className="p-5 pb-3 space-y-3">
                <a
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium text-lg transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  Log In
                </a>
                <a
                  href="/signup"
                  className="flex items-center justify-center gap-2 w-full px-4 py-4 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-lg transition-colors"
                >
                  <SignupIcon className="w-5 h-5" />
                  Sign Up
                </a>
              </div>
            )}

            {/* Close button at bottom right */}
            <div className="px-5 pb-5 pt-0">
              <div className="max-w-2xl mx-auto flex justify-end">
                <button
                  onClick={() => closeMenu()}
                  className="flex-shrink-0 p-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
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

      {/* Delete Confirmation Modal */}
      {listToDelete && (
        <ConfirmationModal
          title="Delete List"
          message={`Are you sure you want to delete "${listToDelete.metadata.name || listToDelete.title}"? This action cannot be undone.`}
          secondaryMessage="Note: Tasks in this list will not be deleted, but they will no longer be associated with this list."
          confirmLabel="Delete List"
          cancelLabel="Cancel"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setListToDelete(null)}
        />
      )}
    </>
  )
}