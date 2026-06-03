'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { HERO_FONT } from '@/lib/heroConstants'

interface LoaderProps { onComplete: () => void }

const WORD       = 'SECANT'
const TYPE_SPEED = 0.10
const HOLD       = 0.35
const MOVE_DUR   = 0.80

/* oklch(8.5% 0.007 72) as hex so GSAP interpolates through RGB (no rainbow) */
const HERO_COLOR = '#1a1816'

export function Loader({ onComplete }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const wrap = wrapRef.current
    const text = textRef.current
    if (!root || !wrap || !text) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(root, { autoAlpha: 0 })
      onComplete()
      return
    }

    gsap.set(wrap, { xPercent: -50, yPercent: -50 })

    const tl = gsap.timeline()

    /* ── Phase 1: type SECANT ───────────────────────────────── */
    WORD.split('').forEach((char, i) => {
      tl.call(() => { text.textContent += char }, [], i * TYPE_SPEED)
    })

    /* ── Phase 2: all at once — slide + fade bg + colour ────── */
    const slideAt = WORD.length * TYPE_SPEED + HOLD

    tl.call(() => {
      const heroEl   = document.getElementById('hero-secant')
      const textRect = text.getBoundingClientRect()

      let dx = 0, dy = 0
      if (heroEl) {
        const heroRect = heroEl.getBoundingClientRect()
        dx = heroRect.left - textRect.left
        dy = heroRect.top  - textRect.top
      }

      /* All three happen simultaneously */
      gsap.to(wrap, {
        x: `+=${dx}`, y: `+=${dy}`,
        duration: MOVE_DUR, ease: 'power3.inOut',
      })
      gsap.to(root, {
        backgroundColor: 'rgba(0,0,0,0)',
        duration: MOVE_DUR, ease: 'power2.inOut',
      })
      gsap.to(text, {
        color: HERO_COLOR,
        duration: MOVE_DUR, ease: 'power2.inOut',
      })

    }, [], slideAt)

    /* ── Phase 3: remove loader ─────────────────────────────── */
    const doneAt = slideAt + MOVE_DUR
    tl.set(root,  { pointerEvents: 'none' }, doneAt)
    tl.set(root,  { display: 'none' }, doneAt + 0.05)
    tl.call(onComplete, [], doneAt + 0.1)

    return () => { tl.kill() }
  }, [onComplete])

  return (
    <div
      ref={rootRef}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000000' }}
      aria-hidden="true"
    >
      <div
        ref={wrapRef}
        style={{ position: 'absolute', top: '50%', left: '50%' }}
      >
        <span
          ref={textRef}
          style={{ ...HERO_FONT, color: '#ffffff', display: 'block' } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
