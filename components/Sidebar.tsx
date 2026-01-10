'use client'

import Link from 'next/link'
import { List } from '@/types'
import { CheckSquare, Inbox, MoreHorizontal, Pencil, Trash2, UserPlus, LogIn, UserPlus as SignupIcon, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
// Changed: Removed ThemeToggle import
import CreateListForm from './CreateListForm'
import EditListModal from './EditListModal'
import SkeletonLoader from './SkeletonLoader'
import UserMenu from './UserMenu'
import InviteModal from './InviteModal'
import { useAuth } from '@/contexts/AuthContext'

interface SidebarProps {
  lists: List[]
  currentListSlug?: string
  isLoading?: boolean
  // Changed: Track lists that are still syncing (have temporary IDs)
  syncingListSlugs?: Set<string>
  onListCreated?: (list: List) => void
  onListReplaced?: (tempId: string, realList: List) => void
  onListUpdated?: (listId: string, updates: Partial<List['metadata']>) => void
  onListDeleted?: (listId: string) => void
  onListClick?: (slug?: string) => void
  onRefresh?: () => void
  // Changed: Add callback for creating state to show loading in main area
  onCreatingStateChange?: (isCreating: boolean) => void
}

export default function Sidebar({ lists, currentListSlug, isLoading = false, syncingListSlugs = new Set(), onListCreated, onListReplaced, onListUpdated, onListDeleted, onListClick, onRefresh, onCreatingStateChange }: SidebarProps) {
  const [editingList, setEditingList] = useState<List | null>(null)
  const [invitingList, setInvitingList] = useState<List | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated } = useAuth()
  
  // Changed: Get bucket slug from environment for Cosmic button
  const bucketSlug = process.env.NEXT_PUBLIC_COSMIC_BUCKET_SLUG || 'cosmic-todo'

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
    // Changed: Only allow invite if authenticated
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
    
    if (onListClick) {
      onListClick(slug)
    }
  }

  // Changed: Handle navigation to newly created list
  const handleNavigateToList = (slug: string) => {
    if (onListClick) {
      onListClick(slug)
    }
  }

  // Changed: Handle creating state change
  const handleCreatingStateChange = (isCreating: boolean) => {
    if (onCreatingStateChange) {
      onCreatingStateChange(isCreating)
    }
  }

  // Changed: Handle clicking on Cosmic Todo title to navigate to All Tasks
  const handleTitleClick = () => {
    if (onListClick) {
      onListClick(undefined) // undefined means "All Tasks" view
    }
  }

  return (
    <>
      <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
        <div className="flex-1 p-6">
          <div className="flex items-center mb-6">
            {/* Changed: Made title clickable to navigate to All Tasks */}
            <button
              onClick={handleTitleClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {/* Changed: Use accent color for logo */}
              <CheckSquare className="w-6 h-6 text-accent" />
              {/* Changed: Made title clickable */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cosmic Todo</h2>
            </button>
          </div>
          
          {/* Changed: Show user menu if authenticated, auth buttons with demo copy if not */}
          {isAuthenticated ? (
            <div className="mb-4 -mx-3">
              <UserMenu />
            </div>
          ) : (
            <div className="mb-4">
              {/* Changed: Added demo experience notice */}
              <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  👋 You&apos;re viewing the <strong>public demo</strong>. Sign up to create your own private Cosmic todo experience!
                </p>
              </div>
              <div className="space-y-2">
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
            </div>
          )}
          
          <nav className="space-y-1">
            <button
              onClick={(e) => handleListNavigation(e, undefined)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                !currentListSlug
                  ? 'bg-accent-light dark:bg-accent/20 text-accent dark:text-accent'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {/* Changed: Use Inbox icon instead of ListTodo */}
              <Inbox className="w-5 h-5" />
              <span className="font-medium">All Tasks</span>
            </button>
            
            {/* Changed: Only show skeleton during initial load, not when switching lists */}
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
                            : currentListSlug === list.slug
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
                        {/* Changed: Use metadata.name instead of title for list name display */}
                        <span className={`font-medium flex-1 truncate text-left ${isSyncing ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                          {list.metadata.name || list.title}
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
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
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
                          {/* Changed: Only show invite if authenticated */}
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

            {/* Changed: Always show create list form (works in demo mode) */}
            <div className="pt-4">
              <CreateListForm 
                onListCreated={handleListCreated}
                onListReplaced={handleListReplaced}
                onCreatingStateChange={handleCreatingStateChange}
                onNavigateToList={handleNavigateToList}
              />
            </div>
          </nav>
        </div>
        
        {/* Changed: Added Built with Cosmic button at bottom of sidebar */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
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
      </aside>

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

      {/* Changed: Only show invite modal if authenticated */}
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