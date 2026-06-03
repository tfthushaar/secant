'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface LoaderProps { onComplete: () => void }

const WORD       = 'SECANT'
const TYPE_SPEED = 0.10   /* s per letter */
const HOLD       = 0.40   /* hold after typing completes */
const MOVE_DUR   = 0.72   /* text slide duration */
const SETTLE     = 0.28   /* pause after text settles before fading */
const FADE_DUR   = 0.40   /* fade out duration */

/* Font exactly matches Hero's h1 */
const HERO_FONT: React.CSSProperties = {
  fontFamily:      'var(--font-sans), "Helvetica Neue", Arial, sans-serif',
  fontWeight:      300,
  fontSize:        'clamp(5rem, 14vw, 16rem)',
  lineHeight:      0.88,
  letterSpacing:   '0.06em',
  textTransform:   'uppercase',
  userSelect:      'none',
}

export function Loader({ onComplete }: LoaderProps) {
  const rootRef   = useRef<HTMLDivElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)
  const textRef   = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root   = rootRef.current
    const wrap   = wrapRef.current
    const text   = textRef.current
    const cursor = cursorRef.current
    if (!root || !wrap || !text || !cursor) return

    /* Reduced-motion: skip straight to reveal */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(root, { autoAlpha: 0 })
      onComplete()
      return
    }

    /* GSAP handles centering so transforms compose cleanly */
    gsap.set(wrap, { xPercent: -50, yPercent: -50 })

    /* ── Cursor blink ───────────────────────────────────────── */
    const blink = gsap.to(cursor, {
      opacity: 0, duration: 0.42,
      repeat: -1, yoyo: true, ease: 'power2.inOut',
    })

    const tl = gsap.timeline()

    /* ── Phase 1: type SECANT ───────────────────────────────── */
    WORD.split('').forEach((char, i) => {
      tl.call(() => { text.textContent += char }, [], i * TYPE_SPEED)
    })

    /* ── Phase 2: move to hero position + fade black ────────── */
    const slideAt = WORD.length * TYPE_SPEED + HOLD

    tl.call(() => {
      blink.kill()
      gsap.set(cursor, { autoAlpha: 0 })

      /* Calculate the exact hero SECANT top-left in viewport px.
         Hero padding: padding: clamp(4.5rem,8vh,6rem) clamp(18px,3.7vw,72px) ...
         — recompute from window so it matches any screen size. */
      const vpW  = window.innerWidth
      const vpH  = window.innerHeight
      const xPad = Math.min(Math.max(18, vpW * 0.037), 72)   /* clamp(18px,3.7vw,72px)    */
      const yPad = Math.min(Math.max(72, vpH * 0.08),  96)   /* clamp(4.5rem,8vh,6rem)     */

      /* After typing, wrap has its real dimensions */
      const rect = wrap.getBoundingClientRect()

      /* With position:absolute top:50% left:50% and xPercent/yPercent:-50,
         element's visual top-left = (vpW/2 - w/2 + x, vpH/2 - h/2 + y).
         Solve for x, y that place top-left at (xPad, yPad):            */
      const targetX = xPad - vpW / 2 + rect.width  / 2
      const targetY = yPad - vpH / 2 + rect.height / 2

      /* Text flies to hero position */
      gsap.to(wrap, {
        x: targetX,
        y: targetY,
        duration: MOVE_DUR,
        ease: 'power3.inOut',
      })

      /* Colour: white → hero dark charcoal (smooth, starts immediately) */
      gsap.to(text, {
        color: 'oklch(8.5% 0.007 72)',
        duration: MOVE_DUR,
        ease: 'sine.inOut',
      })

      /* Black background fades AFTER text settles (overlaps with settle pause) */
      gsap.to(root, {
        backgroundColor: 'rgba(0,0,0,0)',
        duration: FADE_DUR,
        ease: 'sine.inOut',
        delay: MOVE_DUR + SETTLE,
      })

    }, [], slideAt)

    /* ── Phase 3: hand off to Hero ───────────────────────────── */
    tl.call(onComplete, [], slideAt + MOVE_DUR)

    /* Loader fully fades out after black is gone */
    tl.to(root, { autoAlpha: 0, duration: 0.2 }, slideAt + MOVE_DUR + SETTLE + FADE_DUR)

    return () => { tl.kill(); blink.kill() }
  }, [onComplete])

  return (
    <div
      ref={rootRef}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000000' }}
      aria-hidden="true"
    >
      {/* SECANT — centred by GSAP, slides to hero position on reveal */}
      <div
        ref={wrapRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          display: 'flex',
          alignItems: 'baseline',
        }}
      >
        <span
          ref={textRef}
          style={{ ...HERO_FONT, color: '#ffffff' }}
        />
        <span
          ref={cursorRef}
          style={{
            ...HERO_FONT,
            fontWeight: 100,
            color: 'rgba(255,255,255,0.55)',
            marginLeft: '3px',
          }}
        >_</span>
      </div>
    </div>
  )
}
