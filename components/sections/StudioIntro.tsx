'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const SERVICES = [
  {
    title: 'Residential',
    body: 'Apartments, villas, and private residences — designed around the lives within.',
  },
  {
    title: 'Commercial',
    body: 'Corporate campuses and commercial buildings that project a coherent identity.',
  },
  {
    title: 'Institutional',
    body: 'Schools and public buildings that shape how communities learn and gather.',
  },
  {
    title: 'Interiors',
    body: 'Interior spaces consistent in architectural language and purposeful in detail.',
  },
  {
    title: 'Sustainable Design',
    body: 'Passive cooling, green roofs, and smart systems embedded from concept stage.',
  },
]

function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.fromTo(el,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1, y: 0,
        duration: 1.0, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 75%', toggleActions: 'play none none none' },
      }
    )
  }, [ref])
}

/* ─────────────────────────────────── Section A — Manifesto ────── */
function Manifesto() {
  const sectionRef  = useRef<HTMLElement>(null)
  const quoteRef    = useRef<HTMLDivElement>(null)
  const bodyRef     = useRef<HTMLDivElement>(null)
  const statsRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = [quoteRef.current, bodyRef.current, statsRef.current].filter(Boolean)
    els.forEach((el, i) => {
      if (!el) return
      gsap.fromTo(el,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1, y: 0,
          duration: 1.0, ease: 'power3.out',
          delay: i * 0.18,
          scrollTrigger: { trigger: sectionRef.current!, start: 'top 65%', toggleActions: 'play none none none' },
        }
      )
    })
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        padding: 'clamp(6rem,14vh,12rem) clamp(1.5rem,8vw,8rem)',
        background: 'rgba(255,255,255,0.96)',
        position: 'relative',
      }}
    >
      {/* Thin top rule */}
      <div style={{
        position: 'absolute', top: 0,
        left: 'clamp(1.5rem,8vw,8rem)', right: 'clamp(1.5rem,8vw,8rem)',
        height: '1px', background: 'oklch(88% 0.006 76)',
      }} />

      <div style={{ maxWidth: '1100px', width: '100%' }}>

        {/* Quote */}
        <div ref={quoteRef} style={{ opacity: 0 }}>
          <p style={{
            fontFamily: 'var(--font-sans), sans-serif',
            fontWeight: 100,
            fontSize: 'clamp(2.6rem, 7vw, 7.5rem)',
            lineHeight: 1.06, letterSpacing: '-0.015em',
            color: 'oklch(8.5% 0.007 72)',
            maxWidth: '18em', margin: 0,
          }}>
            Designing spaces that
            <br />inspire, endure,
            <br />
            <span style={{ fontWeight: 200, color: 'oklch(48% 0.007 74)' }}>
              and evolve.
            </span>
          </p>
        </div>

        {/* Body + CTA */}
        <div
          ref={bodyRef}
          style={{
            opacity: 0, marginTop: 'clamp(3rem,6vh,5rem)',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(2rem,5vw,6rem)', alignItems: 'end',
          }}
        >
          <p style={{
            fontFamily: 'var(--font-sans), sans-serif',
            fontWeight: 300, fontSize: 'clamp(0.82rem,1.05vw,0.98rem)',
            lineHeight: 1.9, color: 'oklch(46% 0.007 74)',
            maxWidth: '44ch', margin: 0,
          }}>
            Founded in 1999, Secant Architects LLP has shaped the built
            environment across South Asia for over two decades — delivering
            projects that balance aesthetic ambition with functional rigour
            and deep environmental responsibility.
          </p>

          <div style={{ textAlign: 'right' }}>
            <Link href="/work" style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 200, fontSize: '0.62rem',
              letterSpacing: '0.4em', textTransform: 'uppercase',
              color: 'oklch(46% 0.007 74)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '1.2rem',
            }}>
              <span style={{ display: 'block', width: '3rem', height: '1px', background: 'oklch(84% 0.006 76)' }} />
              View selected work
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div
          ref={statsRef}
          style={{
            opacity: 0,
            marginTop: 'clamp(4rem,8vh,7rem)',
            paddingTop: 'clamp(2rem,4vh,3rem)',
            borderTop: '1px solid oklch(90% 0.006 76)',
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '2rem',
          }}
        >
          {[
            { n: '25+', label: 'Years of practice' },
            { n: '38',  label: 'Completed projects' },
            { n: '6',   label: 'Project typologies' },
            { n: 'BLR', label: 'Bangalore studio' },
          ].map(({ n, label }) => (
            <div key={label}>
              <div style={{
                fontFamily: 'var(--font-sans), sans-serif',
                fontWeight: 100, fontSize: 'clamp(2rem,4vw,3.8rem)',
                lineHeight: 1, color: 'oklch(8.5% 0.007 72)',
              }}>{n}</div>
              <div style={{
                fontFamily: 'var(--font-sans), sans-serif',
                fontWeight: 300, fontSize: '0.72rem',
                letterSpacing: '0.08em', color: 'oklch(60% 0.006 74)',
                marginTop: '0.45rem',
              }}>{label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ─────────────────────────────────── Section B — Services ─────── */
function Services() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef   = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    [titleRef.current, gridRef.current].forEach((el, i) => {
      if (!el) return
      gsap.fromTo(el,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: i * 0.2,
          scrollTrigger: { trigger: sectionRef.current!, start: 'top 68%', toggleActions: 'play none none none' },
        }
      )
    })
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight: '85vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(5rem,12vh,10rem) clamp(1.5rem,8vw,8rem)',
        background: '#ffffff',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute', top: 0,
        left: 'clamp(1.5rem,8vw,8rem)', right: 'clamp(1.5rem,8vw,8rem)',
        height: '1px', background: 'oklch(88% 0.006 76)',
      }} />

      <div ref={titleRef} style={{ opacity: 0, marginBottom: 'clamp(3rem,6vh,5rem)' }}>
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 300, fontSize: '0.62rem',
          letterSpacing: '0.42em', textTransform: 'uppercase',
          color: 'oklch(52% 0.007 74)', margin: '0 0 1.2rem',
        }}>Practice</p>
        <h2 style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 100,
          fontSize: 'clamp(2rem, 5vw, 5rem)',
          lineHeight: 1.1, letterSpacing: '-0.01em',
          color: 'oklch(8.5% 0.007 72)', margin: 0,
        }}>
          Full-spectrum architecture.
        </h2>
      </div>

      <div
        ref={gridRef}
        style={{
          opacity: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0',
          borderTop: '1px solid oklch(90% 0.006 76)',
        }}
      >
        {SERVICES.map(({ title, body }) => (
          <div
            key={title}
            style={{
              padding: 'clamp(1.6rem,3vh,2.5rem) 0 clamp(1.6rem,3vh,2.5rem) 0',
              borderBottom: '1px solid oklch(90% 0.006 76)',
              paddingRight: 'clamp(1rem,3vw,2rem)',
            }}
          >
            <p style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 400, fontSize: '0.78rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'oklch(24% 0.007 72)', margin: '0 0 0.7rem',
            }}>{title}</p>
            <p style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 300, fontSize: '0.82rem',
              lineHeight: 1.75, color: 'oklch(54% 0.007 74)', margin: 0,
            }}>{body}</p>
          </div>
        ))}
      </div>

    </section>
  )
}

