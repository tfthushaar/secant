'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/*
  Hero — 100 vh transparent panel over the fixed 3D model.
  No pin. No ScrollTrigger. Camera is driven by page-level scroll in page.tsx.
*/

const X = 'clamp(18px, 3.7vw, 72px)'

export function Hero() {
  const titleRef   = useRef<HTMLDivElement>(null)
  const subRef     = useRef<HTMLDivElement>(null)
  const scatterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = [titleRef.current, subRef.current, scatterRef.current]
    gsap.set(els, { autoAlpha: 0 })
    const tl = gsap.timeline({ delay: 0.2 })
    tl
      .to(titleRef.current,   { autoAlpha: 1, duration: 1.1, ease: 'power3.out' }, 0)
      .to(subRef.current,     { autoAlpha: 1, duration: 0.9, ease: 'power3.out' }, 0.35)
      .to(scatterRef.current, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, 0.7)
    return () => { tl.kill() }
  }, [])

  return (
    <section style={{
      position: 'relative', width: '100%', height: '100svh', overflow: 'hidden',
      /* transparent — fixed model shows through */
    }}>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: `clamp(4.5rem,8vh,6rem) ${X} clamp(1.5rem,3vh,2.5rem)`,
      }}>
        {/* SECANT wordmark */}
        <div>
          <div ref={titleRef} style={{ opacity: 0 }}>
            <h1 style={{
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
            opacity: 0, marginTop: 'clamp(0.6rem, 1.5vh, 1.2rem)',
            display: 'flex', alignItems: 'center', gap: '2rem',
          }}>
            <span style={{
              fontFamily: 'var(--font-sans), sans-serif', fontWeight: 500,
              fontSize: 'clamp(0.7rem,1vw,0.95rem)',
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'oklch(32% 0.007 74)',
              textShadow: '0 1px 8px rgba(255,255,255,0.95)',
            }}>Architecture Studio</span>
            <span style={{ width: '3rem', height: '1px', background: 'oklch(68% 0.007 74)', display: 'block', flexShrink: 0 }} />
            <span style={{
              fontFamily: 'var(--font-sans), sans-serif', fontWeight: 400,
              fontSize: 'clamp(0.65rem,0.9vw,0.85rem)',
              letterSpacing: '0.28em', textTransform: 'uppercase',
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
