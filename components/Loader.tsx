'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { HERO_FONT } from '@/lib/heroConstants'

interface LoaderProps { onComplete: () => void }

const WORD       = 'SECANT'
const TYPE_SPEED = 0.10
const HOLD       = 0.35
const MOVE_DUR   = 0.75   /* slide to hero position */
const REVEAL_DUR = 0.55   /* colour + bg fade */

/* oklch(8.5% 0.007 72) as hex so GSAP interpolates via RGB, no rainbow */
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

    /* ── Phase 2: slide to exact hero h1 position ───────────── */
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
      gsap.to(wrap, {
        x: `+=${dx}`, y: `+=${dy}`,
        duration: MOVE_DUR, ease: 'power3.inOut',
      })
    }, [], slideAt)

    /* ── Phase 3: colour + bg fade simultaneously ───────────── */
    const revealAt = slideAt + MOVE_DUR

    tl.call(() => {
      gsap.to(text, {
        color: HERO_COLOR,
        duration: REVEAL_DUR, ease: 'power2.inOut',
      })
      gsap.to(root, {
        backgroundColor: 'rgba(0,0,0,0)',
        duration: REVEAL_DUR, ease: 'power2.inOut',
      })
    }, [], revealAt)

    /* ── Phase 4: hand off to hero, remove loader ───────────── */
    const doneAt = revealAt + REVEAL_DUR

    tl.call(() => {
      /* Make hero's SECANT visible instantly — loader SECANT is
         in exactly the same position, so this is a seamless swap */
      const heroTitle = document.querySelector('[data-hero-title]') as HTMLElement | null
      if (heroTitle) gsap.set(heroTitle, { autoAlpha: 1 })
    }, [], doneAt)

    tl.set(root,  { display: 'none' }, doneAt + 0.02)

    /* onComplete fires after loader is gone — triggers sub/scatter */
    tl.call(onComplete, [], doneAt + 0.05)

    return () => { tl.kill() }
  }, [onComplete])

  return (
    <div
      ref={rootRef}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000000', pointerEvents: 'none' }}
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
