'use client'

import { useState, useCallback } from 'react'
import ClientTaskList from '@/components/ClientTaskList'
import ClientSidebar from '@/components/ClientSidebar'
import ClientMobileHeader from '@/components/ClientMobileHeader'
import ClientListHeader from '@/components/ClientListHeader'
import SkeletonLoader from '@/components/SkeletonLoader'

interface ListPageClientProps {
  slug: string
}

export default function ListPageClient({ slug }: ListPageClientProps) {
  // Changed: Track when a list is being created to show loading state
  const [isCreatingList, setIsCreatingList] = useState(false)
  // Changed: Track refresh key to trigger list area refresh when list is updated
  const [refreshKey, setRefreshKey] = useState(0)
  // Changed: Track if list is being updated to show loading state
  const [isUpdatingList, setIsUpdatingList] = useState(false)

  // Changed: Callback to trigger refresh of main list area
  const handleListRefresh = useCallback(() => {
    setIsUpdatingList(true)
    setRefreshKey(prev => prev + 1)
    // Reset updating state after a short delay to allow UI to update
    setTimeout(() => setIsUpdatingList(false), 500)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden">
      {/* Mobile Header */}
      <ClientMobileHeader currentListSlug={slug} onListRefresh={handleListRefresh} />
      
      {/* Desktop Sidebar */}
      <ClientSidebar 
        currentListSlug={slug} 
        onCreatingStateChange={setIsCreatingList}
        onListRefresh={handleListRefresh}
      />
      
      {/* Changed: Main Content - properly scrollable with fixed header space */}
      <main className="flex-1 pt-16 md:pt-0 overflow-y-auto">
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
          ) : (
            <>
              <ClientListHeader listSlug={slug} refreshKey={refreshKey} />
              <ClientTaskList listSlug={slug} refreshKey={refreshKey} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}