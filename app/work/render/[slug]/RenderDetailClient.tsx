'use client'

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { workItems, CATEGORY_CONFIG } from '@/lib/projects'
import { Navigator } from '@/components/Navigator'
import { PageTransition } from '@/components/PageTransition'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props { slug: string }

export function RenderDetailClient({ slug }: Props) {
  const isMobile = useIsMobile()
  const idx      = workItems.findIndex((w) => w.id === slug)
  if (idx === -1) notFound()

  const item      = workItems[idx]
  const isSketch  = item.kind === 'sketch'
  const catConfig = CATEGORY_CONFIG.find(c => c.value === item.category)

  const BG    = 'oklch(97.2% 0.006 78)'
  const INK   = 'oklch(8.5% 0.007 72)'
  const SOFT  = 'oklch(46% 0.007 74)'
  const FAINT = 'oklch(62% 0.006 74)'
  const LINE  = 'oklch(88% 0.006 76)'

  return (
    <PageTransition style={{ minHeight: '100dvh', background: BG, fontFamily: 'var(--font-sans), sans-serif' }}>

      {/* Fixed top bar */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '3.2rem',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(7rem,10vw,9rem) 0 clamp(1.2rem,4vw,2.5rem)',
        background: BG, borderBottom: `1px solid ${LINE}`,
      }}>
        <Link href={catConfig ? `/work/${catConfig.slug}` : '/work'} style={{
          fontWeight: 450, fontSize: '0.6rem', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: SOFT,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem',
        }}>
          <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
            <line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
            <polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          </svg>
          {catConfig?.label ?? 'Work'}
        </Link>
      </header>

      {/* Main layout: side-by-side on desktop, stacked on mobile */}
      <div style={{
        paddingTop: '3.2rem', minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '38fr 62fr',
      }}>

        {/* On mobile: image first (top), details below */}
        {isMobile && (
          <div style={{
            position: 'relative',
            background: isSketch ? '#f5f0e8' : BG,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
            minHeight: '60vw',
          }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '55vw' }}>
              <Image
                src={item.detailImage ?? item.image}
                alt={item.title}
                fill
                style={{ objectFit: 'contain', objectPosition: 'center' }}
                priority
                unoptimized
                sizes="100vw"
              />
            </div>
          </div>
        )}

        {/* Details */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: isMobile
            ? '1.5rem 1.5rem 2rem'
            : 'clamp(2.5rem,5vh,4.5rem) clamp(1.5rem,4vw,3.5rem)',
          borderRight: isMobile ? 'none' : `1px solid ${LINE}`,
          borderBottom: isMobile ? `1px solid ${LINE}` : 'none',
          minHeight: isMobile ? 'auto' : 'calc(100dvh - 3.2rem)',
        }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: isMobile ? '1rem' : '2.5rem' }}>
              {[item.category, isSketch ? 'Sketch' : 'Render'].map(label => (
                <span key={label} style={{
                  fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.35em',
                  textTransform: 'uppercase', color: FAINT,
                  border: `1px solid ${LINE}`, padding: '0.28rem 0.7rem',
                }}>{label}</span>
              ))}
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontWeight: 400,
              fontSize: isMobile ? 'clamp(1.8rem, 7vw, 2.8rem)' : 'clamp(2.4rem, 4.5vw, 5rem)',
              lineHeight: 1.0, letterSpacing: '-0.005em',
              color: INK, margin: 0,
            }}>
              {item.title}
            </h1>

            <div style={{ fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.35em', color: FAINT, marginTop: '1rem' }}>
              {String(idx + 1).padStart(2, '0')} / {String(workItems.length).padStart(2, '0')}
            </div>
          </div>

          {/* Prev / Next */}
          {(() => {
            const catItems = workItems.filter(w => w.category === item.category)
            const ci   = catItems.findIndex(w => w.id === slug)
            const prev = catItems[(ci - 1 + catItems.length) % catItems.length]
            const next = catItems[(ci + 1) % catItems.length]
            return (
              <div style={{
                paddingTop: isMobile ? '1.2rem' : '2rem',
                borderTop: `1px solid ${LINE}`,
                display: 'flex', flexDirection: 'column', gap: '1rem',
                marginTop: isMobile ? '1.5rem' : 0,
              }}>
                <Link href={`/work/render/${prev.id}`} style={{ fontWeight: 450, fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: SOFT, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <svg width="14" height="7" viewBox="0 0 14 7" fill="none"><line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.8"/><polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.8" fill="none"/></svg>
                  {prev.title}
                </Link>
                <Link href={`/work/render/${next.id}`} style={{ fontWeight: 450, fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: SOFT, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  {next.title}
                  <svg width="14" height="7" viewBox="0 0 14 7" fill="none"><line x1="0" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="0.8"/><polyline points="10,1 13,3.5 10,6" stroke="currentColor" strokeWidth="0.8" fill="none"/></svg>
                </Link>
              </div>
            )
          })()}
        </div>

        {/* Desktop: image on the right */}
        {!isMobile && (
          <div style={{
            position: 'relative',
            background: isSketch ? '#f5f0e8' : BG,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(1.5rem,3vh,2.5rem)',
            minHeight: 'calc(100dvh - 3.2rem)',
          }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image
                src={item.detailImage ?? item.image}
                alt={item.title}
                fill
                style={{ objectFit: 'contain', objectPosition: 'center' }}
                priority
                unoptimized
                sizes="62vw"
              />
            </div>
          </div>
        )}
      </div>

      <Navigator />
    </PageTransition>
  )
}
