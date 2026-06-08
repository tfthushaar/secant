'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useNavigate } from '@/components/TransitionBlink'
import { CATEGORY_CONFIG } from '@/lib/projects'

gsap.registerPlugin(ScrollTrigger)

const INK = 'oklch(5% 0 0)'

function Rule() {
  return <div style={{ width: '3rem', height: '1px', background: INK, flexShrink: 0 }} />
}

/* No background, no box — only backdrop-filter behind each span.
   Blurs model lines behind the text without any visible rectangle.  */
const IB: React.CSSProperties = {
  backdropFilter:       'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
} as React.CSSProperties

/* ── Section 1: Manifesto ──────────────────────────────────────── */
function Manifesto() {
  const ref        = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile   = useIsMobile()

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, y: isMobile ? 20 : 0, x: isMobile ? 0 : -24 },
      { autoAlpha: 1, y: 0, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' } }
    )
  }, [isMobile])

  return (
    <section ref={ref} style={{ height: '82svh', position: 'relative' }}>
      <div ref={contentRef} style={isMobile ? {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '2rem 1.5rem 2.5rem',
        background: 'rgba(250,248,245,0.97)',
        opacity: 0, zIndex: 1,
      } : {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: 'clamp(1.5rem, 7vw, 7rem)', width: 'clamp(280px, 42vw, 580px)',
        opacity: 0,
      }}>
        <p style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase', color: INK, margin: '0 0 1.2rem' }}>
          <span style={IB}>Design Philosophy</span>
        </p>

        <h2 style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 650, fontSize: 'clamp(1.5rem, 3.8vw, 4.6rem)', lineHeight: 1.08, letterSpacing: '-0.015em', color: INK, margin: '0 0 1.2rem' }}>
          <span style={IB}>
            Designing spaces that inspire,<br />
            endure, and evolve.
          </span>
        </h2>

        <p style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: 'clamp(0.75rem, 0.95vw, 0.88rem)', lineHeight: 1.75, color: INK, margin: '0 0 1.2rem', maxWidth: '38ch' }}>
          <span style={IB}>
            Every project begins with prolonged observation — of the site,
            its light at different hours, its relationship to everything around it.
            We compose space before we design it.
          </span>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <Rule />
          <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: INK }}>
            <span style={IB}>Founded 1999 · Bangalore</span>
          </span>
        </div>
      </div>
    </section>
  )
}

