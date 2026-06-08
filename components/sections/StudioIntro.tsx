'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useIsMobile } from '@/hooks/useIsMobile'

gsap.registerPlugin(ScrollTrigger)

/*
  StudioIntro — four 100vh transparent sections.
  Each section positions content left OR right so the 3D model
  stays visible on the opposite side as the camera angle shifts.

  Camera angles (set in page.tsx ScrollTrigger) progress as:
    0.00 → front elevation    (hero)
    0.20 → zoom-in front      (manifesto — left content)
    0.40 → three-quarter right (stats — right content, model left)
    0.65 → aerial             (services — left content)
    0.85 → three-quarter left  (contact — right content)
    1.00 → top-down           (end)
*/

/* Thin horizontal rule */
function Rule() {
  return (
    <div style={{
      width: '3rem', height: '1px',
      background: 'oklch(74% 0.007 74)', flexShrink: 0,
    }} />
  )
}

/* Gradient backdrop so text is legible over the model */
/*
  No opaque backdrop sections. Text uses a white text-shadow halo so it reads
  cleanly against the 3D model background without masking the model at all.
*/
/* Minimal shadow — just enough to lift text off the model, not a glow */
/* Stronger halo for legibility over the PBR-rendered model */
const TEXT_SHADOW = '0 1px 8px rgba(255,255,255,0.98), 0 0 24px rgba(255,255,255,0.85), 0 0 48px rgba(255,255,255,0.55)'

/* ── Section 1: Manifesto — left content, model right ──────────── */
function Manifesto() {
  const ref        = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile   = useIsMobile()

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, y: isMobile ? 20 : 0, x: isMobile ? 0 : -24 },
      {
        autoAlpha: 1, y: 0, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' },
      }
    )
  }, [isMobile])

  return (
    <section ref={ref} style={{ height: '82svh', position: 'relative' }}>
      <div ref={contentRef} style={isMobile ? {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '2rem 1.5rem 2.5rem',
        background: 'linear-gradient(to top, rgba(250,248,245,0.52) 0%, rgba(250,248,245,0.40) 12%, rgba(250,248,245,0.26) 28%, rgba(250,248,245,0.14) 46%, rgba(250,248,245,0.06) 63%, rgba(250,248,245,0.02) 80%, transparent 100%)',
        opacity: 0, zIndex: 1,
      } : {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: 'clamp(1.5rem, 7vw, 7rem)', width: 'clamp(280px, 42vw, 580px)',
        opacity: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 520,
          fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase',
          color: 'oklch(38% 0.007 74)', margin: '0 0 1.2rem',
          textShadow: TEXT_SHADOW,
        }}>Design Philosophy</p>

        <h2 style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 420,
          fontSize: 'clamp(1.5rem, 3.8vw, 4.6rem)',
          lineHeight: 1.08, letterSpacing: '-0.015em',
          color: 'oklch(8.5% 0.007 72)', margin: '0 0 1.2rem',
          textShadow: TEXT_SHADOW,
        }}>
          Designing spaces<br />
          that inspire,<br />
          <span style={{ fontWeight: 480, color: 'oklch(36% 0.007 74)' }}>
            endure, and evolve.
          </span>
        </h2>

        <p style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 560,
          fontSize: 'clamp(0.75rem, 0.95vw, 0.88rem)', lineHeight: 1.75,
          color: 'oklch(30% 0.007 74)', margin: '0 0 1.2rem', maxWidth: '38ch',
          textShadow: TEXT_SHADOW,
        }}>
          Every project begins with prolonged observation — of the site,
          its light at different hours, its relationship to everything around it.
          We compose space before we design it.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <Rule />
          <span style={{
            fontFamily: 'var(--font-sans), sans-serif', fontWeight: 520,
            fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase',
            color: 'oklch(40% 0.007 74)', textShadow: TEXT_SHADOW,
          }}>Founded 1999 · Bangalore</span>
        </div>
      </div>
    </section>
  )
}

