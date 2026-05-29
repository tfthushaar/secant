'use client'

import { useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Navigator } from '@/components/Navigator'
import { CATEGORY_CONFIG, getItemsByCategory } from '@/lib/projects'

/* TiltedCard needs motion/react — client-only */
const TiltedCard = dynamic(
  () => import('@/components/TiltedCard'),
  { ssr: false, loading: () => null }
)

/*
  Merged CircularGallery + TiltedCards:
  ──────────────────────────────────────
  The five category cards are arranged on a CSS 3D arc (rotateY + translateZ).
  This reproduces the curved "circular stack" visual of CircularGallery while
  keeping TiltedCard's spring-physics 3D tilt on hover.
  Each card rotates away from center on the Y axis with a shared vanishing point.
  Clicking any card navigates to that category's page.
*/

const ARC_ANGLES  = [-34, -17, 0, 17, 34]   /* degrees Y-rotation for each card */
const ARC_RADIUS  = 480                       /* px — radius of the arc circle     */

export default function WorkPage() {
  const router       = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCategoryClick = useCallback((slug: string) => {
    gsap.to(containerRef.current, {
      opacity: 0, y: -14,
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
        position: 'sticky', top: 0, zIndex: 20,
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
      <div style={{ paddingTop: 'clamp(3rem,6vh,5rem)', paddingBottom: '1rem', textAlign: 'center', flexShrink: 0 }}>
        <p style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontWeight: 400, fontSize: 'clamp(1.4rem,3vw,2.6rem)',
          letterSpacing: '0.02em', color: 'rgba(255,255,255,0.82)', margin: 0,
        }}>Choose a category</p>
        <p style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.4em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.24)',
          marginTop: '0.6rem',
        }}>Hover to explore · Click to enter</p>
      </div>

      {/*
        ── Merged arc: CSS 3D circular arrangement + TiltedCard hover effect ──
        perspective-origin is set slightly above centre so front card reads large.
        Each card sits at rotateY(angle) translateZ(radius) — standard CSS carousel.
        The TiltedCard handles mouse-tracking tilt within its own local 3D space.
      */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1400px',
        perspectiveOrigin: '50% 38%',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          width: '300px',   /* the rotation origin — cards arc around this point */
          height: '380px',
        }}>
          {CATEGORY_CONFIG.map((cat, i) => {
            const angle    = ARC_ANGLES[i]
            const count    = getItemsByCategory(cat.slug).length
            /* Cards further from centre are slightly smaller */
            const proximity = 1 - Math.abs(i - 2) * 0.08

            return (
              <div
                key={cat.slug}
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  /* rotateY places the card on the arc, translateZ moves it forward */
                  transform: `translate(-50%,-50%) rotateY(${angle}deg) translateZ(${ARC_RADIUS}px)`,
                  transformOrigin: `50% 50% -${ARC_RADIUS}px`,
                  cursor: 'pointer',
                  /* depth fade: side cards softer */
                  opacity: proximity,
                  zIndex: 5 - Math.abs(i - 2),
                  transition: 'opacity 0.3s ease',
                }}
                onClick={() => handleCategoryClick(cat.slug)}
              >
                <TiltedCard
                  imageSrc={cat.heroImage}
                  altText={cat.label}
                  captionText={`${count} works`}
                  containerWidth={`${Math.round(240 * proximity)}px`}
                  containerHeight={`${Math.round(320 * proximity)}px`}
                  imageWidth={`${Math.round(240 * proximity)}px`}
                  imageHeight={`${Math.round(320 * proximity)}px`}
                  rotateAmplitude={9}
                  scaleOnHover={1.06}
                  showMobileWarning={false}
                  showTooltip={true}
                  displayOverlayContent={true}
                  overlayContent={
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '16px',
                      background: 'linear-gradient(to top, rgba(8,7,6,0.85) 0%, transparent 100%)',
                      borderRadius: '0 0 12px 12px',
                    }}>
                      <p style={{
                        fontFamily: 'var(--font-cormorant), Georgia, serif',
                        fontWeight: 400,
                        fontSize: `${Math.round(20 * proximity)}px`,
                        lineHeight: 1.1,
                        color: 'rgba(255,255,255,0.95)',
                        margin: 0,
                      }}>
                        {cat.label}
                      </p>
                      <p style={{
                        fontFamily: 'var(--font-jost), sans-serif',
                        fontWeight: 300,
                        fontSize: '9px',
                        letterSpacing: '0.32em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.45)',
                        margin: '4px 0 0',
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
      </div>

      <Navigator />
    </div>
  )
}
