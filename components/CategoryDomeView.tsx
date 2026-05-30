'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Navigator } from '@/components/Navigator'
import type { CategoryConfig, WorkItem } from '@/lib/projects'

/* InfiniteMenu is WebGL + browser-only */
const InfiniteMenu = dynamic(
  () => import('@/components/InfiniteMenu'),
  { ssr: false, loading: () => null }
)

interface Props {
  config: CategoryConfig
  items:  WorkItem[]
}

export function CategoryDomeView({ config, items }: Props) {
  const router       = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  /* Fade in on mount */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' })
  }, [])

  /* Items for InfiniteMenu */
  const menuItems = items.map(item => ({
    image:       item.image,
    link:        `/work/render/${item.id}`,
    title:       item.title,
    description: item.kind === 'sketch'
      ? 'Concept sketch'
      : item.category,
  }))

  /* Navigate to render detail on item click */
  const handleItemClick = useCallback((activeItem: { link?: string }) => {
    if (!activeItem?.link) return
    gsap.to(containerRef.current, {
      opacity: 0, y: -16,
      duration: 0.35, ease: 'power2.in',
      onComplete: () => router.push(activeItem.link!),
    })
  }, [router])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw', height: '100dvh',
        background: 'oklch(6.5% 0.007 72)',
        overflow: 'hidden', position: 'relative',
        display: 'flex', flexDirection: 'column',
        opacity: 0,
      }}
    >
      {/* Top bar */}
      <header style={{
        flexShrink: 0, height: '3.6rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.2rem,4vw,2.5rem)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', zIndex: 10,
      }}>
        {/* Back to work */}
        <Link href="/work" style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 400, fontSize: '0.62rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem',
          transition: 'color 0.2s',
        }}>
          <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
            <line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.9"/>
            <polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.9" fill="none"/>
          </svg>
          Work
        </Link>

        {/* Category name */}
        <span style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontWeight: 400, fontSize: 'clamp(1.1rem, 2.2vw, 1.7rem)',
          letterSpacing: '0.03em', color: 'rgba(255,255,255,0.92)',
        }}>
          {config.label}
        </span>

        {/* Home link */}
        <Link href="/" style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)',
          textDecoration: 'none', transition: 'color 0.2s',
        }}>
          Home
        </Link>
      </header>

      {/* InfiniteMenu with rectangular cards */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <InfiniteMenu
          items={menuItems}
          scale={0.95}   /* camera close to sphere surface — fills viewport */
          onItemClick={handleItemClick}
        />
      </div>

      <Navigator />
    </div>
  )
}
