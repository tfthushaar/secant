'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'

const NAV_LINKS = [
  { label: 'Home',    href: '/',               num: '00' },
  { label: 'Work',    href: '/work',            num: '01' },
  { label: 'Studio',  href: '/studio',          num: '02' },
  { label: 'Contact', href: '/studio#contact',  num: '03' },
]

export function Navigator() {
  const [open, setOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const linksRef   = useRef<(HTMLDivElement | null)[]>([])
  const metaRef    = useRef<HTMLDivElement>(null)

  /* Animate open/close */
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    const links = linksRef.current.filter(Boolean)
    const meta  = metaRef.current

    if (open) {
      /* Reveal overlay from top */
      gsap.set(overlay, { clipPath: 'inset(0 0 100% 0)', display: 'flex' })
      gsap.to(overlay, {
        clipPath: 'inset(0 0 0% 0)',
        duration: 0.65, ease: 'power3.inOut',
      })
      /* Stagger links */
      gsap.fromTo(links,
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.25 }
      )
      if (meta) {
        gsap.fromTo(meta,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.5, ease: 'power2.out', delay: 0.5 }
        )
      }
      document.body.style.overflow = 'hidden'
    } else {
      gsap.to(overlay, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.5, ease: 'power3.inOut',
        onComplete: () => gsap.set(overlay, { display: 'none' }),
      })
      document.body.style.overflow = ''
    }
  }, [open])

  /* Close on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* ── Trigger button — small, top-right corner ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[300] flex items-center gap-2"
        style={{ top: '1.1rem', right: 'clamp(1.2rem, 3vw, 2rem)' }}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {/* Minimal three-line icon */}
        {!open && (
          <div className="flex flex-col gap-[5px]" aria-hidden="true">
            <span style={{ display: 'block', width: '18px', height: '1px', background: 'oklch(26% 0.007 72)' }} />
            <span style={{ display: 'block', width: '12px', height: '1px', background: 'oklch(26% 0.007 72)' }} />
          </div>
        )}
        <span
          style={{
            fontFamily: 'var(--font-jost), sans-serif',
            fontWeight: 500,
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: open ? 'rgba(247,244,239,0.85)' : 'oklch(22% 0.007 72)',
            transition: 'color 0.25s',
          }}
        >
          {open ? 'Close' : 'Menu'}
        </span>
      </button>

      {/* ── Full-screen overlay ──────────────────────── */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[400] flex-col justify-between"
        style={{
          display: 'none',
          clipPath: 'inset(0 0 100% 0)',
          background: 'oklch(8.5% 0.007 72)',
          padding: 'clamp(5rem,10vh,8rem) clamp(2rem,8vw,7rem)',
        }}
      >
        {/* Close hit zone */}
        <button
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: -1 }}
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />

        {/* Top row */}
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: 'var(--font-jost), sans-serif',
              fontWeight: 100,
              fontSize: 'clamp(1.1rem, 2.2vw, 1.8rem)',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.92)',
            }}
          >
            SECANT
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{
              fontFamily: 'var(--font-jost), sans-serif',
              fontWeight: 200,
              fontSize: '0.6rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
            }}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {/* Navigation links */}
        <nav
          className="flex flex-col"
          style={{ gap: 'clamp(0.5rem, 2vh, 1rem)', marginTop: 'auto', marginBottom: 'auto' }}
          aria-label="Site navigation"
        >
          {NAV_LINKS.map(({ label, href, num }, i) => (
            <div
              key={label}
              ref={(el) => { linksRef.current[i] = el }}
              style={{ opacity: 0 }}
            >
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className="group flex items-baseline gap-6 transition-opacity duration-200 hover:opacity-40"
              >
                <span
                  style={{
                    fontFamily: 'var(--font-jost), sans-serif',
                    fontWeight: 200,
                    fontSize: '0.6rem',
                    letterSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.28)',
                    minWidth: '2rem',
                  }}
                >
                  {num}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-jost), sans-serif',
                    fontWeight: 100,
                    fontSize: 'clamp(3.5rem, 9vw, 9rem)',
                    lineHeight: 1.0,
                    letterSpacing: '-0.01em',
                    color: 'rgba(255,255,255,0.93)',
                  }}
                >
                  {label}
                </span>
              </Link>
            </div>
          ))}
        </nav>

        {/* Bottom meta */}
        <div
          ref={metaRef}
          className="flex items-end justify-between"
          style={{ opacity: 0 }}
        >
          <div
            style={{
              fontFamily: 'var(--font-jost), sans-serif',
              fontWeight: 200,
              fontSize: '0.6rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.22)',
              lineHeight: 2,
            }}
          >
            Est. 2003<br />
            Bengaluru, India
          </div>
          <div
            style={{
              fontFamily: 'var(--font-jost), sans-serif',
              fontWeight: 200,
              fontSize: '0.6rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.22)',
              textAlign: 'right',
              lineHeight: 2,
            }}
          >
            Architecture Studio<br />
            © 2024 SECANT
          </div>
        </div>
      </div>
    </>
  )
}
