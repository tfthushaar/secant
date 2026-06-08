'use client'

import { useEffect } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { workItems, CATEGORY_CONFIG } from '@/lib/projects'
import { Navigator } from '@/components/Navigator'
import { PageTransition } from '@/components/PageTransition'
import { useNavigate } from '@/components/TransitionBlink'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props { slug: string }

/* Titles with no spaces (e.g. "InteriorI") are placeholder-only — no sidebar */
function isPlaceholder(title: string) { return !title.includes(' ') }

/* Small arrow SVG */
function ArrowSvg({ dir }: { dir: 'left' | 'right' }) {
  return dir === 'left'
    ? <svg width="14" height="7" viewBox="0 0 14 7" fill="none"><line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.9"/><polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.9" fill="none"/></svg>
    : <svg width="14" height="7" viewBox="0 0 14 7" fill="none"><line x1="0" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="0.9"/><polyline points="10,1 13,3.5 10,6" stroke="currentColor" strokeWidth="0.9" fill="none"/></svg>
}

export function RenderDetailClient({ slug }: Props) {
  const { navigate, navigateFade } = useNavigate()
  const isMobile = useIsMobile()
  const idx      = workItems.findIndex((w) => w.id === slug)
  if (idx === -1) notFound()

  const item      = workItems[idx]
  const isSketch  = item.kind === 'sketch'
  const catConfig = CATEGORY_CONFIG.find(c => c.value === item.category)
  const fullscreen = isPlaceholder(item.title)

  /* Prev / next within same category */
  const catItems = workItems.filter(w => w.category === item.category)
  const ci   = catItems.findIndex(w => w.id === slug)
  const prev = catItems[(ci - 1 + catItems.length) % catItems.length]
  const next = catItems[(ci + 1) % catItems.length]

  /* Keyboard arrow navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  navigateFade(`/work/render/${prev.id}`)
      if (e.key === 'ArrowRight') navigateFade(`/work/render/${next.id}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev.id, next.id, navigate])

  const BG   = 'oklch(97.2% 0.006 78)'
  const INK  = 'oklch(8.5% 0.007 72)'
  const SOFT = 'oklch(46% 0.007 74)'
  const FAINT = 'oklch(62% 0.006 74)'
  const LINE = 'oklch(88% 0.006 76)'

  /* ── Fullscreen layout (placeholder titles) ──────────────────── */
  if (fullscreen) {
    return (
      <PageTransition style={{ width: '100vw', height: '100dvh', background: isSketch ? '#f5f0e8' : BG, position: 'relative', overflow: 'hidden' }}>
        {/* Image starts below the fixed header — never bleeds into it */}
        <div style={{ position: 'absolute', top: '3.2rem', left: 0, right: 0, bottom: 0 }}>
          <Image
            src={item.detailImage ?? item.image}
            alt={item.title}
            fill
            style={{ objectFit: 'contain' }}
            priority unoptimized sizes="100vw" quality={100}
          />
        </div>

        {/* Top-left back arrow */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: '3.2rem',
          display: 'flex', alignItems: 'center',
          padding: '0 clamp(7rem,10vw,9rem) 0 clamp(1.2rem,4vw,2.5rem)',
        }}>
          <a
            href={catConfig ? `/work/${catConfig.slug}` : '/work'}
            onClick={e => { e.preventDefault(); navigate(catConfig ? `/work/${catConfig.slug}` : '/work') }}
            style={{ fontWeight: 450, fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: SOFT, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}
          >
            <ArrowSvg dir="left" /> {catConfig?.label ?? 'Work'}
          </a>
        </header>

        {/* Flanking prev / next arrows */}
        {(['left', 'right'] as const).map(dir => (
          <button
            key={dir}
            aria-label={dir === 'left' ? `Previous: ${prev.title}` : `Next: ${next.title}`}
            onClick={() => navigateFade(`/work/render/${dir === 'left' ? prev.id : next.id}`)}
            style={{
              position: 'fixed',
              [dir]: 'clamp(0.8rem, 2vw, 1.8rem)',
              top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(250,248,245,0.7)',
              backdropFilter: 'blur(6px)',
              border: `1px solid ${LINE}`,
              width: '2.6rem', height: '2.6rem', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 100, color: INK,
            }}
          >
            <ArrowSvg dir={dir} />
          </button>
        ))}

        {/* Bottom index */}
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.35em', color: FAINT, zIndex: 100 }}>
          {String(ci + 1).padStart(2, '0')} / {String(catItems.length).padStart(2, '0')}
        </div>

        <Navigator />
      </PageTransition>
    )
  }

  /* ── Standard layout (named projects) ────────────────────────── */
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
        <a
          href={catConfig ? `/work/${catConfig.slug}` : '/work'}
          onClick={e => { e.preventDefault(); navigate(catConfig ? `/work/${catConfig.slug}` : '/work') }}
          style={{ fontWeight: 450, fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: SOFT, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}
        >
          <ArrowSvg dir="left" /> {catConfig?.label ?? 'Work'}
        </a>
      </header>

      {/* Main layout */}
      <div style={{
        paddingTop: '3.2rem', minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '38fr 62fr',
      }}>

        {isMobile && (
          <div style={{ position: 'relative', background: isSketch ? '#f5f0e8' : BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', minHeight: '60vw' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '55vw' }}>
              <Image src={item.detailImage ?? item.image} alt={item.title} fill style={{ objectFit: 'contain', objectPosition: 'center' }} priority unoptimized sizes="100vw" />
            </div>
          </div>
        )}

        {/* Details sidebar */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: isMobile ? '1.5rem 1.5rem 2rem' : 'clamp(2.5rem,5vh,4.5rem) clamp(1.5rem,4vw,3.5rem)',
          borderRight: isMobile ? 'none' : `1px solid ${LINE}`,
          borderBottom: isMobile ? `1px solid ${LINE}` : 'none',
          minHeight: isMobile ? 'auto' : 'calc(100dvh - 3.2rem)',
        }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: isMobile ? '1rem' : '2.5rem' }}>
              {[item.category, isSketch ? 'Sketch' : 'Render'].map(label => (
                <span key={label} style={{ fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: FAINT, border: `1px solid ${LINE}`, padding: '0.28rem 0.7rem' }}>{label}</span>
              ))}
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 400,
              fontSize: isMobile ? 'clamp(1.8rem, 7vw, 2.8rem)' : 'clamp(2.4rem, 4.5vw, 5rem)',
              lineHeight: 1.0, letterSpacing: '-0.005em', color: INK, margin: 0,
            }}>{item.title}</h1>

            <div style={{ fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.35em', color: FAINT, marginTop: '1rem' }}>
              {String(idx + 1).padStart(2, '0')} / {String(workItems.length).padStart(2, '0')}
            </div>
          </div>

          {/* Prev / Next */}
          <div style={{ paddingTop: isMobile ? '1.2rem' : '2rem', borderTop: `1px solid ${LINE}`, display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: isMobile ? '1.5rem' : 0 }}>
            <a href={`/work/render/${prev.id}`} onClick={e => { e.preventDefault(); navigateFade(`/work/render/${prev.id}`) }}
              style={{ fontWeight: 450, fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: SOFT, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}>
              <ArrowSvg dir="left" /> {prev.title}
            </a>
            <a href={`/work/render/${next.id}`} onClick={e => { e.preventDefault(); navigateFade(`/work/render/${next.id}`) }}
              style={{ fontWeight: 450, fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: SOFT, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}>
              {next.title} <ArrowSvg dir="right" />
            </a>
          </div>
        </div>

        {/* Desktop image — overflow:hidden prevents bleed into fixed header */}
        {!isMobile && (
          <div style={{ position: 'relative', background: isSketch ? '#f5f0e8' : BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(1.5rem,3vh,2.5rem)', height: 'calc(100dvh - 3.2rem)', overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image src={item.detailImage ?? item.image} alt={item.title} fill style={{ objectFit: 'contain', objectPosition: 'center' }} priority unoptimized sizes="100vw" quality={100} />
            </div>
            {/* Flanking arrow buttons over the image */}
            {(['left', 'right'] as const).map(dir => (
              <button
                key={dir}
                aria-label={dir === 'left' ? `Previous: ${prev.title}` : `Next: ${next.title}`}
                onClick={() => navigateFade(`/work/render/${dir === 'left' ? prev.id : next.id}`)}
                style={{
                  position: 'absolute',
                  [dir]: '1rem',
                  top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(250,248,245,0.7)',
                  backdropFilter: 'blur(6px)',
                  border: `1px solid ${LINE}`,
                  width: '2.6rem', height: '2.6rem', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 10, color: INK,
                }}
              >
                <ArrowSvg dir={dir} />
              </button>
            ))}
          </div>
        )}
      </div>

      <Navigator />
    </PageTransition>
  )
}
