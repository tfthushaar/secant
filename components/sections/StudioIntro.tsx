'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
const TEXT_SHADOW = '0 0 80px rgba(255,255,255,1), 0 0 50px rgba(255,255,255,1), 0 0 25px rgba(255,255,255,0.98), 0 0 8px rgba(255,255,255,0.95)'

/* ── Section 1: Manifesto — left content, model right ──────────── */
function Manifesto() {
  const ref     = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, x: -24 },
      {
        autoAlpha: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' },
      }
    )
  }, [])

  return (
    <section ref={ref} style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div ref={contentRef} style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: 'clamp(1.5rem, 7vw, 7rem)', width: 'clamp(280px, 42vw, 580px)',
        opacity: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 300,
          fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase',
          color: 'oklch(50% 0.007 74)', margin: '0 0 2rem',
          textShadow: TEXT_SHADOW,
        }}>Design Philosophy</p>

        <h2 style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 200,
          fontSize: 'clamp(2rem, 4.5vw, 5.5rem)',
          lineHeight: 1.08, letterSpacing: '-0.015em',
          color: 'oklch(8.5% 0.007 72)', margin: '0 0 2.5rem',
          textShadow: TEXT_SHADOW,
        }}>
          Designing spaces<br />
          that inspire,<br />
          <span style={{ fontWeight: 300, color: 'oklch(44% 0.007 74)' }}>
            endure, and evolve.
          </span>
        </h2>

        <p style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 350,
          fontSize: 'clamp(0.85rem, 1.1vw, 1rem)', lineHeight: 1.85,
          color: 'oklch(42% 0.007 74)', margin: '0 0 2.5rem', maxWidth: '38ch',
          textShadow: TEXT_SHADOW,
        }}>
          Every project begins with prolonged observation — of the site,
          its light at different hours, its relationship to everything around it.
          We compose space before we design it.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <Rule />
          <span style={{
            fontFamily: 'var(--font-sans), sans-serif', fontWeight: 300,
            fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase',
            color: 'oklch(52% 0.007 74)', textShadow: TEXT_SHADOW,
          }}>Founded 1999 · Bangalore</span>
        </div>
      </div>
    </section>
  )
}

