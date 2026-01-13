'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import ClientTaskList from '@/components/ClientTaskList'
import ClientSidebar from '@/components/ClientSidebar'
import ClientMobileHeader from '@/components/ClientMobileHeader'
import ClientListHeader from '@/components/ClientListHeader'
import SkeletonLoader from '@/components/SkeletonLoader'
import { useRouter, usePathname } from 'next/navigation'

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
        
        {/* Changed: Fixed header on mobile - list title and description OR All Tasks title */}
        {!isCreatingList && (
          <div className="md:hidden fixed-list-header">
            {currentListSlug ? (
              <ClientListHeader listSlug={currentListSlug} refreshKey={refreshKey} />
            ) : (
              <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  All Tasks
                </h1>
              </div>
            )}
          </div>
        )}
        
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pt-safe-top">
          <div className="max-w-2xl mx-auto px-4 pb-32 pt-4 md:py-8">
            {/* Changed: Show creating list loading state when a list is being created */}
            {isCreatingList ? (
              <SkeletonLoader variant="creating-list" />
            ) : currentListSlug ? (
              <>
                {/* Changed: Desktop shows header inline, mobile shows it fixed */}
                <div className="hidden md:block">
                  <ClientListHeader listSlug={currentListSlug} refreshKey={refreshKey} />
                </div>
                {/* Changed: Add top padding on mobile to account for fixed header */}
                <div className="md:hidden list-content-with-fixed-header">
                  <ClientTaskList listSlug={currentListSlug} refreshKey={refreshKey} onScrollToTop={scrollToTop} onOpenMenu={openMenuFn || undefined} />
                </div>
                {/* Changed: Desktop content without extra padding */}
                <div className="hidden md:block">
                  <ClientTaskList listSlug={currentListSlug} refreshKey={refreshKey} onScrollToTop={scrollToTop} onOpenMenu={openMenuFn || undefined} />
                </div>
              </>
            ) : (
              // Changed: Show All Tasks when no list is selected - with fixed header treatment on mobile
              <>
                {/* Changed: Desktop shows header inline */}
                <div className="hidden md:block">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    All Tasks
                  </h1>
                </div>
                {/* Changed: Mobile content with padding for fixed header */}
                <div className="md:hidden list-content-with-fixed-header">
                  <ClientTaskList refreshKey={refreshKey} onScrollToTop={scrollToTop} onOpenMenu={openMenuFn || undefined} />
                </div>
                {/* Changed: Desktop content */}
                <div className="hidden md:block">
                  <ClientTaskList refreshKey={refreshKey} onScrollToTop={scrollToTop} onOpenMenu={openMenuFn || undefined} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}