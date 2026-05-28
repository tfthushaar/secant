'use client'

import Link from 'next/link'

/* Top-left: sc mark + SECANT label. Menu button is in Navigator component. */
export function Navigation() {
  return (
    <header
      className="fixed top-0 left-0 z-[100] flex items-center gap-3"
      style={{ height: '3.8rem', paddingLeft: 'clamp(1.2rem, 3vw, 2rem)' }}
    >
      {/* SC mark — small, monospace feel */}
      <span
        style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300,
          fontSize: '0.62rem',
          letterSpacing: '0.18em',
          color: 'oklch(50% 0.007 74)',
          textTransform: 'lowercase',
        }}
      >
        sc
      </span>

      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 400,
          fontSize: '0.72rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'oklch(26% 0.007 72)',
          textDecoration: 'none',
          transition: 'opacity 0.2s',
        }}
        className="hover:opacity-50"
        aria-label="SECANT — Home"
      >
        SECANT
      </Link>
    </header>
  )
}
