// app/lists/[slug]/page.tsx
import ListPageClient from '@/components/ListPageClient'

interface ListPageProps {
  params: Promise<{ slug: string }>
}

export default async function ListPage({ params }: ListPageProps) {
  const { slug } = await params
  
  return <ListPageClient slug={slug} />
}