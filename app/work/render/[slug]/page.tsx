import { workItems } from '@/lib/projects'
import { RenderDetailClient } from './RenderDetailClient'

export function generateStaticParams() {
  return workItems.map((item) => ({ slug: item.id }))
}

interface Props { params: Promise<{ slug: string }> }

export default async function RenderDetailPage({ params }: Props) {
  const { slug } = await params
  return <RenderDetailClient slug={slug} />
}
