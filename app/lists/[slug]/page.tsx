// app/lists/[slug]/page.tsx
import ClientTaskList from '@/components/ClientTaskList'
import ClientSidebar from '@/components/ClientSidebar'
import ClientMobileHeader from '@/components/ClientMobileHeader'
import ClientListHeader from '@/components/ClientListHeader'

export default async function ListPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      {/* Mobile Header */}
      <ClientMobileHeader currentListSlug={slug} />
      
      {/* Desktop Sidebar */}
      <ClientSidebar currentListSlug={slug} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          <ClientListHeader listSlug={slug} />
          
          <ClientTaskList listSlug={slug} />
        </div>
      </main>
    </div>
  )
}