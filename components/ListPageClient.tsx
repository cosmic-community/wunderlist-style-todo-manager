'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import ClientTaskList from '@/components/ClientTaskList'
import ClientSidebar from '@/components/ClientSidebar'
import ClientMobileHeader from '@/components/ClientMobileHeader'
import ClientListHeader from '@/components/ClientListHeader'
import SkeletonLoader from '@/components/SkeletonLoader'
import CreateListModal from '@/components/CreateListModal'
import { useRouter, usePathname } from 'next/navigation'
import { List } from '@/types'
import { ChevronDown, Inbox, Plus } from 'lucide-react'

interface ListPageClientProps {
  slug: string
}

export default function ListPageClient({ slug: initialSlug }: ListPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Changed: Ref to scrollable container to reset scroll on navigation
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Changed: Track current list slug for client-side navigation without page reload
  const [currentListSlug, setCurrentListSlug] = useState<string | undefined>(
    initialSlug === '' ? undefined : initialSlug
  )

  // Changed: Track when a list is being created to show loading state
  const [isCreatingList, setIsCreatingList] = useState(false)

  // Changed: Track refresh key to trigger list area refresh when list is updated
  const [refreshKey, setRefreshKey] = useState(0)

  // Changed: Store the menu open function from MobileHeader
  const [openMenuFn, setOpenMenuFn] = useState<(() => void) | null>(null)

  // State for All Tasks list selector dropdown
  const [showAllTasksDropdown, setShowAllTasksDropdown] = useState(false)
  const [allLists, setAllLists] = useState<List[]>([])
  const allTasksDropdownRef = useRef<HTMLDivElement>(null)

  // Changed: State for create list modal from All Tasks dropdown
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Fetch lists for the All Tasks dropdown
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await fetch('/api/lists')
        if (response.ok) {
          const data = await response.json()
          setAllLists(data.lists || [])
        }
      } catch (error) {
        console.error('Error fetching lists:', error)
      }
    }
    fetchLists()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (allTasksDropdownRef.current && !allTasksDropdownRef.current.contains(event.target as Node)) {
        setShowAllTasksDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle list selection from All Tasks dropdown
  const handleAllTasksListSelect = (slug?: string) => {
    setShowAllTasksDropdown(false)
    handleListChange(slug)
  }

  // Changed: Sync currentListSlug with URL changes (browser back/forward)
  useEffect(() => {
    if (pathname === '/') {
      setCurrentListSlug(undefined)
    } else if (pathname.startsWith('/lists/')) {
      const slugFromUrl = pathname.replace('/lists/', '')
      setCurrentListSlug(slugFromUrl)
    }
  }, [pathname])

  // Changed: Reset scroll position when list changes to prevent title being cut off
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [currentListSlug])

  // Changed: Callback to scroll to top - used after adding tasks to fix mobile scroll issues
  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [])

  // Changed: Callback to handle list selection without reloading page
  const handleListChange = useCallback((newSlug?: string) => {
    setCurrentListSlug(newSlug)

    // Changed: Update URL without causing page reload using router.replace
    if (newSlug) {
      router.replace(`/lists/${newSlug}`, { scroll: false })
    } else {
      router.replace('/', { scroll: false })
    }
  }, [router])

  // Changed: Callback to trigger refresh of main list area
  const handleListRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  // Changed: Stable callback for menu open registration to prevent infinite re-renders
  const handleMenuOpenRegister = useCallback((fn: () => void) => {
    setOpenMenuFn(() => fn)
  }, [])

  // Changed: Handler for list created from create modal
  const handleListCreated = (newList: List) => {
    // Add to local allLists
    setAllLists(prev => [...prev, newList])
  }

  // Changed: Handler for list replaced after API confirms creation
  const handleListReplaced = (tempId: string, realList: List) => {
    // Update local allLists
    setAllLists(prev => prev.map(l => l.id === tempId ? realList : l))
  }

  // Changed: Handler for navigation to newly created list
  const handleNavigateToList = (slug: string) => {
    handleListChange(slug)
  }

  // Changed: Handler to open create list modal from empty state
  const handleCreateListFromEmpty = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  return (
    // Changed: Use h-screen with flex layout and overflow-hidden to prevent excessive scrolling
    <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden">
      {/* Desktop Sidebar - Changed: Pass onListChange to prevent sidebar reload */}
      <ClientSidebar
        currentListSlug={currentListSlug}
        onListChange={handleListChange}
        onCreatingStateChange={setIsCreatingList}
        onListRefresh={handleListRefresh}
      />

      {/* Changed: Main Content - no top header on mobile, menu accessed via bottom button */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Changed: Mobile Menu - renders full-page menu overlay, button is in TaskList */}
        <ClientMobileHeader
          currentListSlug={currentListSlug}
          onListChange={handleListChange}
          onListRefresh={handleListRefresh}
          onMenuOpenRegister={handleMenuOpenRegister}
        />

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 pb-32">
            {/* Changed: Show creating list loading state when a list is being created */}
            {isCreatingList ? (
              <div className="pt-safe-top pt-2 md:pt-8">
                <SkeletonLoader variant="creating-list" />
              </div>
            ) : currentListSlug ? (
              <>
                {/* Changed: Sticky header for consistent behavior on mobile and desktop */}
                {/* Using z-20 to ensure it stays above task cards which may have transforms */}
                {/* pt-safe-top handles the notch on mobile devices */}
                <div className="sticky top-0 z-20 bg-gray-50 dark:bg-black pt-safe-top pt-2 md:pt-8 pb-2 -mx-4 px-4">
                  <ClientListHeader
                    listSlug={currentListSlug}
                    refreshKey={refreshKey}
                    onListChange={handleListChange}
                    onRefresh={handleListRefresh}
                  />
                </div>
                <ClientTaskList listSlug={currentListSlug} refreshKey={refreshKey} onScrollToTop={scrollToTop} onOpenMenu={openMenuFn || undefined} />
              </>
            ) : (
              // Changed: Show All Tasks when no list is selected
              <>
                {/* Changed: Sticky header for consistent behavior on mobile and desktop */}
                {/* Using z-20 to ensure it stays above task cards which may have transforms */}
                {/* pt-safe-top handles the notch on mobile devices */}
                <div className="sticky top-0 z-20 bg-gray-50 dark:bg-black pt-safe-top pt-2 md:pt-8 pb-2 -mx-4 px-4">
                  <div className="mb-6">
                    {/* List selector dropdown - covers entire title area */}
                    <div className="relative" ref={allTasksDropdownRef}>
                      <button
                        onClick={() => setShowAllTasksDropdown(!showAllTasksDropdown)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        aria-label="Switch list"
                      >
                        <Inbox className="w-5 h-5 text-gray-500" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                          All Tasks
                        </h1>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showAllTasksDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {/* List selector dropdown menu */}
                      {showAllTasksDropdown && (
                        <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-80 overflow-y-auto">
                          {/* All Tasks option - currently selected */}
                          <button
                            onClick={() => handleAllTasksListSelect(undefined)}
                            className="w-full px-4 py-3 text-base md:px-3 md:py-2 md:text-sm text-left bg-accent/10 text-accent flex items-center gap-2.5 transition-colors"
                          >
                            <Inbox className="w-5 h-5" />
                            <span className="truncate font-medium">All Tasks</span>
                          </button>

                          {allLists.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                          )}

                          {allLists.map((listItem) => (
                            <button
                              key={listItem.id}
                              onClick={() => handleAllTasksListSelect(listItem.slug)}
                              className="w-full px-4 py-3 text-base md:px-3 md:py-2 md:text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
                            >
                              <div
                                className="w-5 h-5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: listItem.metadata.color || '#3b82f6' }}
                              />
                              <span className="truncate">{listItem.metadata.name || listItem.title}</span>
                            </button>
                          ))}

                          {/* Changed: Create list button at bottom of dropdown */}
                          <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                            <button
                              onClick={() => {
                                setShowAllTasksDropdown(false)
                                setShowCreateModal(true)
                              }}
                              className="w-full px-4 py-3 text-base md:px-3 md:py-2 md:text-sm text-left text-accent hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
                            >
                              <Plus className="w-5 h-5" />
                              <span>Create list</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Changed: Pass onCreateList callback so empty state can trigger list creation */}
                <ClientTaskList refreshKey={refreshKey} onScrollToTop={scrollToTop} onOpenMenu={openMenuFn || undefined} onCreateList={handleCreateListFromEmpty} />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Changed: Create List Modal for All Tasks dropdown */}
      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onListCreated={handleListCreated}
          onListReplaced={handleListReplaced}
          onCreatingStateChange={setIsCreatingList}
          onNavigateToList={handleNavigateToList}
        />
      )}
    </div>
  )
}