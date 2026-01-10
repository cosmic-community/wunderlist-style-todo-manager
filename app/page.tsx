import { Suspense } from 'react'
import { getTasks, getLists, getUserOwnerKey } from '@/lib/cosmic'
import { List, Task } from '@/types'
import ClientTaskList from '@/components/ClientTaskList'
import ClientSidebar from '@/components/ClientSidebar'
import ClientMobileHeader from '@/components/ClientMobileHeader'
import { cookies } from 'next/headers'

// Changed: Disable caching for this page to always show latest data
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function HomeContent() {
  // Get user owner key from auth cookie
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth_token')?.value
  let userOwnerKey: string | undefined
  
  if (authToken) {
    try {
      const userData = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString())
      if (userData.id) {
        userOwnerKey = await getUserOwnerKey(userData.id)
      }
    } catch {
      // Invalid token, continue without user owner key
    }
  }
  
  // Changed: Fetch data with user owner key for authenticated queries
  const [tasksData, listsData] = await Promise.all([
    getTasks(userOwnerKey),
    getLists(userOwnerKey)
  ])
  
  const tasks = tasksData as Task[]
  const lists = listsData as List[]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Changed: Server-rendered sidebar hidden on mobile, uses client component for interactivity */}
      <ClientSidebar initialLists={lists} />
      
      {/* Changed: Mobile header - client component */}
      <ClientMobileHeader />
      
      {/* Changed: Main content area - adjusted padding for larger mobile header */}
      <main className="flex-1 overflow-y-auto pt-[72px] md:pt-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          {/* Changed: Page title with larger mobile text */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-2xl font-bold text-gray-900 dark:text-white">All Tasks</h1>
          </div>
          
          {/* Changed: Task list component handles all task interactions */}
          <ClientTaskList initialTasks={tasks} lists={lists} />
        </div>
      </main>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}