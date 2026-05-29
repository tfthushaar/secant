import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { workItems, CATEGORY_CONFIG } from '@/lib/projects'
import { Navigator } from '@/components/Navigator'
import { PageTransition } from '@/components/PageTransition'

export function generateStaticParams() {
  return workItems.map((item) => ({ slug: item.id }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function RenderDetailPage({ params }: Props) {
  const { slug } = await params
  const idx      = workItems.findIndex((w) => w.id === slug)
  if (idx === -1) notFound()

  const item      = workItems[idx]
  const isSketch  = item.kind === 'sketch'
  const catConfig = CATEGORY_CONFIG.find(c =>
    c.value === 'Sketch' ? isSketch : c.value === item.category
  )

  const BG    = 'oklch(97.2% 0.006 78)'
  const INK   = 'oklch(8.5% 0.007 72)'
  const SOFT  = 'oklch(46% 0.007 74)'
  const FAINT = 'oklch(62% 0.006 74)'
  const LINE  = 'oklch(88% 0.006 76)'

  return (
    <PageTransition style={{ minHeight: '100dvh', background: BG, fontFamily: 'var(--font-jost), sans-serif' }}>

      {/* Fixed top bar */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '3.2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.2rem,4vw,2.5rem)',
        background: BG, borderBottom: `1px solid ${LINE}`,
      }}>
        {/* Back to category */}
        <Link href={catConfig ? `/work/${catConfig.slug}` : '/work'} style={{
          fontWeight: 300, fontSize: '0.6rem', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: SOFT,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem',
        }}>
          <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
            <line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
            <polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          </svg>
          {catConfig?.label ?? 'Work'}
        </Link>
        <span style={{ fontWeight: 300, fontSize: '0.56rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: FAINT }}>
          {isSketch ? 'Sketch' : 'Render'}
        </span>
      </header>

      {/* Main layout: left details, right full-quality image */}
      <div style={{ paddingTop: '3.2rem', minHeight: '100dvh', display: 'grid', gridTemplateColumns: '38fr 62fr' }}>

        {/* Left: details */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: 'clamp(2.5rem,5vh,4.5rem) clamp(1.5rem,4vw,3.5rem)',
          borderRight: `1px solid ${LINE}`,
          minHeight: 'calc(100dvh - 3.2rem)',
        }}>
          <div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>
              {[item.category, isSketch ? 'Sketch' : 'Render'].map(label => (
                <span key={label} style={{
                  fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.35em',
                  textTransform: 'uppercase', color: FAINT,
                  border: `1px solid ${LINE}`, padding: '0.28rem 0.7rem',
                }}>{label}</span>
              ))}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontWeight: 400,
              fontSize: 'clamp(2.4rem, 4.5vw, 5rem)',
              lineHeight: 1.0, letterSpacing: '-0.005em',
              color: INK, margin: 0,
            }}>
              {item.title}
            </h1>

            {/* Counter */}
            <div style={{ fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.35em', color: FAINT, marginTop: '1.8rem' }}>
              {String(idx + 1).padStart(2, '0')} / {String(workItems.length).padStart(2, '0')}
            </div>
          </div>

          {/* Prev / Next within the same category */}
          {(() => {
            const catItems = workItems.filter(w =>
              isSketch ? w.kind === 'sketch' : w.category === item.category
            )
            const ci  = catItems.findIndex(w => w.id === slug)
            const prev = catItems[(ci - 1 + catItems.length) % catItems.length]
            const next = catItems[(ci + 1) % catItems.length]
            return (
              <div style={{ paddingTop: '2rem', borderTop: `1px solid ${LINE}`, display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                <Link href={`/work/render/${prev.id}`} style={{ fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: SOFT, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <svg width="14" height="7" viewBox="0 0 14 7" fill="none"><line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.8"/><polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.8" fill="none"/></svg>
                  {prev.title}
                </Link>
                <Link href={`/work/render/${next.id}`} style={{ fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: SOFT, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  {next.title}
                  <svg width="14" height="7" viewBox="0 0 14 7" fill="none"><line x1="0" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="0.8"/><polyline points="10,1 13,3.5 10,6" stroke="currentColor" strokeWidth="0.8" fill="none"/></svg>
                </Link>
              </div>
            )
          })()}
        </div>

        {/* Right: full-quality image, contain — no crop */}
        <div style={{
          position: 'relative',
          background: isSketch ? '#f5f0e8' : BG,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(1.5rem,3vh,2.5rem)',
          minHeight: 'calc(100dvh - 3.2rem)',
        }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image
              src={item.image}
              alt={item.title}
              fill
              style={{ objectFit: 'contain', objectPosition: 'center' }}
              priority
              unoptimized
              sizes="62vw"
            />
          </div>
        </div>

      </div>

      <Navigator />
    </PageTransition>
  )
}
