'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/*
  Reference CSS:
  .cover { position: relative; min-height: 100svh; background: var(--black); }
  .cover__video { position: absolute; inset: 0; }
  .cover__video video { width: 100%; height: 100%; object-fit: cover; }
  .cover__video::after { height: clamp(100px,24svh,230px); gradient to paper bg }
  .cover__copy { position: absolute; right: var(--x); top: 50%; transform: translateY(-50%); }
  .cover h1 { font-size: clamp(90px,11.4vw,206px); font-weight: 300; line-height: 0.86; }
*/

const BG    = 'oklch(97.2% 0.006 78)'   /* --black: #f7f4ef */
const X     = 'clamp(18px, 3.7vw, 72px)' /* --x spacing */

export function Hero() {
  const copyRef = useRef<HTMLDivElement>(null)
  const h1Ref   = useRef<HTMLHeadingElement>(null)
  const subRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const copy = copyRef.current
    const h1   = h1Ref.current
    const sub  = subRef.current
    if (!copy || !h1 || !sub) return

    gsap.set([h1, sub], { autoAlpha: 0 })

    const tl = gsap.timeline({ delay: 0.1 })
    tl
      .to(h1,  { autoAlpha: 1, duration: 1.0, ease: 'power3.out' }, 0)
      .to(sub, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, 0.4)

    return () => { tl.kill() }
  }, [])

  return (
    <section style={{
      position: 'relative',
      minHeight: '100svh',
      background: BG,
      overflow: 'hidden',
    }}>

      {/* ── Video: fills the entire section as background ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <video
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          autoPlay muted loop playsInline preload="auto"
          aria-hidden="true"
        >
          <source src="/assets/video/hero.mp4" type="video/mp4" />
        </video>

        {/* Bottom gradient fades video into page background — from reference */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 'clamp(100px, 24svh, 230px)',
          background: `linear-gradient(180deg, transparent 0%, ${BG} 100%)`,
          pointerEvents: 'none',
        }} aria-hidden="true" />
      </div>

      {/* ── Section index — top right ── */}
      <div style={{
        position: 'absolute', top: '4.4rem', right: X,
        zIndex: 2,
        fontFamily: 'var(--font-jost), sans-serif',
        fontWeight: 300, fontSize: '0.52rem',
        letterSpacing: '0.42em', textTransform: 'uppercase',
        color: 'rgba(30,30,28,0.38)',
        textShadow: `0 1px 10px rgba(247,244,239,0.7)`,
        pointerEvents: 'none',
      }}>
        01 / Home
      </div>

      {/* ── ⊕ crosshair at bottom centre ── */}
      <div style={{
        position: 'absolute', bottom: 'clamp(24px, 4vh, 48px)',
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 2, color: 'oklch(40% 0.006 74)',
        pointerEvents: 'none',
      }} aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <line x1="11" y1="0"  x2="11" y2="7"  stroke="currentColor" strokeWidth="0.7"/>
          <line x1="11" y1="15" x2="11" y2="22" stroke="currentColor" strokeWidth="0.7"/>
          <line x1="0"  y1="11" x2="7"  y2="11" stroke="currentColor" strokeWidth="0.7"/>
          <line x1="15" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="0.7"/>
          <rect x="8" y="8" width="6" height="6"
            stroke="currentColor" strokeWidth="0.7" fill="none"/>
        </svg>
      </div>

      {/*
        ── SECANT copy — right side, bottom-aligned (matches reference image).
           Reference CSS: top: 50%; transform: translateY(-50%) → centred.
           Reference IMAGE shows it at bottom-right. We match the image.
      */}
      <div
        ref={copyRef}
        style={{
          position: 'absolute',
          right: X,
          bottom: 'clamp(20px, 3.2vh, 44px)',
          zIndex: 2,
          textAlign: 'right',
          color: 'oklch(8.5% 0.007 72)',
          textShadow: '0 2px 22px rgba(247,244,239,0.92)',
        }}
      >
        <h1
          ref={h1Ref}
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontWeight: 300,
            fontSize: 'clamp(90px, 11.4vw, 206px)',
            lineHeight: 0.86,
            textTransform: 'uppercase',
            letterSpacing: '0.015em',
            margin: 0,
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
            fontSize: 'clamp(10px, 0.9vw, 13px)',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'oklch(44% 0.007 74)',
            marginTop: '0.55rem',
            opacity: 0,
          }}
        >
          Architecture · Studio
        </div>
      </div>

    </section>
  )
}
