import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { workItems } from '@/lib/projects'
import { Navigator } from '@/components/Navigator'

export function generateStaticParams() {
  return workItems.map((item) => ({ slug: item.id }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function WorkItemPage({ params }: Props) {
  const { slug } = await params
  const idx      = workItems.findIndex((w) => w.id === slug)
  if (idx === -1) notFound()

  const item = workItems[idx]
  const prev = workItems[(idx - 1 + workItems.length) % workItems.length]
  const next = workItems[(idx + 1) % workItems.length]

  const isSketch  = item.kind === 'sketch'
  const bg        = 'oklch(97.2% 0.006 78)'
  const inkSoft   = 'oklch(46% 0.007 74)'
  const inkFaint  = 'oklch(62% 0.006 74)'
  const line      = 'oklch(88% 0.006 76)'

  return (
    <div style={{ minHeight: '100dvh', background: bg, fontFamily: 'var(--font-jost), sans-serif' }}>

      {/* ── Fixed top bar ──────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '3.2rem',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(1.2rem,4vw,2.5rem)',
        background: bg,
        borderBottom: `1px solid ${line}`,
      }}>
        <Link href="/work" style={{
          fontWeight: 300, fontSize: '0.6rem', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: inkSoft,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem',
        }}>
          <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
            <line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
            <polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          </svg>
          Work
        </Link>
      </header>

      {/* ── Single image — hero ─────────────────────────── */}
      <div style={{
        position: 'relative',
        width: '100%',
        marginTop: '3.2rem',
        /* Sketch images are portrait, renders are landscape.
           Use natural aspect ratio via CSS aspect-ratio.     */
        aspectRatio: isSketch ? '3 / 4' : '16 / 9',
        overflow: 'hidden',
        maxHeight: 'calc(100dvh - 3.2rem - 9rem)', /* leave room for meta below */
      }}>
        <Image
          src={item.image}
          alt={item.title}
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
          unoptimized
        />
      </div>

      {/* ── Meta + navigation ──────────────────────────── */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: 'clamp(1.8rem,3.5vh,3rem) clamp(1.2rem,5vw,4rem)',
        display: 'flex', flexDirection: 'column', gap: '1.8rem',
      }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontWeight: 500,
            fontSize: 'clamp(2rem, 4.5vw, 4.2rem)',
            lineHeight: 1.0,
            color: 'oklch(8.5% 0.007 72)',
          }}>
            {item.title}
          </h1>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <span style={{
              fontWeight: 300, fontSize: '0.55rem', letterSpacing: '0.35em',
              textTransform: 'uppercase', color: inkFaint,
              border: `1px solid ${line}`, padding: '0.3rem 0.7rem',
            }}>
              {item.category}
            </span>
            <span style={{
              fontWeight: 300, fontSize: '0.55rem', letterSpacing: '0.35em',
              textTransform: 'uppercase', color: inkFaint,
              border: `1px solid ${line}`, padding: '0.3rem 0.7rem',
            }}>
              {isSketch ? 'Sketch' : 'Render'}
            </span>
          </div>
        </div>

        {/* Prev / Next */}
        <div style={{
          paddingTop: '1.2rem',
          borderTop: `1px solid ${line}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Link href={`/work/${prev.id}`} style={{
            fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.3em',
            textTransform: 'uppercase', color: inkSoft,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem',
            transition: 'opacity 0.2s',
          }} className="hover:opacity-40">
            <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
              <line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
              <polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
            </svg>
            {prev.title}
          </Link>

          <span style={{ fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.32em', color: inkFaint }}>
            {idx + 1} / {workItems.length}
          </span>

          <Link href={`/work/${next.id}`} style={{
            fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.3em',
            textTransform: 'uppercase', color: inkSoft,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem',
            transition: 'opacity 0.2s',
          }} className="hover:opacity-40">
            {next.title}
            <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
              <line x1="0" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
              <polyline points="10,1 13,3.5 10,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
            </svg>
          </Link>
        </div>

      </div>

      <Navigator />
    </div>
  )
}
