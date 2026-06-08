'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useNavigate } from '@/components/TransitionBlink'

const NAV_LINKS = [
  { label: 'Home',    href: '/',               num: '00' },
  { label: 'Work',    href: '/work',            num: '01' },
  { label: 'About',   href: '/about',           num: '02' },
  { label: 'Contact', href: '/about#contact',   num: '03' },
]

export function Navigator() {
  const { navigate } = useNavigate()
  const [open, setOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const linksRef   = useRef<(HTMLDivElement | null)[]>([])
  const metaRef    = useRef<HTMLDivElement>(null)
  /* All pages are white — always use dark icon */

  /* Animate open/close */
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    const links = linksRef.current.filter(Boolean) as HTMLElement[]
    const meta  = metaRef.current

    /* Kill any in-progress tweens before starting new ones.
       Without this, a tween that started during the previous open/close still
       owns the clipPath property and the new tween races against it — the
       overlay appears frozen at a mid-point ("cut in half") on reuse. */
    gsap.killTweensOf([overlay, ...links, ...(meta ? [meta] : [])])

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
        {/* Minimal two-line icon */}
        {!open && (
          <div className="flex flex-col gap-[5px]" aria-hidden="true">
            <span style={{ display: 'block', width: '18px', height: '1px', background: 'oklch(26% 0.007 72)' }} />
            <span style={{ display: 'block', width: '12px', height: '1px', background: 'oklch(26% 0.007 72)' }} />
          </div>
        )}
        <span
          style={{
            fontFamily: 'var(--font-sans), sans-serif',
            fontWeight: 500, fontSize: '0.72rem',
            letterSpacing: '0.18em', textTransform: 'uppercase',
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
              fontFamily: 'var(--font-sans), sans-serif',
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
              fontFamily: 'var(--font-sans), sans-serif',
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

        {/* Navigation links — full-width rows that turn white on hover */}
        <nav
          className="flex flex-col"
          style={{ marginTop: 'auto', marginBottom: 'auto' }}
          aria-label="Site navigation"
        >
          {NAV_LINKS.map(({ label, href, num }, i) => (
            <div
              key={label}
              ref={(el) => { linksRef.current[i] = el }}
              style={{
                opacity: 0,
                /* Extend to full overlay width — negative margin cancels overlay padding */
                marginLeft:  'calc(-1 * clamp(2rem,8vw,7rem))',
                marginRight: 'calc(-1 * clamp(2rem,8vw,7rem))',
              }}
            >
              <a
                href={href}
                onClick={e => { e.preventDefault(); setOpen(false); navigate(href) }}
                /* nav-row-link class adds full-row white hover via globals.css */
                className="nav-row-link"
                style={{
                  paddingLeft:   'clamp(2rem,8vw,7rem)',
                  paddingRight:  'clamp(2rem,8vw,7rem)',
                  paddingTop:    'clamp(0.25rem,0.8vh,0.5rem)',
                  paddingBottom: 'clamp(0.25rem,0.8vh,0.5rem)',
                  gap: '1.5rem',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span
                  className="nav-row-num"
                  style={{
                    fontFamily: 'var(--font-sans), sans-serif',
                    fontWeight: 200,
                    fontSize: '0.56rem',
                    letterSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.32)',   /* white, not warm */
                    minWidth: '2.2rem',
                    flexShrink: 0,
                    transition: 'color 0.18s ease',
                  }}
                >
                  {num}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-sans), sans-serif',  /* Raleway — clean white */
                    fontWeight: 100,
                    fontSize: 'clamp(3rem, 8vw, 8.5rem)',
                    lineHeight: 1.0,
                    letterSpacing: '0.02em',
                    fontFeatureSettings: '"kern" 1, "liga" 1',
                  }}
                >
                  {label}
                </span>
              </a>
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
              fontFamily: 'var(--font-sans), sans-serif',
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
              fontFamily: 'var(--font-sans), sans-serif',
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
