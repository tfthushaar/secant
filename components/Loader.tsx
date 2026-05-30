'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { gsap } from 'gsap'

const TextType = dynamic(() => import('./TextType'), { ssr: false })

interface LoaderProps { onComplete: () => void }

const TARGET      = 'SECANT.COM'   /* all-caps — architectural precision */
const TYPING_SPEED = 110  /* ms per character — deliberate, unhurried */
const POST_PAUSE   = 1400 /* ms after typing — let it breathe */

/* Total visible duration = chars × speed + post-pause */
const TOTAL_MS = TARGET.length * TYPING_SPEED + POST_PAUSE

export function Loader({ onComplete }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      gsap.set(rootRef.current, { yPercent: -100 })
      onComplete()
      return
    }

    /* After typing finishes, slide the whole loader DOWN */
    const timer = setTimeout(() => {
      gsap.to(rootRef.current, {
        yPercent: 100,
        duration: 0.85,
        ease: 'power3.inOut',
        onComplete,
      })
    }, TOTAL_MS)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: '#000000' }}   /* pure black — no warm cast */
      aria-hidden="true"
    >
      {/* Corner labels */}
      <div className="absolute top-7 left-8" style={{
        fontFamily: 'var(--font-sans), sans-serif',
        fontWeight: 300, fontSize: '0.55rem',
        letterSpacing: '0.38em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.18)',
      }}>
        12°58&apos;N · 77°35&apos;E
      </div>
      <div className="absolute bottom-7 right-8" style={{
        fontFamily: 'var(--font-sans), sans-serif',
        fontWeight: 300, fontSize: '0.55rem',
        letterSpacing: '0.35em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.18)',
      }}>
        Est. 2003 · BLR
      </div>

      {/* Centred typing text */}
      <div style={{ textAlign: 'center' }}>
        <TextType
          text={TARGET}
          loop={false}
          typingSpeed={TYPING_SPEED}
          initialDelay={180}
          pauseDuration={999999}   /* never delete — we slide down instead */
          showCursor={true}
          cursorCharacter="_"
          cursorBlinkDuration={0.45}
          style={{
            fontFamily: 'var(--font-display), Georgia, serif',
            fontWeight: 400,
            fontSize: 'clamp(2.2rem, 6vw, 5.5rem)',
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.92)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        />
        <div style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 300,
          fontSize: '0.56rem',
          letterSpacing: '0.48em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.22)',
          marginTop: '1.4rem',
        }}>
          Architecture Studio
        </div>
      </div>
    </div>
  )
}