/* ── Section 2: Stats ──────────────────────────────────────────── */
function Stats() {
  const ref        = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile   = useIsMobile()

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, x: isMobile ? 0 : 24, y: isMobile ? 20 : 0 },
      { autoAlpha: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' } }
    )
  }, [])

  const items = [
    { n: '25+',  label: 'Years of Practice',  sub: 'Est. 1999, Bangalore' },
    { n: '500+', label: 'Completed Projects', sub: 'Across South Asia' },
  ]

  return (
    <section ref={ref} style={{ height: '82svh', position: 'relative' }}>
      <div ref={contentRef} style={isMobile ? {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '2rem 1.5rem 2.5rem',
        background: 'rgba(250,248,245,0.97)',
        opacity: 0, zIndex: 1,
      } : {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        right: 'clamp(1.5rem, 7vw, 7rem)',
        width: 'clamp(260px, 40vw, 520px)',
        opacity: 0,
      }}>
        <p style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase', color: INK, margin: '0 0 1.5rem' }}>
          <span style={IB}>Practice</span>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${INK}` }}>
          {items.map(({ n, label, sub }) => (
            <div key={n} style={{ padding: 'clamp(1.2rem, 2vh, 1.8rem) 0', borderBottom: `1px solid ${INK}`, paddingRight: 'clamp(0.8rem, 2vw, 1.5rem)' }}>
              <p style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 'clamp(1.8rem, 3.8vw, 3.2rem)', lineHeight: 1, color: INK, margin: '0 0 0.45rem', letterSpacing: '-0.02em' }}>
                <span style={IB}>{n}</span>
              </p>
              <p style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: 'clamp(0.6rem, 0.72vw, 0.7rem)', letterSpacing: '0.05em', color: INK, margin: '0 0 0.18rem' }}>
                <span style={IB}>{label}</span>
              </p>
              <p style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.03em', color: INK, margin: 0 }}>
                <span style={IB}>{sub}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Section 3: Services ───────────────────────────────────────── */
function Services() {
  const ref        = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile   = useIsMobile()
  const { navigate } = useNavigate()

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, x: isMobile ? 0 : -24, y: isMobile ? 20 : 0 },
      { autoAlpha: 1, x: 0, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' } }
    )
  }, [isMobile])

  const serviceLinks = CATEGORY_CONFIG.map(c => ({ label: c.label, slug: c.slug }))

  return (
    <section ref={ref} style={{ height: '82svh', position: 'relative' }}>
      <div ref={contentRef} style={isMobile ? {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '2rem 1.5rem 2.5rem',
        background: 'rgba(250,248,245,0.97)',
        opacity: 0, zIndex: 1,
      } : {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: 'clamp(1.5rem, 7vw, 7rem)', width: 'clamp(280px, 42vw, 560px)',
        opacity: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' }}>
          <Rule />
          <p style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase', color: INK, margin: 0 }}>
            <span style={IB}>Services</span>
          </p>
        </div>

        <h2 style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 650, fontSize: 'clamp(1.5rem, 3vw, 3.4rem)', lineHeight: 1.1, letterSpacing: '-0.01em', color: INK, margin: '0 0 1.5rem' }}>
          <span style={IB}>Full-spectrum<br />architecture.</span>
        </h2>

        <div style={{ borderTop: `1px solid ${INK}` }}>
          {serviceLinks.map(({ label, slug }, i) => (
            <div key={label} onClick={() => navigate(`/work/${slug}`)}
              style={{ padding: 'clamp(0.8rem, 1.4vh, 1.1rem) 0', borderBottom: `1px solid ${INK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <p style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 650, fontSize: 'clamp(0.72rem, 0.95vw, 0.88rem)', color: INK, margin: 0, letterSpacing: '0.01em' }}>
                <span style={IB}>{label}</span>
              </p>
              <span style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: '0.52rem', letterSpacing: '0.3em', color: INK }}>
                <span style={IB}>0{i + 1}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Section 4: Contact ────────────────────────────────────────── */
function Contact() {
  const ref        = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isMobile   = useIsMobile()

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, x: isMobile ? 0 : 24, y: isMobile ? 20 : 0 },
      { autoAlpha: 1, x: 0, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' } }
    )
  }, [isMobile])

  return (
    <section ref={ref} style={{ height: '82svh', position: 'relative' }}>
      <div ref={contentRef} style={isMobile ? {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '2rem 1.5rem 2.5rem',
        background: 'rgba(250,248,245,0.97)',
        opacity: 0, zIndex: 1,
      } : {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        right: 'clamp(1.5rem, 7vw, 7rem)', width: 'clamp(260px, 40vw, 520px)',
        opacity: 0,
      }}>
        <p style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase', color: INK, margin: '0 0 1.2rem' }}>
          <span style={IB}>Studio</span>
        </p>

        <h2 style={{ fontFamily: 'var(--font-sans), sans-serif', fontWeight: 650, fontSize: 'clamp(1.7rem, 3.8vw, 4.2rem)', lineHeight: 1.06, letterSpacing: '-0.015em', color: INK, margin: '0 0 2rem' }}>
          <span style={IB}>Begin a<br />collaboration.</span>
        </h2>

        <Link href="/about#contact" style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 650,
          fontSize: '0.62rem', letterSpacing: '0.38em', textTransform: 'uppercase',
          color: INK, textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '1rem',
          border: `1px solid ${INK}`,
          padding: '0.9rem 1.6rem',
          background: 'rgba(250,248,245,0.96)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
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
