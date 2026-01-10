'use client'

import { useState, useCallback, useEffect } from 'react'
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
  
  // Changed: Track current list slug for client-side navigation without page reload
  const [currentListSlug, setCurrentListSlug] = useState<string | undefined>(
    initialSlug === '' ? undefined : initialSlug
  )
  
  // Changed: Track when a list is being created to show loading state
  const [isCreatingList, setIsCreatingList] = useState(false)
  
  // Changed: Track refresh key to trigger list area refresh when list is updated
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Changed: Track if list is being updated to show loading state
  const [isUpdatingList, setIsUpdatingList] = useState(false)

  // Changed: Sync currentListSlug with URL changes (browser back/forward)
  useEffect(() => {
    if (pathname === '/') {
      setCurrentListSlug(undefined)
    } else if (pathname.startsWith('/lists/')) {
      const slugFromUrl = pathname.replace('/lists/', '')
      setCurrentListSlug(slugFromUrl)
    }
  }, [pathname])

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
    setIsUpdatingList(true)
    setRefreshKey(prev => prev + 1)
    // Reset updating state after a short delay to allow UI to update
    setTimeout(() => setIsUpdatingList(false), 500)
  }, [])

  return (
    // Changed: Use h-screen with flex layout and overflow-hidden to prevent excessive scrolling
    <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden">
      {/* Mobile Header - Changed: Pass handlers for client-side navigation */}
      <ClientMobileHeader 
        currentListSlug={currentListSlug}
        onListChange={handleListChange}
        onListRefresh={handleListRefresh}
      />
      
      {/* Desktop Sidebar - Changed: Pass onListChange to prevent sidebar reload */}
      <ClientSidebar 
        currentListSlug={currentListSlug}
        onListChange={handleListChange}
        onCreatingStateChange={setIsCreatingList}
        onListRefresh={handleListRefresh}
      />
      
      {/* Changed: Main Content - flex-1 with overflow-y-auto for internal scrolling only */}
      <main className="flex-1 pt-16 md:pt-0 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 pb-32">
            {/* Changed: Show creating list loading state when a list is being created */}
            {isCreatingList ? (
              <SkeletonLoader variant="creating-list" />
            ) : isUpdatingList ? (
              // Changed: Show loading state while list is being updated
              <>
                <SkeletonLoader variant="header" />
                <div className="space-y-3 mt-6">
                  <SkeletonLoader variant="task" count={3} />
                </div>
              </>
            ) : currentListSlug ? (
              <>
                <ClientListHeader listSlug={currentListSlug} refreshKey={refreshKey} />
                <ClientTaskList listSlug={currentListSlug} refreshKey={refreshKey} />
              </>
            ) : (
              // Changed: Show All Tasks when no list is selected
              <>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  All Tasks
                </h1>
                <ClientTaskList refreshKey={refreshKey} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}