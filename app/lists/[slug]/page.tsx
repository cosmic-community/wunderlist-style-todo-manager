// app/lists/[slug]/page.tsx
import { getTasks, getLists } from '@/lib/cosmic'
import { notFound } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TaskList from '@/components/TaskList'
import MobileHeader from '@/components/MobileHeader'

export const revalidate = 0

export default async function ListPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [tasks, lists] = await Promise.all([
    getTasks(),
    getLists()
  ])
  
  const currentList = lists.find(list => list.slug === slug)
  
  if (!currentList) {
    notFound()
  }
  
  const listTasks = tasks.filter(
    task => task.metadata.list?.slug === slug
  )
  
  return (
    <div className="flex h-screen bg-black">
      {/* Mobile Header */}
      <MobileHeader lists={lists} currentList={currentList} />
      
      {/* Desktop Sidebar */}
      <Sidebar lists={lists} currentListSlug={slug} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-400">
              {currentList.title}
            </h1>
          </div>
          
          <TaskList tasks={listTasks} lists={lists} listSlug={slug} />
        </div>
      </main>
    </div>
  )
}