/* ── Section 2: Stats — right content, model left ──────────────── */
function Stats() {
  const ref        = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile   = useIsMobile()

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, x: isMobile ? 0 : 24, y: isMobile ? 20 : 0 },
      {
        autoAlpha: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' },
      }
    )
  }, [])

  const items = [
    { n: '25+',  label: 'Years of Practice',   sub: 'Est. 1999, Bangalore' },
    { n: '500+', label: 'Completed Projects',  sub: 'Across South Asia' },
  ]

  return (
    <section ref={ref} style={{ height: '82svh', position: 'relative' }}>
      <div ref={contentRef} style={isMobile ? {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '2rem 1.5rem 2.5rem',
        background: 'linear-gradient(to top, rgba(250,248,245,0.52) 0%, rgba(250,248,245,0.40) 12%, rgba(250,248,245,0.26) 28%, rgba(250,248,245,0.14) 46%, rgba(250,248,245,0.06) 63%, rgba(250,248,245,0.02) 80%, transparent 100%)',
        opacity: 0, zIndex: 1,
      } : {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        right: 'clamp(1.5rem, 7vw, 7rem)',
        paddingRight: 'clamp(0rem, 1vw, 0.5rem)',
        width: 'clamp(260px, 40vw, 520px)',
        opacity: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 520,
          fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase',
          color: 'oklch(38% 0.007 74)', margin: '0 0 1.5rem',
          textShadow: TEXT_SHADOW,
        }}>Practice</p>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          borderTop: '1px solid oklch(87% 0.006 76)',
        }}>
          {items.map(({ n, label, sub }) => (
            <div key={n} style={{
              padding: 'clamp(1.2rem, 2vh, 1.8rem) 0',
              borderBottom: '1px solid oklch(87% 0.006 76)',
              paddingRight: 'clamp(0.8rem, 2vw, 1.5rem)',
            }}>
              <p style={{
                fontFamily: 'var(--font-sans), sans-serif', fontWeight: 420,
                fontSize: 'clamp(1.8rem, 3.8vw, 3.2rem)', lineHeight: 1,
                color: 'oklch(8% 0.007 72)', margin: '0 0 0.45rem',
                letterSpacing: '-0.02em', textShadow: TEXT_SHADOW,
              }}>{n}</p>
              <p style={{
                fontFamily: 'var(--font-sans), sans-serif', fontWeight: 560,
                fontSize: 'clamp(0.6rem, 0.72vw, 0.7rem)', letterSpacing: '0.05em',
                color: 'oklch(16% 0.007 72)', margin: '0 0 0.18rem',
                textShadow: TEXT_SHADOW,
              }}>{label}</p>
              <p style={{
                fontFamily: 'var(--font-sans), sans-serif', fontWeight: 460,
                fontSize: '0.6rem', letterSpacing: '0.03em',
                color: 'oklch(44% 0.007 74)', margin: 0, textShadow: TEXT_SHADOW,
              }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Section 3: Services — left content, model right ───────────── */
function Services() {
  const ref        = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile   = useIsMobile()

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, x: isMobile ? 0 : -24, y: isMobile ? 20 : 0 },
      {
        autoAlpha: 1, x: 0, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' },
      }
    )
  }, [isMobile])

  const services = [
    'Residential Design',
    'Commercial Architecture',
    'Institutional Buildings',
    'Interior Design',
    'Sustainable & Smart Systems',
  ]

  return (
    <section ref={ref} style={{ height: '82svh', position: 'relative' }}>
      <div ref={contentRef} style={isMobile ? {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '2rem 1.5rem 2.5rem',
        background: 'linear-gradient(to top, rgba(250,248,245,0.52) 0%, rgba(250,248,245,0.40) 12%, rgba(250,248,245,0.26) 28%, rgba(250,248,245,0.14) 46%, rgba(250,248,245,0.06) 63%, rgba(250,248,245,0.02) 80%, transparent 100%)',
        opacity: 0, zIndex: 1,
      } : {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: 'clamp(1.5rem, 7vw, 7rem)', width: 'clamp(280px, 42vw, 560px)',
        opacity: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' }}>
          <Rule />
          <p style={{
            fontFamily: 'var(--font-sans), sans-serif', fontWeight: 520,
            fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase',
            color: 'oklch(38% 0.007 74)', margin: 0, textShadow: TEXT_SHADOW,
          }}>Services</p>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 420,
          fontSize: 'clamp(1.5rem, 3vw, 3.4rem)',
          lineHeight: 1.1, letterSpacing: '-0.01em',
          color: 'oklch(8.5% 0.007 72)', margin: '0 0 2.5rem',
          textShadow: TEXT_SHADOW,
        }}>
          Full-spectrum<br />architecture.
        </h2>

        <div style={{ borderTop: '1px solid oklch(87% 0.006 76)' }}>
          {services.map((s, i) => (
            <div key={s} style={{
              padding: 'clamp(0.8rem, 1.4vh, 1.1rem) 0',
              borderBottom: '1px solid oklch(87% 0.006 76)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{
                fontFamily: 'var(--font-sans), sans-serif', fontWeight: 500,
                fontSize: 'clamp(0.72rem, 0.95vw, 0.88rem)',
                color: 'oklch(16% 0.007 72)', margin: 0, letterSpacing: '0.01em',
                textShadow: TEXT_SHADOW,
              }}>{s}</p>
              <span style={{
                fontFamily: 'var(--font-sans), sans-serif', fontWeight: 460,
                fontSize: '0.52rem', letterSpacing: '0.3em',
                color: 'oklch(52% 0.006 74)', textShadow: TEXT_SHADOW,
              }}>0{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Section 4: Contact — right content ─────────────────────────── */
function Contact() {
  const ref        = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile   = useIsMobile()

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, x: isMobile ? 0 : 24, y: isMobile ? 20 : 0 },
      {
        autoAlpha: 1, x: 0, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' },
      }
    )
  }, [isMobile])

  return (
    <section ref={ref} style={{ height: '82svh', position: 'relative' }}>
      <div ref={contentRef} style={isMobile ? {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '2rem 1.5rem 2.5rem',
        background: 'linear-gradient(to top, rgba(250,248,245,0.52) 0%, rgba(250,248,245,0.40) 12%, rgba(250,248,245,0.26) 28%, rgba(250,248,245,0.14) 46%, rgba(250,248,245,0.06) 63%, rgba(250,248,245,0.02) 80%, transparent 100%)',
        opacity: 0, zIndex: 1,
      } : {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        right: 'clamp(1.5rem, 7vw, 7rem)', width: 'clamp(260px, 40vw, 520px)',
        paddingRight: 'clamp(0rem, 1vw, 0.5rem)',
        opacity: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 520,
          fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase',
          color: 'oklch(38% 0.007 74)', margin: '0 0 1.2rem',
          textShadow: TEXT_SHADOW,
        }}>Studio</p>

        <h2 style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 420,
          fontSize: 'clamp(1.7rem, 3.8vw, 4.2rem)',
          lineHeight: 1.06, letterSpacing: '-0.015em',
          color: 'oklch(8.5% 0.007 72)', margin: '0 0 2rem',
          textShadow: TEXT_SHADOW,
        }}>
          Begin a<br />collaboration.
        </h2>

        <Link href="/about#contact" style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 420,
          fontSize: '0.62rem', letterSpacing: '0.38em', textTransform: 'uppercase',
          color: 'oklch(22% 0.007 72)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '1rem',
          border: '1px solid oklch(32% 0.007 72)',
          padding: '0.9rem 1.6rem',
          background: 'rgba(250,248,245,0.96)',
        }}>
          Begin an enquiry
          <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
            <line x1="0" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
            <polyline points="10,1 13,3.5 10,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          </svg>
        </Link>
      </div>
    </section>
  )
}

export function StudioIntro() {
  return (
    <>
      <Manifesto />
      <Stats />
      <Services />
      <Contact />
    </>
  )
}
