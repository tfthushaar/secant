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

const N = CATEGORY_CONFIG.length

/* Card dimensions per breakpoint */
const DIMS_DESKTOP = { w: 500, h: 316, s: 520 }
const DIMS_MOBILE  = { w: 240, h: 152, s: 248 }

export default function WorkPage() {
  const router       = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef     = useRef<HTMLDivElement>(null)

  /* dimsRef — read live in RAF/pointer callbacks without closure staleness */
  const dimsRef = useRef(DIMS_DESKTOP)
  /* isMobile state drives TiltedCard re-renders */
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const update = () => {
      const m = window.innerWidth <= 768
      setIsMobile(m)
      dimsRef.current = m ? DIMS_MOBILE : DIMS_DESKTOP
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  const centreF  = useRef(Math.floor(N / 2))
  const vel      = useRef(0)
  const down     = useRef(false)
  const dragged  = useRef(false)
  const startX   = useRef(0)
  const rafId    = useRef(0)
  const [snapIdx, setSnapIdx] = useState(Math.floor(N / 2))

  /* applyArch reads spacing live from dimsRef — no stale closure */
  const applyArch = useCallback((centre: number) => {
    const { s: S } = dimsRef.current
    const track = trackRef.current
    if (!track) return
    const cards = track.querySelectorAll<HTMLElement>('.arch-item')
    cards.forEach((el, i) => {
      const off     = i - centre
      const abs     = Math.abs(off)
      const sig     = off >= 0 ? 1 : -1
      const x       = off * S
      const y       = abs * abs * 8
      const z       = -abs * 130
      const rotY    = sig * abs * 12
      const scale   = 1 - abs * 0.12
      const opacity = Math.max(0.28, 1 - abs * 0.22)
      el.style.transform = `translateX(${x}px) translateY(${y}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`
      el.style.opacity   = String(opacity)
      el.style.zIndex    = String(Math.round(10 - abs * 3))
    })
    setSnapIdx(Math.round(centre))
  }, [])

  /* RAF — smoother momentum (0.93 decay) and gentler snap (0.06 spring) */
  useEffect(() => {
    applyArch(centreF.current)
    const step = () => {
      if (!down.current) {
        vel.current     *= 0.93
        centreF.current += vel.current
        centreF.current  = Math.max(0, Math.min(N - 1, centreF.current))
        const snap = Math.round(Math.max(0, Math.min(N - 1, centreF.current)))
        centreF.current += (snap - centreF.current) * 0.06
      }
      applyArch(centreF.current)
      rafId.current = requestAnimationFrame(step)
    }
    rafId.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId.current)
  }, [applyArch])

  /* ── Pointer events ────────────────────────────────────────────────────
     Key fixes:
     1. setPointerCapture on currentTarget (the container), not e.target
        (the child element under the pointer) — this is what broke mobile.
     2. e.preventDefault() in down + move — stops browser scroll takeover
        on touch devices.
     3. touch-action:none on the container (see JSX) — suppresses the
        browser's default pan/zoom gesture before pointer events even fire.
     4. Sensitivity scales with breakpoint — mobile swipes cover more.
  ──────────────────────────────────────────────────────────────────────── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    /* No preventDefault here — it would suppress the click event on iOS/Safari.
       touch-action:none on the container is sufficient to stop scroll stealing. */
    down.current    = true
    dragged.current = false
    startX.current  = e.clientX
    vel.current     = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!down.current) return
    const dx = e.clientX - startX.current
    /* 8px threshold — touch has natural jitter, 3px was causing false drags
       that blocked clicks even when the user just tapped */
    if (Math.abs(dx) > 8) dragged.current = true
    const { s: S } = dimsRef.current
    /* Mobile needs higher sensitivity — smaller swipe distance available */
    const sensitivity = dimsRef.current === DIMS_MOBILE ? 1.4 : 0.58
    const delta = -dx / S * sensitivity
    centreF.current = Math.max(0, Math.min(N - 1, centreF.current + delta))
    vel.current     = delta * 0.7   /* carry partial velocity into momentum */
    startX.current  = e.clientX
  }, [])

  const onPointerUp = useCallback(() => {
    down.current = false
  }, [])

  /* Wheel (desktop trackpad/mouse) */
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * (e.deltaMode === 1 ? 0.08 : 0.004)
    centreF.current = Math.max(0, Math.min(N - 1, centreF.current + delta))
  }, [])

  /* Click → navigate (only on the centred card, not during drag) */
  const handleClick = useCallback((idx: number) => {
    if (dragged.current) return
    if (idx !== snapIdx) {
      centreF.current = idx
      vel.current = 0
      return
    }
    const cat = CATEGORY_CONFIG[idx]
    if (!cat) return
    gsap.to(containerRef.current, {
      opacity: 0, y: -16, duration: 0.4, ease: 'power2.in',
      onComplete: () => router.push(`/work/${cat.slug}`),
    })
  }, [snapIdx, router])

  const { w: CARD_W, h: CARD_H } = isMobile ? DIMS_MOBILE : DIMS_DESKTOP

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw', minHeight: '100dvh',
        background: '#ffffff',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header style={{
        flexShrink: 0, height: '3.6rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.2rem,4vw,2.5rem)',
        borderBottom: '1px solid oklch(90% 0.006 76)',
        background: '#ffffff',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 400, fontSize: '0.68rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'oklch(38% 0.007 72)',
          textDecoration: 'none',
        }}>SECANT</Link>
        <span style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 300, fontSize: '0.5rem', letterSpacing: '0.42em',
          textTransform: 'uppercase', color: 'oklch(68% 0.006 74)',
        }}>{isMobile ? 'Swipe to browse' : 'Drag or scroll to browse'}</span>
      </header>

      {/* Title */}
      <div style={{
        paddingTop: 'clamp(1.5rem,4vh,3.5rem)', paddingBottom: '0.5rem',
        textAlign: 'center', flexShrink: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontWeight: 400, fontSize: 'clamp(1.1rem,2.5vw,2.2rem)',
          letterSpacing: '0.02em', color: 'oklch(12% 0.007 72)', margin: 0,
        }}>
          Select a category
        </p>
      </div>

      {/* Coverflow — touch-action:none prevents browser scroll stealing */}
      <div
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          perspective: isMobile ? '700px' : '1100px',
          perspectiveOrigin: '50% 52%',
          overflow: 'hidden',
          userSelect: 'none',
          touchAction: 'none',   /* critical: suppress native pan before pointer fires */
          cursor: 'grab',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          ref={trackRef}
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            width: 0, height: 0,
          }}
        >
          {CATEGORY_CONFIG.map((cat, i) => {
            const count    = getItemsByCategory(cat.slug).length
            const isActive = i === snapIdx
            return (
              <div
                key={cat.slug}
                className="arch-item"
                style={{
                  position: 'absolute', top: 0, left: 0,
                  translate: '-50% -50%',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
                  transition: 'none',
                  pointerEvents: 'auto',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: isMobile ? '8px' : '14px',
                }}
                onClick={() => handleClick(i)}
              >
                <TiltedCard
                  imageSrc={cat.heroImage}
                  altText={cat.label}
                  captionText={`${count} works`}
                  containerWidth={`${CARD_W}px`}
                  containerHeight={`${CARD_H}px`}
                  imageWidth={`${CARD_W}px`}
                  imageHeight={`${CARD_H}px`}
                  rotateAmplitude={isActive ? (isMobile ? 6 : 9) : 2}
                  scaleOnHover={isActive ? 1.04 : 1.02}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent={false}
                />

                <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                  <p style={{
                    fontFamily: 'var(--font-display), Georgia, serif',
                    fontWeight: 400,
                    fontSize: `${Math.round((isMobile ? 14 : 18) * (1 - Math.abs(i - snapIdx) * 0.12))}px`,
                    lineHeight: 1.1,
                    color: 'oklch(10% 0.007 72)',
                    margin: 0, letterSpacing: '0.01em',
                  }}>
                    {cat.label}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-sans), sans-serif',
                    fontWeight: 300, fontSize: isMobile ? '8px' : '9px',
                    letterSpacing: '0.35em', textTransform: 'uppercase',
                    color: 'oklch(48% 0.007 74)', opacity: 0.55, margin: '4px 0 0',
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