/* ─────────────────────────────────── Section C — Contact/CTA ─── */
function ContactCTA() {
  const ref = useRef<HTMLElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!innerRef.current) return
    gsap.fromTo(innerRef.current,
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current!, start: 'top 70%', toggleActions: 'play none none none' },
      }
    )
  }, [])

  return (
    <section
      ref={ref}
      style={{
        minHeight: '70vh',
        display: 'flex', alignItems: 'center',
        padding: 'clamp(5rem,12vh,10rem) clamp(1.5rem,8vw,8rem)',
        background: 'rgba(255,255,255,0.97)',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute', top: 0,
        left: 'clamp(1.5rem,8vw,8rem)', right: 'clamp(1.5rem,8vw,8rem)',
        height: '1px', background: 'oklch(88% 0.006 76)',
      }} />

      <div ref={innerRef} style={{ opacity: 0, width: '100%', maxWidth: '1100px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', flexWrap: 'wrap', gap: '3rem',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 300, fontSize: '0.62rem',
              letterSpacing: '0.42em', textTransform: 'uppercase',
              color: 'oklch(52% 0.007 74)', margin: '0 0 1.5rem',
            }}>Studio</p>
            <p style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 100,
              fontSize: 'clamp(2rem, 5vw, 4.5rem)',
              lineHeight: 1.1, letterSpacing: '-0.01em',
              color: 'oklch(8.5% 0.007 72)', margin: '0 0 2rem',
            }}>
              Begin a<br />collaboration.
            </p>
            <p style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 300, fontSize: '0.78rem',
              lineHeight: 1.9, color: 'oklch(52% 0.007 74)', margin: 0,
              maxWidth: '40ch',
            }}>
              535, 3rd Main, &#39;A&#39; Block (FF)<br />
              Rajajinagar 2nd Stage<br />
              Bangalore 560010, Karnataka, India
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'flex-end' }}>
            <Link href="/work" style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 200, fontSize: '0.62rem',
              letterSpacing: '0.4em', textTransform: 'uppercase',
              color: 'oklch(46% 0.007 74)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '1.2rem',
              borderBottom: '1px solid oklch(84% 0.006 76)', paddingBottom: '0.5rem',
            }}>
              Explore our work
              <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
                <line x1="0" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
                <polyline points="10,1 13,3.5 10,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
              </svg>
            </Link>
            <a href="https://secant.in" style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 300, fontSize: '0.62rem',
              letterSpacing: '0.35em', textTransform: 'uppercase',
              color: 'oklch(56% 0.007 74)', textDecoration: 'none',
            }}>
              secant.in
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────── Export ─────────────────────── */
export function StudioIntro() {
  return (
    <>
      <Manifesto />
      <Services />
      <ContactCTA />
    </>
  )
}
