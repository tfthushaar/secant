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
  Arched coverflow formation — matches the reference image.
  Cards are arranged on a gentle 3D arc:
    • Centre card closest to viewer (z = 0, scale = 1)
    • Adjacent cards recede in depth, rotate slightly toward centre
    • Edge cards further back, smaller, more transparent
  Drag/scroll shifts which card is centred.
  TiltedCard hover tilt active on every card independently.
*/

const N        = CATEGORY_CONFIG.length   /* 5 */
const CARD_W   = 420                      /* px — bigger landscape card  */
const CARD_H   = 265                      /* px — 16:10 aspect           */
const SPACING  = 460                      /* px — wider gap for bigger cards */

export default function WorkPage() {
  const router       = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef     = useRef<HTMLDivElement>(null)

  /* Continuous centre position — fractional between cards during drag */
  const centreF  = useRef(Math.floor(N / 2))  /* start centred on card 2 */
  const vel      = useRef(0)
  const down     = useRef(false)
  const dragged  = useRef(false)
  const startX   = useRef(0)
  const rafId    = useRef(0)

  const [snapIdx, setSnapIdx] = useState(Math.floor(N / 2))

  /* ── Apply arch transforms directly to DOM (no re-renders) ───────────── */
  const applyArch = useCallback((centre: number) => {
    const track = trackRef.current
    if (!track) return
    const cards = track.querySelectorAll<HTMLElement>('.arch-item')
    cards.forEach((el, i) => {
      const off = i - centre            /* signed offset from centre */
      const abs = Math.abs(off)
      const sig = off >= 0 ? 1 : -1

      const x       =  off * SPACING          /* horizontal spread      */
      const y       =  abs * abs * 8           /* gentle upward arch     */
      const z       = -abs * 130              /* depth recession         */
      const rotY    =  sig * abs * 12         /* rotation toward centre  */
      const scale   =  1 - abs * 0.12         /* centre largest          */
      const opacity =  Math.max(0.28, 1 - abs * 0.22)

      el.style.transform = `translateX(${x}px) translateY(${y}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`
      el.style.opacity   = String(opacity)
      el.style.zIndex    = String(Math.round(10 - abs * 3))
    })
    setSnapIdx(Math.round(centre))
  }, [])

  /* ── RAF loop — momentum + snap ──────────────────────────────────────── */
  useEffect(() => {
    applyArch(centreF.current)

    const step = () => {
      if (!down.current) {
        vel.current *= 0.86
        centreF.current += vel.current

        /* Clamp */
        centreF.current = Math.max(0, Math.min(N - 1, centreF.current))

        /* Snap to nearest card */
        const snap = Math.max(0, Math.min(N - 1, Math.round(centreF.current)))
        centreF.current += (snap - centreF.current) * 0.10
      }

      applyArch(centreF.current)
      rafId.current = requestAnimationFrame(step)
    }
    rafId.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId.current)
  }, [applyArch])

  /* ── Pointer ─────────────────────────────────────────────────────────── */
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
    if (Math.abs(dx) > 5) dragged.current = true
    /* Drag left = increase index (next card), drag right = decrease */
    const delta = -dx / SPACING * 0.55
    centreF.current = Math.max(0, Math.min(N - 1, centreF.current + delta))
    vel.current     = delta
    startX.current  = e.clientX
  }, [])

  const onPointerUp = useCallback(() => { down.current = false }, [])

  /* Scroll wheel */
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    centreF.current = Math.max(0, Math.min(N - 1, centreF.current + e.deltaY * 0.004))
  }, [])

  /* ── Click → navigate (only on centred card) ─────────────────────────── */
  const handleClick = useCallback((idx: number) => {
    if (dragged.current) return
    if (idx !== snapIdx) {
      /* Jump to this card first */
      centreF.current = idx; vel.current = 0
      return
    }
    const cat = CATEGORY_CONFIG[idx]
    if (!cat) return
    gsap.to(containerRef.current, {
      opacity: 0, y: -16, duration: 0.4, ease: 'power2.in',
      onComplete: () => router.push(`/work/${cat.slug}`),
    })
  }, [snapIdx, router])

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
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 400, fontSize: '0.68rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
          textDecoration: 'none',
        }}>SECANT</Link>
        <span style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 300, fontSize: '0.5rem', letterSpacing: '0.42em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
        }}>Drag or scroll to browse</span>
      </header>

      {/* Title */}
      <div style={{
        paddingTop: 'clamp(2rem,5vh,4rem)', paddingBottom: '0.5rem',
        textAlign: 'center', flexShrink: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontWeight: 400, fontSize: 'clamp(1.2rem,2.5vw,2.2rem)',
          letterSpacing: '0.02em', color: 'rgba(255,255,255,0.88)', margin: 0,
        }}>
          Select a category
        </p>
      </div>

      {/*
        ── Arched coverflow gallery ──────────────────────────────────────────
        perspective + preserve-3d: the arch curves cards into the screen.
        Each .arch-item receives transform from applyArch() each RAF tick.
        TiltedCard hover tilt operates in each card's local coordinate space.
      */}
      <div
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          perspective: '1100px',
          perspectiveOrigin: '50% 52%',
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
        {/* Track — all cards are absolute children centred at 0,0 */}
        <div
          ref={trackRef}
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            width: 0, height: 0,
          }}
        >
          {CATEGORY_CONFIG.map((cat, i) => {
            const count = getItemsByCategory(cat.slug).length
            const isActive = i === snapIdx

            return (
              /*
                Outer wrapper: arch-item CSS transform applied here.
                Inner structure: TiltedCard (image only) + label below.
                Label sits OUTSIDE the card so nothing overlaps the image.
              */
              <div
                key={cat.slug}
                className="arch-item"
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  translate: '-50% -50%',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
                  transition: 'none',
                  pointerEvents: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                }}
                onClick={() => handleClick(i)}
              >
                {/* Card image — NO text overlay on top of the image */}
                <TiltedCard
                  imageSrc={cat.heroImage}
                  altText={cat.label}
                  captionText={`${count} works`}
                  containerWidth={`${CARD_W}px`}
                  containerHeight={`${CARD_H}px`}
                  imageWidth={`${CARD_W}px`}
                  imageHeight={`${CARD_H}px`}
                  rotateAmplitude={isActive ? 9 : 2}
                  scaleOnHover={isActive ? 1.06 : 1.02}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={false}
                />

                {/* Label BELOW the card — pure white, no gray */}
                <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                  <p style={{
                    fontFamily: 'var(--font-display), Georgia, serif',
                    fontWeight: 400,
                    fontSize: `${Math.round(18 * (1 - Math.abs(i - snapIdx) * 0.12))}px`,
                    lineHeight: 1.1,
                    color: '#ffffff',   /* pure white — no rgba gray */
                    margin: 0,
                    letterSpacing: '0.01em',
                  }}>
                    {cat.label}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-sans), sans-serif',
                    fontWeight: 300,
                    fontSize: '9px',
                    letterSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: '#ffffff',   /* pure white */
                    opacity: 0.55,
                    margin: '5px 0 0',
                  }}>
                    {count} works
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Navigator />
    </div>
  )
}
