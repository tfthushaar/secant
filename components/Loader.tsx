'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { HERO_FONT } from '@/lib/heroConstants'

interface LoaderProps { onComplete: () => void }

const WORD       = 'SECANT'
const TYPE_SPEED = 0.10   /* s per letter */
const HOLD       = 0.40   /* hold after typing completes */
const MOVE_DUR   = 0.72   /* text slide duration */
const SETTLE     = 0.30   /* pause after text settles before fading */
const FADE_DUR   = 0.60   /* background fade duration — longer = smoother */

export function Loader({ onComplete }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const wrap = wrapRef.current
    const text = textRef.current
    if (!root || !wrap || !text) return

    /* Reduced-motion: skip straight to reveal */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(root, { autoAlpha: 0 })
      onComplete()
      return
    }

    /* GSAP handles centering so transforms compose cleanly */
    gsap.set(wrap, { xPercent: -50, yPercent: -50 })

    const tl = gsap.timeline()

    /* ── Phase 1: type SECANT ───────────────────────────────── */
    WORD.split('').forEach((char, i) => {
      tl.call(() => { text.textContent += char }, [], i * TYPE_SPEED)
    })

    /* ── Phase 2: slide to exact hero h1 position ───────────── */
    const slideAt = WORD.length * TYPE_SPEED + HOLD

    tl.call(() => {
      /* Measure the actual hero h1 DOM element — pixel-perfect */
      const heroEl  = document.getElementById('hero-secant')
      const textRect = text.getBoundingClientRect()

      let dx = 0
      let dy = 0

      if (heroEl) {
        const heroRect = heroEl.getBoundingClientRect()
        /* Simple delta: how far loader text needs to move so its
           top-left aligns with the hero h1's top-left             */
        dx = heroRect.left - textRect.left
        dy = heroRect.top  - textRect.top
      }

      /* Text flies to exact hero position */
      gsap.to(wrap, {
        x: `+=${dx}`,
        y: `+=${dy}`,
        duration: MOVE_DUR,
        ease: 'power3.inOut',
        onComplete: () => {
          /* Switch to dark instantly once settled */
          if (text) text.style.color = 'oklch(8.5% 0.007 72)'
        },
      })

      /* Black background fades smoothly AFTER text settles */
      gsap.to(root, {
        backgroundColor: 'rgba(0,0,0,0)',
        duration: FADE_DUR,
        ease: 'power1.inOut',
        delay: MOVE_DUR + SETTLE,
      })

    }, [], slideAt)

    /* ── Phase 3: remove loader, hand off ───────────────────── */
    const doneAt = slideAt + MOVE_DUR + SETTLE + FADE_DUR
    tl.set(root,  { pointerEvents: 'none' }, slideAt + MOVE_DUR)
    tl.to(root,   { autoAlpha: 0, duration: 0.15 }, doneAt)
    tl.set(root,  { display: 'none' }, doneAt + 0.15)
    tl.call(onComplete, [], doneAt + 0.2)

    return () => { tl.kill() }
  }, [onComplete])

  return (
    <div
      ref={rootRef}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000000' }}
      aria-hidden="true"
    >
      {/* SECANT — centred by GSAP, slides to exact hero h1 position */}
      <div
        ref={wrapRef}
        style={{ position: 'absolute', top: '50%', left: '50%' }}
      >
        <span
          ref={textRef}
          style={{
            ...HERO_FONT,
            color: '#ffffff',
            display: 'block',
            WebkitFontSmoothing: 'antialiased',
          } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
