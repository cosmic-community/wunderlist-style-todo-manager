'use client'

import { useState } from 'react'
import ClientTaskList from '@/components/ClientTaskList'
import ClientSidebar from '@/components/ClientSidebar'
import ClientMobileHeader from '@/components/ClientMobileHeader'
import ClientListHeader from '@/components/ClientListHeader'
import AuthGuard from '@/components/AuthGuard'

function TodoApp() {
  // Changed: Manage current list slug in state for client-side navigation
  const [currentListSlug, setCurrentListSlug] = useState<string | undefined>(undefined)

  // Changed: Handle list changes without page refresh
  const handleListChange = (slug?: string) => {
    setCurrentListSlug(slug)
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      {/* Mobile Header */}
      <ClientMobileHeader currentListSlug={currentListSlug} onListChange={handleListChange} />
      
      {/* Desktop Sidebar */}
      <ClientSidebar currentListSlug={currentListSlug} onListChange={handleListChange} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          {/* Changed: Show list header or default header */}
          {currentListSlug ? (
            <ClientListHeader listSlug={currentListSlug} />
          ) : (
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">All Tasks</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your tasks
              </p>
            </div>
          )}
          
          <ClientTaskList listSlug={currentListSlug} />
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <AuthGuard>
      <TodoApp />
    </AuthGuard>
  )
}