'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/* Smooth fade-in on every page mount.
   Combine with pre-navigation GSAP fade-out in click handlers
   to get seamless page-to-page transitions.                   */
export function PageTransition({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { el.style.opacity = '1'; return }

    gsap.fromTo(
      el,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.58, ease: 'power3.out', delay: 0.04 }
    )
  }, [])

  return (
    <div ref={ref} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </div>
  )
}