/* ── Section 2: Stats — right content, model left ──────────────── */
function Stats() {
  const ref     = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, x: 24 },
      {
        autoAlpha: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' },
      }
    )
  }, [])

  const items = [
    { n: '25+', label: 'Years of Practice', sub: 'Est. 1999, Bangalore' },
    { n: '38',  label: 'Completed Projects', sub: 'Across South Asia' },
    { n: '6',   label: 'Project Typologies', sub: 'Residential to Institutional' },
    { n: '3',   label: 'Design Partners', sub: 'Integrated studio model' },
  ]

  return (
    <section ref={ref} style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Right padding ensures content doesn't reach MENU button area (top-right) */}
      <div ref={contentRef} style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        right: 'clamp(1.5rem, 7vw, 7rem)',
        paddingRight: 'clamp(0rem, 1vw, 0.5rem)',  /* extra clearance from MENU */
        width: 'clamp(260px, 40vw, 520px)',
        opacity: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 300,
          fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase',
          color: 'oklch(50% 0.007 74)', margin: '0 0 2.5rem',
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
                fontFamily: 'var(--font-sans), sans-serif', fontWeight: 200,
                fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)', lineHeight: 1,
                color: 'oklch(8% 0.007 72)', margin: '0 0 0.45rem',
                letterSpacing: '-0.02em', textShadow: TEXT_SHADOW,
              }}>{n}</p>
              <p style={{
                fontFamily: 'var(--font-sans), sans-serif', fontWeight: 450,
                fontSize: 'clamp(0.7rem, 0.85vw, 0.82rem)', letterSpacing: '0.05em',
                color: 'oklch(22% 0.007 72)', margin: '0 0 0.18rem',
                textShadow: TEXT_SHADOW,
              }}>{label}</p>
              <p style={{
                fontFamily: 'var(--font-sans), sans-serif', fontWeight: 300,
                fontSize: '0.6rem', letterSpacing: '0.03em',
                color: 'oklch(56% 0.007 74)', margin: 0, textShadow: TEXT_SHADOW,
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
  const ref     = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, x: -24 },
      {
        autoAlpha: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' },
      }
    )
  }, [])

  const services = [
    'Residential Design',
    'Commercial Architecture',
    'Institutional Buildings',
    'Interior Design',
    'Sustainable & Smart Systems',
  ]

  return (
    <section ref={ref} style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>

      <div ref={contentRef} style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: 'clamp(1.5rem, 7vw, 7rem)', width: 'clamp(280px, 42vw, 560px)',
        opacity: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '2.5rem' }}>
          <Rule />
          <p style={{
            fontFamily: 'var(--font-sans), sans-serif', fontWeight: 300,
            fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase',
            color: 'oklch(50% 0.007 74)', margin: 0,
          }}>Services</p>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 200,
          fontSize: 'clamp(1.8rem, 3.5vw, 4rem)',
          lineHeight: 1.1, letterSpacing: '-0.01em',
          color: 'oklch(8.5% 0.007 72)', margin: '0 0 2.5rem',
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
                fontFamily: 'var(--font-sans), sans-serif', fontWeight: 350,
                fontSize: 'clamp(0.82rem, 1.1vw, 1rem)',
                color: 'oklch(24% 0.007 72)', margin: 0, letterSpacing: '0.01em',
              }}>{s}</p>
              <span style={{
                fontFamily: 'var(--font-sans), sans-serif', fontWeight: 300,
                fontSize: '0.52rem', letterSpacing: '0.3em',
                color: 'oklch(64% 0.006 74)',
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
  const ref     = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current,
      { autoAlpha: 0, x: 24 },
      {
        autoAlpha: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 62%', toggleActions: 'play none none none' },
      }
    )
  }, [])

  return (
    <section ref={ref} style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div ref={contentRef} style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        right: 'clamp(1.5rem, 7vw, 7rem)', width: 'clamp(260px, 40vw, 520px)',
        paddingRight: 'clamp(0rem, 1vw, 0.5rem)',
        opacity: 0,
      }}>
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 300,
          fontSize: '0.6rem', letterSpacing: '0.45em', textTransform: 'uppercase',
          color: 'oklch(50% 0.007 74)', margin: '0 0 2rem',
        }}>Studio</p>

        <h2 style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 200,
          fontSize: 'clamp(2rem, 4.5vw, 5rem)',
          lineHeight: 1.06, letterSpacing: '-0.015em',
          color: 'oklch(8.5% 0.007 72)', margin: '0 0 2.5rem',
        }}>
          Begin a<br />collaboration.
        </h2>

        <p style={{
          fontFamily: 'var(--font-sans), sans-serif', fontWeight: 350,
          fontSize: 'clamp(0.82rem, 1vw, 0.95rem)', lineHeight: 1.9,
          color: 'oklch(42% 0.007 74)', margin: '0 0 2.5rem', maxWidth: '36ch',
        }}>
          535, 3rd Main, &#39;A&#39; Block (FF)<br />
          Rajajinagar 2nd Stage<br />
          Bangalore 560010, Karnataka
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/work" style={{
            fontFamily: 'var(--font-sans), sans-serif', fontWeight: 300,
            fontSize: '0.62rem', letterSpacing: '0.38em', textTransform: 'uppercase',
            color: 'oklch(32% 0.007 72)', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '1rem',
            borderBottom: '1px solid oklch(82% 0.006 76)', paddingBottom: '0.5rem',
            width: 'fit-content',
          }}>
            View selected work
            <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
              <line x1="0" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
              <polyline points="10,1 13,3.5 10,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
            </svg>
          </Link>
          <a href="https://secant.in" style={{
            fontFamily: 'var(--font-sans), sans-serif', fontWeight: 300,
            fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase',
            color: 'oklch(56% 0.007 74)', textDecoration: 'none',
          }}>secant.in</a>
        </div>
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
