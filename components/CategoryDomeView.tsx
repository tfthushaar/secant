'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Navigator } from '@/components/Navigator'
import type { CategoryConfig, WorkItem } from '@/lib/projects'

const DomeGallery = dynamic(
  () => import('@/components/DomeGallery'),
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

  /* DomeGallery images — each item includes its id for navigation */
  const domeImages = items.map(item => ({
    src: item.image,
    alt: item.title,
    id:  item.id,
  }))

  const handleImageClick = useCallback(({ id }: { id: string; src: string }) => {
    if (!id) return
    gsap.to(containerRef.current, {
      opacity: 0, y: -16,
      duration: 0.38, ease: 'power2.in',
      onComplete: () => router.push(`/work/render/${id}`),
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
        <Link href="/work" style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.6rem', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem',
        }}>
          <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
            <line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
            <polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          </svg>
          Work
        </Link>

        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontWeight: 400, fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            letterSpacing: '0.04em', color: 'rgba(255,255,255,0.82)',
          }}>
            {config.label}
          </span>
        </div>

        <span style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.52rem', letterSpacing: '0.38em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)',
        }}>
          {items.length} items
        </span>
      </header>

      {/* DomeGallery */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <DomeGallery
          images={domeImages}
          onImageClick={handleImageClick}
          fit={1.05}
          minRadius={620}
          segments={14}
          grayscale={false}
          overlayBlurColor="oklch(6.5% 0.007 72)"
          imageBorderRadius="8px"
          openedImageBorderRadius="8px"
          dragSensitivity={18}
          dragDampening={1.5}
        />
      </div>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: '1rem', left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-jost), sans-serif',
        fontWeight: 300, fontSize: '0.52rem', letterSpacing: '0.38em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.16)',
        pointerEvents: 'none', zIndex: 5, whiteSpace: 'nowrap',
      }}>
        Drag to explore · Click to open
      </div>

      <Navigator />
    </div>
  )
}
