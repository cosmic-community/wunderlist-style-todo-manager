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
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader lists={lists} currentList={currentList} />
      
      {/* Desktop Sidebar */}
      <Sidebar lists={lists} currentListSlug={slug} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: currentList.metadata.color || '#3b82f6' }}
              />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {currentList.title}
              </h1>
            </div>
            {currentList.metadata.description && (
              <p className="text-gray-600 ml-7">{currentList.metadata.description}</p>
            )}
            <p className="text-gray-600 ml-7 mt-1">
              {listTasks.filter(t => !t.metadata.completed).length} tasks pending
            </p>
          </div>
          
          <TaskList tasks={listTasks} lists={lists} listSlug={slug} />
        </div>
      </main>
    </div>
  )
}