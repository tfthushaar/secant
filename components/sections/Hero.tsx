'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { HERO_PADDING } from '@/lib/heroConstants'

interface HeroProps { loaderDone?: boolean }

/*
  Hero — 100 vh transparent panel over the fixed 3D model.
  SECANT h1 starts hidden and is revealed by Loader (direct handoff, no double).
  Sub and scatter animate in only after loaderDone.
*/

export function Hero({ loaderDone = false }: HeroProps) {
  const titleRef   = useRef<HTMLDivElement>(null)
  const subRef     = useRef<HTMLDivElement>(null)
  const scatterRef = useRef<HTMLDivElement>(null)

  /* Keep everything hidden — loader hands off SECANT directly */
  useEffect(() => {
    gsap.set([titleRef.current, subRef.current, scatterRef.current], { autoAlpha: 0 })
  }, [])

  /* After loader fully done: reveal sub + scatter (SECANT already shown by loader) */
  useEffect(() => {
    if (!loaderDone) return
    const tl = gsap.timeline()
    tl
      .to(subRef.current,     { autoAlpha: 1, duration: 0.7, ease: 'power3.out' }, 0)
      .to(scatterRef.current, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, 0.2)
    return () => { tl.kill() }
  }, [loaderDone])

  return (
    <section style={{
      position: 'relative', width: '100%', height: '100svh', overflow: 'hidden',
      /* transparent — fixed model shows through */
    }}>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: `${HERO_PADDING.top} ${HERO_PADDING.left} ${HERO_PADDING.bottom}`,
      }}>
        {/* SECANT wordmark */}
        <div>
          <div ref={titleRef} data-hero-title style={{ opacity: 0 }}>
            <h1 id="hero-secant" style={{
              fontFamily:    'var(--font-sans), "Helvetica Neue", Arial, sans-serif',
              fontWeight:    300,
              fontSize:      'clamp(5rem, 14vw, 16rem)',
              lineHeight:    0.88, letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color:         'oklch(8.5% 0.007 72)',
              margin: 0, userSelect: 'none',
              textShadow:    '0 2px 16px rgba(255,255,255,0.92), 0 0 40px rgba(255,255,255,0.7)',
            }}>
              SECANT
            </h1>
          </div>

          <div ref={subRef} style={{
            opacity: 0, marginTop: 'clamp(0.5rem, 1.5vh, 1.2rem)',
            display: 'flex', alignItems: 'center', flexWrap: 'wrap',
            gap: 'clamp(0.6rem, 1.5vw, 2rem)',
          }}>
            <span style={{
              fontFamily: 'var(--font-sans), sans-serif', fontWeight: 500,
              fontSize: 'clamp(0.55rem,0.85vw,0.8rem)',
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: 'oklch(32% 0.007 74)',
              textShadow: '0 1px 8px rgba(255,255,255,0.95)',
            }}>SECANT Architects LLP</span>
            <span style={{ width: '2rem', height: '1px', background: 'oklch(68% 0.007 74)', display: 'block', flexShrink: 0 }} />
            <span style={{
              fontFamily: 'var(--font-sans), sans-serif', fontWeight: 400,
              fontSize: 'clamp(0.5rem,0.75vw,0.72rem)',
              letterSpacing: '0.24em', textTransform: 'uppercase',
              color: 'oklch(42% 0.007 74)',
              textShadow: '0 1px 8px rgba(255,255,255,0.95)',
            }}>Bengaluru · Est. 1999</span>
          </div>
        </div>

        {/* Bottom details */}
        <div ref={scatterRef} style={{ opacity: 0, position: 'relative' }}>
          <span style={{
            position: 'absolute', bottom: 0, left: 0,
            fontFamily: 'var(--font-sans), sans-serif', fontWeight: 400,
            fontSize: '0.58rem', letterSpacing: '0.38em', textTransform: 'uppercase',
            color: 'oklch(36% 0.007 74)',
            textShadow: '0 1px 6px rgba(255,255,255,0.95)',
          }}>12°58&apos;N · 77°35&apos;E</span>

          {/* Fixed — stays visible throughout the landing scroll */}
          <Link href="/about" style={{
            position: 'fixed',
            bottom: 'clamp(1.2rem, 2.5vh, 2rem)',
            left: 'clamp(1.5rem, 3vw, 2.5rem)',
            zIndex: 50,
            fontFamily: 'var(--font-sans), sans-serif', fontWeight: 420,
            fontSize: '0.54rem', letterSpacing: '0.32em', textTransform: 'uppercase',
            color: 'oklch(20% 0.007 72)', textDecoration: 'none',
            border: '1px solid oklch(40% 0.007 72)',
            padding: '0.45rem 1rem',
            background: 'rgba(250,248,245,0.92)',
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            pointerEvents: 'auto',
          }}>
            About Us
            <svg width="10" height="5" viewBox="0 0 10 5" fill="none">
              <line x1="0" y1="2.5" x2="10" y2="2.5" stroke="currentColor" strokeWidth="0.8"/>
              <polyline points="7,0.5 9.5,2.5 7,4.5" stroke="currentColor" strokeWidth="0.8" fill="none"/>
            </svg>
          </Link>

          <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', color: 'oklch(50% 0.007 74)' }} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="0"  x2="10" y2="6"  stroke="currentColor" strokeWidth="0.7"/>
              <line x1="10" y1="14" x2="10" y2="20" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="0"  y1="10" x2="6"  y2="10" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="14" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="0.7"/>
              <rect x="7.5" y="7.5" width="5" height="5" stroke="currentColor" strokeWidth="0.7" fill="none"/>
            </svg>
          </span>

          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            fontFamily: 'var(--font-sans), sans-serif', fontWeight: 400,
            fontSize: 'clamp(0.6rem,0.9vw,0.85rem)',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'oklch(30% 0.007 74)',
            textShadow: '0 1px 6px rgba(255,255,255,0.95)',
          }}>Space · Composed</span>

          <span className="hidden sm:block" style={{
            position: 'absolute', bottom: '2.5rem', right: 0,
            fontFamily: 'var(--font-sans), sans-serif', fontWeight: 400,
            fontSize: '0.54rem', letterSpacing: '0.4em', textTransform: 'uppercase',
            color: 'oklch(38% 0.007 74)',
            textShadow: '0 1px 6px rgba(255,255,255,0.95)',
            writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
          }}>01 / Home</span>
        </div>
      </div>
    </section>
  )
}
