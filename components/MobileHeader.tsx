'use client'

import { useState } from 'react'
import Link from 'next/link'
import { List } from '@/types'
import { Menu, X, CheckSquare, ListTodo } from 'lucide-react'

interface MobileHeaderProps {
  lists: List[]
  currentList?: List
}

export default function MobileHeader({ lists, currentList }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">
              {currentList ? currentList.title : 'All Tasks'}
            </h1>
          </div>
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-900"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <nav className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-4 space-y-1">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  !currentList
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ListTodo className="w-5 h-5" />
                <span className="font-medium">All Tasks</span>
              </Link>
              
              {lists.length > 0 && (
                <>
                  <div className="pt-4 pb-2 px-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Lists
                    </h3>
                  </div>
                  
                  {lists.map((list) => (
                    <Link
                      key={list.id}
                      href={`/lists/${list.slug}`}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        currentList?.slug === list.slug
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
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
            </div>
          </nav>
        </div>
      )}
    </>
  )
}