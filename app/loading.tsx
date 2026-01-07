import SkeletonLoader from '@/components/SkeletonLoader'

export default function Loading() {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-black">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <SkeletonLoader variant="sidebar" count={5} />
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          <SkeletonLoader variant="header" />
          <div className="space-y-2 pb-24">
            <SkeletonLoader variant="task" count={5} />
          </div>
        </div>
      </main>
    </div>
  )
}