'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { List } from '@/types'
import { CheckSquare, Menu, X, MoreHorizontal, Pencil, Trash2, UserPlus, Inbox, LogIn, UserPlus as SignupIcon, Loader2 } from 'lucide-react'
// Changed: Removed Settings import as we're removing the settings button from mobile header
import CreateListForm from './CreateListForm'
import EditListModal from './EditListModal'
import SkeletonLoader from './SkeletonLoader'
import UserMenu from './UserMenu'
import InviteModal from './InviteModal'
import { useAuth } from '@/contexts/AuthContext'

interface MobileHeaderProps {
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

export default function MobileHeader({ 
  lists, 
  currentListSlug, 
  isLoading = false, 
  syncingListSlugs = new Set(),
  onListCreated, 
  onListReplaced, 
  onListUpdated, 
  onListDeleted,
  onListClick,
  onRefresh,
  onCreatingStateChange
}: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [invitingList, setInvitingList] = useState<List | null>(null)
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
    setIsMenuOpen(false)
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

  // Changed: Handle list navigation without page refresh
  const handleListNavigation = (e: React.MouseEvent, slug?: string, isSyncing?: boolean) => {
    e.preventDefault()
    
    // Changed: Don't allow navigation to syncing lists
    if (isSyncing) {
      return
    }
    
    setIsMenuOpen(false)
    
    if (onListClick) {
      onListClick(slug)
    }
  }

  // Changed: Handle navigation to newly created list
  const handleNavigateToList = (slug: string) => {
    setIsMenuOpen(false)
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

  // Get current list title
  const currentList = lists.find(l => l.slug === currentListSlug)
  const headerTitle = currentList?.metadata.name || 'All Tasks'

  return (
    <>
      {/* Changed: Fixed Mobile Header - increased sizes for better mobile readability */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            aria-label="Open menu"
          >
            {/* Changed: Increased icon size from w-6 h-6 to w-7 h-7 */}
            <Menu className="w-7 h-7" />
          </button>
          
          <div className="flex items-center gap-2">
            {/* Changed: Increased icon size from w-5 h-5 to w-6 h-6 */}
            <CheckSquare className="w-6 h-6 text-accent" />
            {/* Changed: Increased font size and max-width for title */}
            <span className="font-semibold text-lg text-gray-900 dark:text-white truncate max-w-[180px]">
              {headerTitle}
            </span>
          </div>
          
          {/* Changed: Removed settings button - now just an empty placeholder to maintain layout balance */}
          <div className="w-12 h-12" />
        </div>
      </header>

      {/* Mobile Slide-out Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Changed: Menu Panel - increased sizes throughout */}
          <div className="md:hidden fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 z-50 shadow-xl safe-area-inset-top safe-area-inset-bottom overflow-y-auto">
            <div className="p-5">
              {/* Changed: Header - increased sizes */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {/* Changed: Increased icon from w-6 h-6 to w-7 h-7 */}
                  <CheckSquare className="w-7 h-7 text-accent" />
                  {/* Changed: Increased title from text-xl to text-2xl */}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cosmic Todo</h2>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close menu"
                >
                  {/* Changed: Increased icon from w-5 h-5 to w-6 h-6 */}
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Changed: Show user menu if authenticated, auth buttons with demo copy if not */}
              {isAuthenticated ? (
                <div className="mb-4 -mx-3">
                  <UserMenu />
                </div>
              ) : (
                <div className="mb-4">
                  {/* Changed: Added demo experience notice - increased text size */}
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                      👋 You&apos;re viewing the <strong>public demo</strong>. Sign up to create your own private Cosmic todo experience!
                    </p>
                  </div>
                  {/* Changed: Increased button padding and text size */}
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium text-base transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-base transition-colors"
                    >
                      <SignupIcon className="w-5 h-5" />
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}

              {/* Changed: Navigation - increased sizes */}
              <nav className="space-y-1">
                <button
                  onClick={(e) => handleListNavigation(e, undefined)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    !currentListSlug
                      ? 'bg-accent-light dark:bg-accent/20 text-accent dark:text-accent'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {/* Changed: Increased icon from w-5 h-5 to w-6 h-6 */}
                  <Inbox className="w-6 h-6" />
                  {/* Changed: Increased text size */}
                  <span className="font-medium text-base">All Tasks</span>
                </button>

                {isLoading ? (
                  <div className="pt-4">
                    <div className="pb-2 px-3">
                      {/* Changed: Increased section header text */}
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Lists
                      </h3>
                    </div>
                    <SkeletonLoader variant="list" count={3} />
                  </div>
                ) : lists.length > 0 && (
                  <>
                    <div className="pt-4 pb-2 px-3">
                      {/* Changed: Increased section header text */}
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Lists
                      </h3>
                    </div>
                    
                    {lists.map((list) => {
                      // Changed: Check if this list is still syncing (has temp ID)
                      const isSyncing = syncingListSlugs.has(list.slug)
                      
                      return (
                        <div key={list.id} className="relative group">
                          {/* Changed: Use div wrapper with flex to separate clickable areas for touch devices - increased padding */}
                          <div className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                            isSyncing
                              ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50'
                              : currentListSlug === list.slug
                                ? 'bg-accent-light dark:bg-accent/20 text-accent dark:text-accent'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}>
                            {/* Changed: Main clickable area for navigation - takes most of the space */}
                            <button
                              onClick={(e) => handleListNavigation(e, list.slug, isSyncing)}
                              disabled={isSyncing}
                              className={`flex-1 flex items-center gap-3 text-left ${isSyncing ? 'cursor-not-allowed' : ''}`}
                            >
                              {/* Changed: Show spinner if syncing, otherwise show color dot - increased size */}
                              {isSyncing ? (
                                <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin text-gray-400" />
                              ) : (
                                <div 
                                  className="w-5 h-5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
                                />
                              )}
                              {/* Changed: Use metadata.name instead of title for list name display - increased text size */}
                              <span className={`font-medium text-base flex-1 truncate ${isSyncing ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                              {list.metadata.name || list.title}
                              </span>
                            </button>
                            
                            {/* Changed: Show "Saving..." text if syncing */}
                            {isSyncing && (
                              <span className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">
                                Saving...
                              </span>
                            )}
                            
                            {/* Changed: More options button - always visible on mobile (removed opacity-0 group-hover) to fix double-tap issue - increased size */}
                            {!isSyncing && (
                              <button
                                onClick={(e) => toggleMenu(e, list.id)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                                aria-label="List options"
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                          
                          {/* Changed: Dropdown menu - don't show for syncing lists - increased sizes */}
                          {openMenuId === list.id && !isSyncing && (
                            <div 
                              ref={menuRef}
                              className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                            >
                              {/* Changed: Only show invite if authenticated - increased padding and text */}
                              {isAuthenticated && (
                                <button
                                  onClick={(e) => handleInviteClick(e, list)}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <UserPlus className="w-5 h-5" />
                                  Invite
                                </button>
                              )}
                              <button
                                onClick={(e) => handleEditClick(e, list)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Pencil className="w-5 h-5" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(e, list.id)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-base text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
          </div>
        </>
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