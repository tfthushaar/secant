'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface LoaderProps { onComplete: () => void }

/*
  Animation timeline:
  0.0s  – cursor appears and blinks
  0.0s  – letters type in one by one (120ms each × 10 = 1.2s)
  1.2s  – hold: "SECANT.COM_" blinks for 0.9s
  2.1s  – letters backspace one by one (65ms each × 10 = 0.65s)
  2.75s – brief pause (0.25s)
  3.0s  – whole loader slides down (0.85s)
  3.85s – hero is fully revealed, onComplete fires
*/
const WORD = 'SECANT.COM'

export function Loader({ onComplete }: LoaderProps) {
  const rootRef   = useRef<HTMLDivElement>(null)
  const textRef   = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root   = rootRef.current
    const text   = textRef.current
    const cursor = cursorRef.current
    if (!root || !text || !cursor) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { gsap.set(root, { yPercent: -100 }); onComplete(); return }

    /* Cursor blink — runs throughout */
    const blink = gsap.to(cursor, {
      opacity: 0, duration: 0.42,
      repeat: -1, yoyo: true, ease: 'power2.inOut',
    })

    const tl = gsap.timeline()

    const TYPE_SPEED = 0.12   /* s per letter forward */
    const DEL_SPEED  = 0.065  /* s per letter backward — faster feels intentional */

    /* ── TYPE forward ─────────────────────────────────────────── */
    WORD.split('').forEach((char, i) => {
      tl.call(() => { text.textContent += char }, [], i * TYPE_SPEED)
    })

    /* ── Hold ─────────────────────────────────────────────────── */
    tl.to({}, { duration: 0.9 }, WORD.length * TYPE_SPEED)

    /* ── BACKSPACE ────────────────────────────────────────────── */
    WORD.split('').forEach((_, i) => {
      tl.call(() => {
        if (text.textContent) text.textContent = text.textContent.slice(0, -1)
      }, [], WORD.length * TYPE_SPEED + 0.9 + i * DEL_SPEED)
    })

    /* ── Brief empty pause then slide ────────────────────────── */
    const slideAt = WORD.length * TYPE_SPEED + 0.9 + WORD.length * DEL_SPEED + 0.22

    tl.call(() => blink.kill(), [], slideAt - 0.05)
    tl.to(root, {
      yPercent: 100,
      duration: 0.85,
      ease: 'power3.inOut',
      onComplete,
    }, slideAt)

    return () => { tl.kill(); blink.kill() }
  }, [onComplete])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: '#000000' }}
      aria-hidden="true"
    >
      {/* Corner labels */}
      <div className="absolute top-7 left-8" style={{
        fontFamily: 'var(--font-sans), sans-serif',
        fontWeight: 300, fontSize: '0.55rem',
        letterSpacing: '0.38em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.2)',
      }}>12°58&apos;N · 77°35&apos;E</div>
      <div className="absolute bottom-7 right-8" style={{
        fontFamily: 'var(--font-sans), sans-serif',
        fontWeight: 300, fontSize: '0.55rem',
        letterSpacing: '0.35em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.2)',
      }}>Est. 2003 · BLR</div>

      {/* Typing text + cursor */}
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span
          ref={textRef}
          style={{
            fontFamily: 'var(--font-sans), sans-serif',
            fontWeight: 200,
            fontSize: 'clamp(2rem, 6vw, 5rem)',
            letterSpacing: '0.38em',
            color: '#ffffff',
            userSelect: 'none',
            minWidth: '1px',
          }}
        />
        <span
          ref={cursorRef}
          style={{
            fontFamily: 'var(--font-sans), sans-serif',
            fontWeight: 100,
            fontSize: 'clamp(2rem, 6vw, 5rem)',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1,
            userSelect: 'none',
            marginLeft: '2px',
          }}
        >_</span>
      </div>

      <div style={{
        fontFamily: 'var(--font-sans), sans-serif',
        fontWeight: 300, fontSize: '0.56rem',
        letterSpacing: '0.48em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.22)',
        marginTop: '1.2rem',
      }}>
        Architecture Studio
      </div>
    </div>
  )
}
