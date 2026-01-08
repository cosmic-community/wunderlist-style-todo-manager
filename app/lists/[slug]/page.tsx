// app/lists/[slug]/page.tsx
import ListPageClient from '@/components/ListPageClient'

export default async function ListPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  return <ListPageClient slug={slug} />
}