'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { gsap } from 'gsap'
import { Navigator } from '@/components/Navigator'
import { CATEGORY_CONFIG, getItemsByCategory } from '@/lib/projects'

const TiltedCard = dynamic(() => import('@/components/TiltedCard'), {
  ssr: false, loading: () => null,
})

/*
  Merged CircularStack + TiltedCard:
  ─────────────────────────────────
  • 5 TiltedCards arranged on a CSS 3D cylinder (rotateY + translateZ)
  • Pointer drag / scroll wheel rotates the whole cylinder (CircularGallery UX)
  • TiltedCard spring-physics tilt fires on hover within each card's own space
  • Inertia decay + snap-to-nearest-item on release
*/

const N      = CATEGORY_CONFIG.length   /* 5 */
const STEP   = 360 / N                  /* 72° between items */
const RADIUS = 440                      /* cylinder radius in px */
const DAMPEN = 0.88                     /* inertia friction */

export default function WorkPage() {
  const router       = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const cylinderRef  = useRef<HTMLDivElement>(null)

  /* Rotation state — kept in refs to avoid re-renders in the RAF loop */
  const rotY    = useRef(0)
  const targetY = useRef(0)
  const vel     = useRef(0)
  const down    = useRef(false)
  const startX  = useRef(0)
  const rafId   = useRef(0)
  const dragged = useRef(false)   /* distinguishes click vs drag */

  const [activeIdx, setActiveIdx] = useState(0)

  /* ── Animation loop ─────────────────────────────────────────────── */
  useEffect(() => {
    const step = () => {
      if (!down.current) {
        vel.current *= DAMPEN
        if (Math.abs(vel.current) > 0.02) targetY.current += vel.current
      }
      rotY.current += (targetY.current - rotY.current) * 0.1

      if (cylinderRef.current) {
        cylinderRef.current.style.transform = `rotateY(${rotY.current}deg)`
      }

      /* Which item faces front? normalise rotation to find closest index */
      const norm = ((-rotY.current % 360) + 360) % 360
      const idx  = Math.round(norm / STEP) % N
      setActiveIdx(idx)

      rafId.current = requestAnimationFrame(step)
    }
    rafId.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId.current)
  }, [])

  /* ── Pointer handlers ────────────────────────────────────────────── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    down.current    = true
    dragged.current = false
    startX.current  = e.clientX
    vel.current     = 0
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!down.current) return
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > 4) dragged.current = true
    targetY.current += dx * 0.35
    vel.current      = dx * 0.35
    startX.current   = e.clientX
  }, [])

  const onPointerUp = useCallback(() => {
    down.current = false
    /* Snap to nearest item */
    const snap = Math.round(targetY.current / STEP) * STEP
    targetY.current = snap
  }, [])

  /* ── Scroll-wheel rotation ───────────────────────────────────────── */
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    vel.current     += e.deltaY * 0.12
    targetY.current += e.deltaY * 0.12
  }, [])

  /* ── Navigation ─────────────────────────────────────────────────── */
  const handleClick = useCallback((slug: string, idx: number) => {
    if (dragged.current) return        /* was a drag, not a click */
    if (idx !== activeIdx) {           /* snap to this item first */
      targetY.current = -idx * STEP
      return
    }
    gsap.to(containerRef.current, {
      opacity: 0, y: -16, duration: 0.4, ease: 'power2.in',
      onComplete: () => router.push(`/work/${slug}`),
    })
  }, [activeIdx, router])

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
        background: 'oklch(6.5% 0.007 72)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 400, fontSize: '0.68rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)',
          textDecoration: 'none',
        }}>SECANT</Link>
        <span style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.52rem', letterSpacing: '0.42em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)',
        }}>Drag to explore · Click to enter</span>
      </header>

      {/* Title */}
      <div style={{ paddingTop: 'clamp(2rem,5vh,4rem)', paddingBottom: '0.5rem', textAlign: 'center', flexShrink: 0 }}>
        <p style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontWeight: 400, fontSize: 'clamp(1.3rem,2.8vw,2.4rem)',
          letterSpacing: '0.02em', color: 'rgba(255,255,255,0.82)', margin: 0,
          fontFeatureSettings: '"kern" 1, "liga" 1',
        }}>
          Select a category
        </p>
      </div>

      {/*
        ── CSS 3D Cylinder Carousel ──────────────────────────────────
        perspective on the outer div creates depth.
        The inner div (cylinder) holds all 5 TiltedCards at rotateY angles.
        Dragging rotates the cylinder; TiltedCard handles per-card hover tilt.
      */}
      <div
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          perspective: '1300px', perspectiveOrigin: '50% 45%',
          overflow: 'hidden',
          cursor: down.current ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {/* The cylinder — all cards are children, rotateY applied each RAF */}
        <div
          ref={cylinderRef}
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            width: 0, height: 0,
          }}
        >
          {CATEGORY_CONFIG.map((cat, i) => {
            const angle    = i * STEP
            const isActive = i === activeIdx
            const count    = getItemsByCategory(cat.slug).length
            /* Cards further from front are slightly less opaque */
            const opacity  = isActive ? 1 : 0.68

            return (
              <div
                key={cat.slug}
                style={{
                  position: 'absolute',
                  /* Place this card at its angle on the cylinder */
                  transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
                  /* Centre the card on its position */
                  top: 0, left: 0,
                  translate: '-50% -50%',
                  opacity,
                  transition: 'opacity 0.3s ease',
                  /* Allow TiltedCard to receive mouse events */
                  pointerEvents: 'auto',
                }}
                onClick={() => handleClick(cat.slug, i)}
              >
                <TiltedCard
                  imageSrc={cat.heroImage}
                  altText={cat.label}
                  captionText={`${count} works`}
                  containerWidth="clamp(180px,17vw,250px)"
                  containerHeight="clamp(240px,22vw,330px)"
                  imageWidth="clamp(180px,17vw,250px)"
                  imageHeight="clamp(240px,22vw,330px)"
                  /* Tilt intensity: full on active, reduced on side cards */
                  rotateAmplitude={isActive ? 10 : 3}
                  scaleOnHover={isActive ? 1.07 : 1.03}
                  showMobileWarning={false}
                  showTooltip={isActive}
                  displayOverlayContent={true}
                  overlayContent={
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: 'clamp(12px,1.5vw,18px)',
                      background: 'linear-gradient(to top, rgba(8,7,6,0.88) 0%, transparent 100%)',
                      borderRadius: '0 0 12px 12px',
                    }}>
                      <p style={{
                        fontFamily: 'var(--font-cormorant), Georgia, serif',
                        fontWeight: 400,
                        fontSize: 'clamp(1.1rem,1.8vw,1.55rem)',
                        lineHeight: 1.1,
                        color: 'rgba(255,255,255,0.96)',
                        margin: 0,
                        fontFeatureSettings: '"kern" 1',
                      }}>
                        {cat.label}
                      </p>
                      <p style={{
                        fontFamily: 'var(--font-jost), sans-serif',
                        fontWeight: 300, fontSize: '8px',
                        letterSpacing: '0.32em', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.45)', margin: '4px 0 0',
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
