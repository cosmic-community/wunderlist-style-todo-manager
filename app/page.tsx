'use client'

import { useState, useCallback } from 'react'
import ClientTaskList from '@/components/ClientTaskList'
import ClientSidebar from '@/components/ClientSidebar'
import ClientMobileHeader from '@/components/ClientMobileHeader'
import ClientListHeader from '@/components/ClientListHeader'
import CosmicBadge from '@/components/CosmicBadge'

export default function Home() {
  // Changed: Track current list slug for client-side navigation without sidebar reload
  const [currentListSlug, setCurrentListSlug] = useState<string | undefined>(undefined)
  // Changed: Track when a list is being created to show loading state
  const [isCreatingList, setIsCreatingList] = useState(false)
  // Changed: Track refresh key to trigger list area refresh when list is updated
  const [refreshKey, setRefreshKey] = useState(0)

  // Changed: Callback to handle list selection without reloading sidebar
  const handleListChange = useCallback((slug?: string) => {
    setCurrentListSlug(slug)
  }, [])

  // Changed: Callback to trigger refresh of main list area
  const handleListRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  // Changed: Get bucket slug from environment variable - using window check for client component
  const bucketSlug = process.env.NEXT_PUBLIC_COSMIC_BUCKET_SLUG || ''
  
  return (
    // Changed: Use h-screen with fixed positioning approach to prevent excessive scrolling
    <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden">
      {/* Mobile Header */}
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
      
      {/* Changed: Main Content - contained within flex layout, no extra scrolling */}
      <main className="flex-1 pt-16 md:pt-0 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 pb-32">
          {/* Changed: Show different content based on selected list */}
          {currentListSlug ? (
            <>
              {/* Changed: Show list header when a list is selected */}
              <ClientListHeader listSlug={currentListSlug} refreshKey={refreshKey} />
              <ClientTaskList 
                key={`${currentListSlug}-${refreshKey}`}
                listSlug={currentListSlug} 
                refreshKey={refreshKey}
              />
            </>
          ) : (
            <>
              {/* Changed: Page title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                All Tasks
              </h1>
              
              <ClientTaskList 
                key={`all-${refreshKey}`}
                refreshKey={refreshKey}
              />
            </>
          )}
        </div>
      </main>
      
      {/* Cosmic Badge - Changed: Pass required bucketSlug prop */}
      <CosmicBadge bucketSlug={bucketSlug} />
    </div>
  )
}