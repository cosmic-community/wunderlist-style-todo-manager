// app/lists/[slug]/not-found.tsx
import Link from 'next/link'

export default function ListNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">List Not Found</h2>
        <p className="text-gray-600 mb-6">The list you're looking for doesn't exist</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View All Tasks
        </Link>
      </div>
    </div>
  )
}