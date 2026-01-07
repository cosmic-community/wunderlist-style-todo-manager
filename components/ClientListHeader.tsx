'use client'

import { useState, useEffect } from 'react'
import { List } from '@/types'
import { useRouter } from 'next/navigation'
import SkeletonLoader from '@/components/SkeletonLoader'

interface ClientListHeaderProps {
  listSlug: string
}

export default function ClientListHeader({ listSlug }: ClientListHeaderProps) {
  const [list, setList] = useState<List | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchList() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/lists')
        if (response.ok) {
          const data = await response.json()
          const found = data.lists.find((l: List) => l.slug === listSlug)
          if (found) {
            setList(found)
          } else {
            setNotFound(true)
          }
        }
      } catch (error) {
        console.error('Error fetching list:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [listSlug])

  useEffect(() => {
    if (notFound) {
      router.push('/404')
    }
  }, [notFound, router])

  if (isLoading) {
    return <SkeletonLoader variant="header" />
  }

  if (!list) {
    return null
  }

  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-indigo-400">
        {list.title}
      </h1>
    </div>
  )
}