'use client'

import Link from 'next/link'
import { List } from '@/types'
import { CheckSquare, ListTodo } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
  lists: List[]
  currentListSlug?: string
}

export default function Sidebar({ lists, currentListSlug }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Todo Manager</h2>
          </div>
          <ThemeToggle />
        </div>
        
        <nav className="space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              !currentListSlug
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <ListTodo className="w-5 h-5" />
            <span className="font-medium">All Tasks</span>
          </Link>
          
          {lists.length > 0 && (
            <>
              <div className="pt-4 pb-2 px-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lists
                </h3>
              </div>
              
              {lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.slug}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentListSlug === list.slug
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: list.metadata.color || '#3b82f6' }}
                  />
                  <span className="font-medium">{list.title}</span>
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
    </aside>
  )
}