'use client'

import Link from 'next/link'
import { List, User } from '@/types'
import { CheckSquare, Inbox, MoreHorizontal, Pencil, Trash2, UserPlus, LogIn, UserPlus as SignupIcon, Loader2, Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import CreateListModal from './CreateListModal'
import EditListModal from './EditListModal'
import SkeletonLoader from './SkeletonLoader'
import UserMenu from './UserMenu'
import InviteModal from './InviteModal'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarProps {
  lists: List[]
  currentListSlug?: string
  isLoading?: boolean
  syncingListSlugs?: Set<string>
  onListCreated?: (list: List) => void
  onListReplaced?: (tempId: string, realList: List) => void
  onListUpdated?: (listId: string, updates: Partial<List['metadata']>) => void
  onListDeleted?: (listId: string) => void
  onListClick?: (slug?: string) => void
  onRefresh?: () => void
  onCreatingStateChange?: (isCreating: boolean) => void
}

export default function Sidebar({ lists, currentListSlug, isLoading = false, syncingListSlugs = new Set(), onListCreated, onListReplaced, onListUpdated, onListDeleted, onListClick, onRefresh, onCreatingStateChange }: SidebarProps) {
  const [editingList, setEditingList] = useState<List | null>(null)
  const [invitingList, setInvitingList] = useState<List | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, user } = useAuth()

  const bucketSlug = process.env.NEXT_PUBLIC_COSMIC_BUCKET_SLUG || 'cosmic-todo'

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

    const listToDelete = lists.find(l => l.id === listId)
    const listName = listToDelete?.metadata.name || listToDelete?.title || 'List'

    handleOptimisticDelete(listId)
    toast.success(`"${listName}" deleted`)

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

    if (onListClick) {
      onListClick(slug)
    }
  }

  const handleNavigateToList = (slug: string) => {
    if (onListClick) {
      onListClick(slug)
    }
  }

  const handleCreatingStateChange = (isCreating: boolean) => {
    if (onCreatingStateChange) {
      onCreatingStateChange(isCreating)
    }
  }

  const handleTitleClick = () => {
    if (onListClick) {
      onListClick(undefined)
    }
  }

  // Changed: Helper function to check if current user is the owner of a list
  const isListOwner = (list: List): boolean => {
    if (!user) return false
    const ownerId = typeof list.metadata.owner === 'string' 
      ? list.metadata.owner 
      : list.metadata.owner?.id
    return ownerId === user.id
  }

  return (
    <>
      <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
        <div className="flex-1 p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={handleTitleClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <CheckSquare className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cosmic Todo</h2>
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={(e) => handleListNavigation(e, undefined)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${!currentListSlug
                ? 'bg-accent-light dark:bg-accent/20 text-accent dark:text-accent'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              <Inbox className="w-5 h-5" />
              <span className="font-medium">All Tasks</span>
            </button>

            {isLoading && lists.length === 0 ? (
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
                  const isSyncing = syncingListSlugs.has(list.slug)
                  const isOwner = isListOwner(list)

                  return (
                    <div key={list.id} className="relative group">
                      <div
                        role="button"
                        tabIndex={isSyncing ? -1 : 0}
                        onClick={(e) => handleListNavigation(e, list.slug, isSyncing)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleListNavigation(e as unknown as React.MouseEvent, list.slug, isSyncing)
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSyncing
                          ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50'
                          : currentListSlug === list.slug
                            ? 'bg-accent-light dark:bg-accent/20 text-accent dark:text-accent'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                          }`}
                      >
                        {isSyncing ? (
                          <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-gray-400" />
                        ) : (
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
                          />
                        )}
                        <span className={`font-medium flex-1 truncate text-left ${isSyncing ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                          {list.metadata.name || list.title}
                        </span>

                        {isSyncing && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            Saving...
                          </span>
                        )}

                        {/* More options button - hide if syncing */}
                        {!isSyncing && (
                          <button
                            onClick={(e) => toggleMenu(e, list.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                            aria-label="List options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown menu - don't show for syncing lists */}
                      {openMenuId === list.id && !isSyncing && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                        >
                          {/* Changed: Only show Invite option if authenticated and user is owner */}
                          {isAuthenticated && isOwner && (
                            <button
                              onClick={(e) => handleInviteClick(e, list)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <UserPlus className="w-4 h-4" />
                              Invite
                            </button>
                          )}
                          {/* Changed: Only show Edit option if user is owner or list has no owner (demo list) */}
                          {(isOwner || !list.metadata.owner) && (
                            <button
                              onClick={(e) => handleEditClick(e, list)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                          {/* Changed: Only show Delete option if user is owner or list has no owner (demo list) */}
                          {(isOwner || !list.metadata.owner) && (
                            <button
                              onClick={(e) => handleDeleteClick(e, list.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                          {/* Changed: Show message if user doesn't have permission */}
                          {!isOwner && list.metadata.owner && (
                            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                              Only the owner can edit
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}

            {/* Create list button that opens modal */}
            <div className="pt-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create List</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom section: Cosmic badge and user menu */}
        <div className="border-t border-gray-200 dark:border-gray-800">
          {/* Built with Cosmic button */}
          <div className="p-4 pb-2">
            <a
              href={`https://www.cosmicjs.com?utm_source=bucket_${bucketSlug}&utm_medium=referral&utm_campaign=app_badge&utm_content=built_with_cosmic`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              <img
                src="https://cdn.cosmicjs.com/b67de7d0-c810-11ed-b01d-23d7b265c299-logo508x500.svg"
                alt="Cosmic Logo"
                className="w-4 h-4"
              />
              Built with Cosmic
            </a>
          </div>

          {/* User menu or auth buttons */}
          {isAuthenticated ? (
            <div className="px-4 pb-4 pt-2">
              <UserMenu />
            </div>
          ) : (
            <div className="p-4 pt-2 space-y-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Log In
              </Link>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                <SignupIcon className="w-4 h-4" />
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>

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

      {/* Only show invite modal if authenticated */}
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