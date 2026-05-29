'use client'

import { useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Navigator } from '@/components/Navigator'
import { CATEGORY_CONFIG, getItemsByCategory } from '@/lib/projects'

/* TiltedCard — motion/react, client-only */
const TiltedCard = dynamic(
  () => import('@/components/TiltedCard'),
  { ssr: false, loading: () => null }
)

export default function WorkPage() {
  const router       = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCategoryClick = useCallback((slug: string) => {
    gsap.to(containerRef.current, {
      opacity: 0, y: -16,
      duration: 0.4, ease: 'power2.in',
      onComplete: () => router.push(`/work/${slug}`),
    })
  }, [router])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw', minHeight: '100dvh',
        background: 'oklch(6.5% 0.007 72)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header style={{
        flexShrink: 0, height: '3.6rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.2rem,4vw,2.5rem)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'oklch(6.5% 0.007 72)',
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
        }}>Selected Work</span>
      </header>

      {/* Page title */}
      <div style={{ padding: 'clamp(3rem,6vh,5rem) clamp(1.5rem,4vw,3rem) 2rem', textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontWeight: 400, fontSize: 'clamp(1.4rem,3vw,2.6rem)',
          letterSpacing: '0.02em', color: 'rgba(255,255,255,0.82)',
          margin: 0,
        }}>
          Choose a category
        </p>
        <p style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.4em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.24)',
          marginTop: '0.6rem',
        }}>
          Hover to explore · Click to enter
        </p>
      </div>

      {/* 5 TiltedCards — centered flex row, wraps on narrow screens */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'clamp(16px, 2.5vw, 32px)',
        padding: '0 clamp(1.5rem,4vw,4rem) clamp(3rem,6vh,5rem)',
      }}>
        {CATEGORY_CONFIG.map((cat) => {
          const count = getItemsByCategory(cat.slug).length
          return (
            <div
              key={cat.slug}
              onClick={() => handleCategoryClick(cat.slug)}
              style={{ cursor: 'pointer', flexShrink: 0 }}
            >
              <TiltedCard
                imageSrc={cat.heroImage}
                altText={cat.label}
                captionText={`${count} works`}
                containerWidth="clamp(180px, 18vw, 260px)"
                containerHeight="clamp(240px, 24vw, 340px)"
                imageWidth="clamp(180px, 18vw, 260px)"
                imageHeight="clamp(240px, 24vw, 340px)"
                rotateAmplitude={10}
                scaleOnHover={1.07}
                showMobileWarning={false}
                showTooltip={true}
                displayOverlayContent={true}
                overlayContent={
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    padding: 'clamp(14px,2vw,20px)',
                    background: 'linear-gradient(to top, rgba(8,7,6,0.82) 0%, transparent 100%)',
                    borderRadius: '0 0 12px 12px',
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-cormorant), Georgia, serif',
                      fontWeight: 400,
                      fontSize: 'clamp(1.2rem, 2.2vw, 1.7rem)',
                      lineHeight: 1.1,
                      color: 'rgba(255,255,255,0.95)',
                      margin: 0,
                      letterSpacing: '0.01em',
                    }}>
                      {cat.label}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-jost), sans-serif',
                      fontWeight: 300,
                      fontSize: '0.5rem',
                      letterSpacing: '0.32em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.45)',
                      margin: '5px 0 0',
                    }}>
                      {count} works
                    </p>
                  </div>
                }
              />
            </div>
          )
        })}
      </div>

      <Navigator />
    </div>
  )
}
