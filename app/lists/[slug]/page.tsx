// app/lists/[slug]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTasksByList, getLists, getListBySlug, getUserOwnerKey } from '@/lib/cosmic'
import { List, Task } from '@/types'
import ClientTaskList from '@/components/ClientTaskList'
import ClientSidebar from '@/components/ClientSidebar'
import ClientMobileHeader from '@/components/ClientMobileHeader'
import { cookies } from 'next/headers'

// Changed: Disable caching for this page to always show latest data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ListPageProps {
  params: Promise<{ slug: string }>
}

async function ListContent({ slug }: { slug: string }) {
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

  // Fetch the list first to check if it exists
  const list = await getListBySlug(slug, userOwnerKey)
  
  if (!list) {
    notFound()
  }
  
  // Changed: Fetch tasks and all lists with user owner key
  const [tasksData, listsData] = await Promise.all([
    getTasksByList(list.id, userOwnerKey),
    getLists(userOwnerKey)
  ])
  
  const tasks = tasksData as Task[]
  const lists = listsData as List[]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Changed: Server-rendered sidebar hidden on mobile */}
      <ClientSidebar initialLists={lists} currentListSlug={slug} />
      
      {/* Changed: Mobile header - client component */}
      <ClientMobileHeader currentListSlug={slug} />
      
      {/* Changed: Main content area - adjusted padding for larger mobile header */}
      <main className="flex-1 overflow-y-auto pt-[72px] md:pt-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          {/* Changed: List header with color indicator - increased sizes for mobile */}
          <div className="mb-6 flex items-center gap-3">
            <div 
              className="w-5 h-5 md:w-4 md:h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
            />
            {/* Changed: Increased heading size on mobile */}
            <h1 className="text-3xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {list.metadata.name}
            </h1>
          </div>
          
          {/* Task list component */}
          <ClientTaskList initialTasks={tasks} lists={lists} listSlug={slug} />
        </div>
      </main>
    </div>
  )
}

export default async function ListPage({ params }: ListPageProps) {
  const { slug } = await params
  
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
      </div>
    }>
      <ListContent slug={slug} />
    </Suspense>
  )
}