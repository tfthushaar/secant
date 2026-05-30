'use client'

import Link from 'next/link'

/* Top-left only: sc · SECANT (home link).
   The right side is left clear for the Navigator MENU button. */
export function Navigation() {
  return (
    <header
      className="fixed top-0 left-0 z-[100] flex items-center gap-3"
      style={{ height: '3.8rem', paddingLeft: 'clamp(1.2rem, 3vw, 2rem)' }}
    >
      <span style={{
        fontFamily: 'var(--font-sans), sans-serif',
        fontWeight: 300, fontSize: '0.6rem',
        letterSpacing: '0.18em', color: 'oklch(50% 0.007 74)',
        textTransform: 'lowercase',
      }}>sc</span>

      <Link href="/" style={{
        fontFamily: 'var(--font-sans), sans-serif',
        fontWeight: 400, fontSize: '0.72rem',
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'oklch(26% 0.007 72)', textDecoration: 'none',
      }} aria-label="SECANT — Home">
        SECANT
      </Link>
    </header>
  )
}
