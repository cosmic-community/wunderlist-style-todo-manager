import ClientTaskList from '@/components/ClientTaskList'
import ClientSidebar from '@/components/ClientSidebar'
import ClientMobileHeader from '@/components/ClientMobileHeader'
import CosmicBadge from '@/components/CosmicBadge'

export default function Home() {
  // Changed: Get bucket slug from environment variable to pass to CosmicBadge
  const bucketSlug = process.env.COSMIC_BUCKET_SLUG || ''
  
  return (
    // Changed: Use h-screen with fixed positioning approach to prevent excessive scrolling
    <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden">
      {/* Mobile Header */}
      <ClientMobileHeader />
      
      {/* Desktop Sidebar */}
      <ClientSidebar />
      
      {/* Changed: Main Content - contained within flex layout, no extra scrolling */}
      <main className="flex-1 pt-16 md:pt-0 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 pb-32">
          {/* Changed: Page title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            All Tasks
          </h1>
          
          <ClientTaskList />
        </div>
      </main>
      
      {/* Cosmic Badge - Changed: Pass required bucketSlug prop */}
      <CosmicBadge bucketSlug={bucketSlug} />
    </div>
  )
}