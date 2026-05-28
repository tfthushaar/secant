'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface LoaderProps {
  onComplete: () => void
}

const LETTERS = ['S', 'E', 'C', 'A', 'N', 'T']

export function Loader({ onComplete }: LoaderProps) {
  const rootRef     = useRef<HTMLDivElement>(null)
  const letterRefs  = useRef<(HTMLSpanElement | null)[]>([])
  const underlineRef = useRef<HTMLDivElement>(null)
  const subRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      gsap.set(root, { yPercent: -100 })
      onComplete()
      return
    }

    /* Set initial states */
    gsap.set(letterRefs.current, { clipPath: 'inset(0 100% 0 0)', y: 6 })
    gsap.set([underlineRef.current, subRef.current], { autoAlpha: 0 })

    const tl = gsap.timeline()

    /* Letters reveal — staggered clip-path, no pencil needed */
    tl.to(letterRefs.current, {
      clipPath: 'inset(0 0% 0 0)',
      y: 0,
      duration: 0.65,
      stagger: 0.075,
      ease: 'power3.out',
    }, 0.2)

    /* Underline draws */
    tl.to(underlineRef.current, {
      autoAlpha: 1,
      scaleX: 1,
      duration: 0.45,
      ease: 'power3.inOut',
    }, 0.9)

    /* Subtitle */
    tl.to(subRef.current, {
      autoAlpha: 1,
      duration: 0.4,
      ease: 'power2.out',
    }, 1.15)

    /* Hold */
    tl.to({}, { duration: 0.55 }, 1.65)

    /* ── Slide the whole loader DOWN to reveal the page beneath ── */
    tl.to(root, {
      yPercent: 100,
      duration: 0.85,
      ease: 'power3.inOut',
      onComplete,
    }, 2.2)

    return () => { tl.kill() }
  }, [onComplete])

  /* Layout: full-screen dark, centred wordmark */
  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: '#0D0C0A' }}
      aria-hidden="true"
    >
      {/* Corner labels */}
      <div
        className="absolute top-7 left-8"
        style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300,
          fontSize: '0.58rem',
          letterSpacing: '0.38em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.22)',
        }}
      >
        12°58&apos;N · 77°35&apos;E
      </div>
      <div
        className="absolute bottom-7 right-8"
        style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300,
          fontSize: '0.58rem',
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.22)',
        }}
      >
        Est. 2003 · BLR
      </div>

      {/* SECANT + underline + subtitle */}
      <div className="flex flex-col items-center">
        {/* Wordmark — white EB Garamond on black */}
        <div
          className="flex items-baseline"
          style={{ gap: '0.015em' }}
          aria-label="SECANT"
        >
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              ref={(el) => { letterRefs.current[i] = el }}
              style={{
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontWeight: 400,
                fontSize: 'clamp(4rem, 10vw, 10rem)',
                lineHeight: 1,
                letterSpacing: '0.02em',
                color: 'rgba(255,255,255,0.95)',
                clipPath: 'inset(0 100% 0 0)',
                display: 'block',
                userSelect: 'none',
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Underline */}
        <div
          ref={underlineRef}
          style={{
            width: '100%',
            height: '1px',
            background: 'rgba(255,255,255,0.18)',
            marginTop: '1rem',
            opacity: 0,
            transform: 'scaleX(0)',
            transformOrigin: 'left center',
          }}
        />

        {/* Subtitle */}
        <div
          ref={subRef}
          style={{
            fontFamily: 'var(--font-jost), sans-serif',
            fontWeight: 300,
            fontSize: '0.58rem',
            letterSpacing: '0.48em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)',
            marginTop: '0.9rem',
            opacity: 0,
          }}
        >
          Architecture Studio
        </div>
      </div>
    </div>
  )
}
