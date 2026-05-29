import { notFound } from 'next/navigation'
import { CATEGORY_CONFIG, getItemsByCategory } from '@/lib/projects'
import { CategoryDomeView } from '@/components/CategoryDomeView'

export function generateStaticParams() {
  return CATEGORY_CONFIG.map(c => ({ category: c.slug }))
}

interface Props {
  params: Promise<{ category: string }>
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  const config = CATEGORY_CONFIG.find(c => c.slug === category)
  if (!config) notFound()

  const items = getItemsByCategory(category)

  return <CategoryDomeView config={config!} items={items} />
}
