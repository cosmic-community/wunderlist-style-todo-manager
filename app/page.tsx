import { getTasks, getLists } from '@/lib/cosmic'
import Sidebar from '@/components/Sidebar'
import TaskList from '@/components/TaskList'
import MobileHeader from '@/components/MobileHeader'

export const revalidate = 0

export default async function Home() {
  const [tasks, lists] = await Promise.all([
    getTasks(),
    getLists()
  ])
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader lists={lists} />
      
      {/* Desktop Sidebar */}
      <Sidebar lists={lists} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All Tasks</h1>
            <p className="text-gray-600 mt-1">
              {tasks.filter(t => !t.metadata.completed).length} tasks pending
            </p>
          </div>
          
          <TaskList tasks={tasks} lists={lists} />
        </div>
      </main>
    </div>
  )
}