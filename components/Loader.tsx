'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface LoaderProps { onComplete: () => void }

const LETTERS = ['S', 'E', 'C', 'A', 'N', 'T']

/*
  Exact implementation from the reference styles.css:
  ─ Letters: translateY(112%) → translateY(0), opacity 0→1
    920ms, cubic-bezier(0.22, 1, 0.36, 1), stagger 90ms, first delay 150ms
  ─ Line below word: scaleX 0→1, 2200ms, same ease
  ─ Exit: translateY(100%), 760ms, cubic-bezier(0.76, 0, 0.24, 1), after 2550ms
*/
export function Loader({ onComplete }: LoaderProps) {
  const rootRef    = useRef<HTMLDivElement>(null)
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([])
  const lineRef    = useRef<HTMLSpanElement>(null)

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
    gsap.set(letterRefs.current.filter(Boolean), {
      opacity: 0,
      y: '112%',
    })
    gsap.set(lineRef.current, { scaleX: 0, transformOrigin: 'left center' })

    const tl = gsap.timeline({
      onComplete,
      defaults: { ease: 'cubic.out' },
    })

    /* Letters rise — matching reference timing exactly */
    LETTERS.forEach((_, i) => {
      tl.to(
        letterRefs.current[i],
        {
          opacity: 1,
          y: '0%',
          duration: 0.92,
          ease: 'cubic.out',
        },
        0.15 + i * 0.09   /* 150ms + i*90ms in seconds */
      )
    })

    /* Line draws */
    tl.to(
      lineRef.current,
      { scaleX: 1, duration: 2.2, ease: 'cubic.out' },
      0.15   /* starts same time as first letter */
    )

    /* Hold, then exit */
    tl.to(
      root,
      {
        yPercent: 100,
        duration: 0.76,
        ease: 'power2.inOut',   /* approximates cubic-bezier(0.76,0,0.24,1) */
      },
      2.55   /* 2550ms */
    )

    return () => { tl.kill() }
  }, [onComplete])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] grid place-items-center"
      style={{ background: '#000000', color: '#ffffff' }}
      aria-hidden="true"
    >
      {/* Corner labels */}
      <div className="absolute top-6 left-7" style={{
        fontFamily: 'var(--font-jost), sans-serif',
        fontWeight: 400, fontSize: '0.56rem',
        letterSpacing: '0.38em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.2)',
      }}>
        12°58&apos;N · 77°35&apos;E
      </div>
      <div className="absolute bottom-6 right-7" style={{
        fontFamily: 'var(--font-jost), sans-serif',
        fontWeight: 400, fontSize: '0.56rem',
        letterSpacing: '0.35em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.2)',
      }}>
        Est. 2003 · BLR
      </div>

      {/* Word + line — matching reference structure */}
      <div style={{
        width: 'min(82vw, 940px)',
        display: 'grid',
        gap: 'clamp(18px, 3vw, 38px)',
        justifyItems: 'center',
      }}>

        {/* SECANT — each letter rises from below */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            overflow: 'hidden',                        /* clip the rising letters */
            paddingBottom: '0.08em',                   /* prevent clip of descenders */
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontWeight: 400,
            fontSize: 'clamp(54px, 12vw, 176px)',
            lineHeight: 0.86,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#ffffff',
          }}
          aria-label="SECANT"
        >
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              ref={(el) => { letterRefs.current[i] = el }}
              style={{
                display: 'inline-block',
                opacity: 0,
                transform: 'translateY(112%)',
                userSelect: 'none',
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Drawing line — matches reference loader__line */}
        <div style={{
          width: 'min(420px, 64vw)',
          height: '1px',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.22)',
        }}>
          <span
            ref={lineRef}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              background: '#ffffff',
              transformOrigin: 'left center',
              transform: 'scaleX(0)',
            }}
          />
        </div>

      </div>
    </div>
  )
}
