'use client'

import { useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Navigator } from '@/components/Navigator'
import { CATEGORY_CONFIG } from '@/lib/projects'

/* ogl is ESM + browser-only — must be dynamically imported */
const CircularGallery = dynamic(
  () => import('@/components/CircularGallery'),
  { ssr: false, loading: () => null }
)

/* CircularGallery items — one card per category */
const GALLERY_ITEMS = CATEGORY_CONFIG.map(cat => ({
  image: cat.heroImage,
  text:  cat.label,
}))

export default function WorkPage() {
  const router       = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCategoryClick = useCallback((index: number) => {
    const category = CATEGORY_CONFIG[index]
    if (!category) return

    /* Elegant fade-out before navigating to the DomeGallery page */
    gsap.to(containerRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => router.push(`/work/${category.slug}`),
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
      }}
    >
      {/* Header */}
      <header style={{
        flexShrink: 0, height: '3.6rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.2rem,4vw,2.5rem)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', zIndex: 10,
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 400, fontSize: '0.68rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)',
          textDecoration: 'none',
        }}>SECANT</Link>
        <span style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.52rem', letterSpacing: '0.42em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)',
        }}>Scroll &amp; tap to explore</span>
      </header>

      {/* Category label above gallery */}
      <div style={{
        flexShrink: 0, paddingTop: '2.5rem', paddingBottom: '1rem',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <p style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontWeight: 400,
          fontSize: 'clamp(1.6rem, 3.5vw, 3.2rem)',
          lineHeight: 1.1,
          letterSpacing: '0.01em',
          color: 'rgba(255,255,255,0.88)',
          margin: 0,
        }}>
          Selected Work
        </p>
        <p style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.56rem', letterSpacing: '0.4em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
          marginTop: '0.6rem',
        }}>
          Scroll to browse · Tap to enter category
        </p>
      </div>

      {/* CircularGallery — fills remaining height */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <CircularGallery
          items={GALLERY_ITEMS}
          onItemClick={handleCategoryClick}
          bend={3}
          textColor="rgba(255,255,255,0.7)"
          borderRadius={0.04}
          scrollSpeed={2}
          scrollEase={0.02}
        />
      </div>

      <Navigator />
    </div>
  )
}
