'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const BG = 'oklch(97.2% 0.006 78)'

export function Hero() {
  const wordmarkRef = useRef<HTMLHeadingElement>(null)
  const subRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wm  = wordmarkRef.current
    const sub = subRef.current
    if (!wm || !sub) return

    gsap.set([wm, sub], { autoAlpha: 0 })

    const tl = gsap.timeline({ delay: 0.12 })
    tl
      .to(wm,  { autoAlpha: 1, duration: 1.0, ease: 'power3.out' }, 0)
      .to(sub, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, 0.4)

    return () => { tl.kill() }
  }, [])

  return (
    <section
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: BG,
        overflow: 'hidden',
      }}
    >
      {/* ── Video — fixed at 62dvh, FULL content visible (contain) ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: '0 0 62dvh',
          background: BG,
          overflow: 'hidden',
        }}
      >
        <video
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center center',
            display: 'block',
          }}
          autoPlay muted loop playsInline preload="auto"
          aria-hidden="true"
        >
          <source src="/assets/video/hero.mp4" type="video/mp4" />
        </video>

        {/* Section counter */}
        <div style={{
          position: 'absolute', top: '4.6rem', right: '2rem',
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.52rem',
          letterSpacing: '0.42em', textTransform: 'uppercase',
          color: 'oklch(60% 0.006 74)',
          pointerEvents: 'none',
        }}>
          01 / Home
        </div>

        {/* ⊕ crosshair at video bottom centre */}
        <div style={{
          position: 'absolute', bottom: '1rem', left: '50%',
          transform: 'translateX(-50%)',
          color: 'oklch(58% 0.006 74)',
          pointerEvents: 'none',
        }} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="10" y1="0"  x2="10" y2="6"  stroke="currentColor" strokeWidth="0.7"/>
            <line x1="10" y1="14" x2="10" y2="20" stroke="currentColor" strokeWidth="0.7"/>
            <line x1="0"  y1="10" x2="6"  y2="10" stroke="currentColor" strokeWidth="0.7"/>
            <line x1="14" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="0.7"/>
            <rect x="7.5" y="7.5" width="5" height="5"
              stroke="currentColor" strokeWidth="0.7" fill="none"/>
          </svg>
        </div>

        {/* Smooth gradient fade into SECANT strip — no hard line */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '4.5rem',
          background: `linear-gradient(to bottom, transparent 0%, ${BG} 100%)`,
          pointerEvents: 'none',
        }} aria-hidden="true" />
      </div>

      {/* ── SECANT strip — remaining 38dvh, same background ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 clamp(1.5rem, 4vw, 3rem)',
        background: BG,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
          <h1
            ref={wordmarkRef}
            style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontWeight: 500,
              fontSize: 'clamp(3.8rem, 10.5vw, 10.5rem)',
              lineHeight: 0.92,
              letterSpacing: '0.01em',
              color: 'oklch(8.5% 0.007 72)',
              opacity: 0,
              userSelect: 'none',
            }}
          >
            SECANT
          </h1>
          <div
            ref={subRef}
            style={{
              fontFamily: 'var(--font-jost), sans-serif',
              fontWeight: 300,
              fontSize: '0.55rem',
              letterSpacing: '0.44em',
              textTransform: 'uppercase',
              color: 'oklch(52% 0.007 74)',
              opacity: 0,
            }}
          >
            Architecture · Studio
          </div>
        </div>
      </div>
    </section>
  )
}
