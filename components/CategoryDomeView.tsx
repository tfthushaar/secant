'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { gsap } from 'gsap'
import { Navigator } from '@/components/Navigator'
import { useNavigate } from '@/components/TransitionBlink'
import type { CategoryConfig, WorkItem } from '@/lib/projects'

const Masonry = dynamic(() => import('@/components/Masonry'), { ssr: false, loading: () => null })

interface Props {
  config: CategoryConfig
  items:  WorkItem[]
}

export function CategoryDomeView({ config, items }: Props) {
  const { navigate } = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' })
  }, [])

  /* thumbnailImg loads fast for layout; img (original) swaps in progressively */
  const masonryItems = items.map(item => ({
    id:           item.id,
    img:          item.detailImage ?? item.image,
    thumbnailImg: item.image,
    link:         `/work/render/${item.id}`,
    title:        item.title,
  }))

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw', height: '100dvh',
        background: '#ffffff',
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
        borderBottom: '1px solid oklch(90% 0.006 76)',
        position: 'relative', zIndex: 10,
      }}>
        <a
          href="/work"
          onClick={e => { e.preventDefault(); navigate('/work') }}
          style={{
            fontFamily: 'var(--font-sans), sans-serif',
            fontWeight: 400, fontSize: '0.62rem', letterSpacing: '0.28em',
            textTransform: 'uppercase', color: 'oklch(40% 0.007 72)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem',
            transition: 'color 0.2s', cursor: 'pointer',
          }}
        >
          <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
            <line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.9"/>
            <polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.9" fill="none"/>
          </svg>
          Work
        </a>

        <span style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontWeight: 400, fontSize: 'clamp(1.1rem, 2.2vw, 1.7rem)',
          letterSpacing: '0.03em', color: 'oklch(10% 0.007 72)',
        }}>
          {config.label}
        </span>

        {/* right side intentionally empty — Navigator MENU button is here */}
        <span />
      </header>

      {/* Masonry gallery — fills remaining viewport */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <Masonry
          items={masonryItems}
          blurToFocus={true}
          scaleOnHover={true}
          hoverScale={0.97}
          stagger={0.055}
        />
      </div>

      <Navigator />
    </div>
  )
}
