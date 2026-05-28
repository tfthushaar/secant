'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null)
  const quoteRef   = useRef<HTMLDivElement>(null)
  const bodyRef    = useRef<HTMLDivElement>(null)
  const linkRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 68%',
        toggleActions: 'play none none none',
      },
    })

    tl
      .fromTo(quoteRef.current,
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0
      )
      .fromTo(bodyRef.current,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.3
      )
      .fromTo(linkRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, 0.6
      )

    return () => { tl.kill() }
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(6rem,14vh,11rem) clamp(1.5rem,8vw,7rem)',
        background: 'oklch(97.2% 0.006 78)',
        position: 'relative',
      }}
    >
      {/* Thin top border */}
      <div
        style={{
          position: 'absolute', top: 0, left: 'clamp(1.5rem,8vw,7rem)', right: 'clamp(1.5rem,8vw,7rem)',
          height: '1px', background: 'oklch(86% 0.006 76)',
        }}
      />

      <div style={{ maxWidth: '1200px', width: '100%' }}>

        {/* Manifesto quote */}
        <div ref={quoteRef}>
          <p
            style={{
              fontFamily: 'var(--font-jost), sans-serif',
              fontWeight: 100,
              fontSize: 'clamp(2.4rem, 6.5vw, 7rem)',
              lineHeight: 1.06,
              letterSpacing: '-0.01em',
              color: 'oklch(8.5% 0.007 72)',
              maxWidth: '16em',
            }}
          >
            Architecture is not
            <br />the art of enclosure.
            <br />
            <span style={{ fontWeight: 200, color: 'oklch(46% 0.007 74)' }}>
              It is the art of
              <br />revealing space.
            </span>
          </p>
        </div>

        {/* Body + link */}
        <div
          style={{
            marginTop: 'clamp(3rem,6vh,5rem)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(2rem,5vw,6rem)',
            alignItems: 'end',
          }}
        >
          <p
            ref={bodyRef}
            style={{
              fontFamily: 'var(--font-jost), sans-serif',
              fontWeight: 300,
              fontSize: 'clamp(0.82rem, 1.05vw, 0.97rem)',
              lineHeight: 1.85,
              color: 'oklch(46% 0.007 74)',
              maxWidth: '42ch',
            }}
          >
            Every project begins with prolonged observation — of the site, its light at different
            hours, its relationship to everything around it. We compose space before we design it.
          </p>

          <div
            ref={linkRef}
            style={{ textAlign: 'right' }}
          >
            <a
              href="/work"
              style={{
                fontFamily: 'var(--font-jost), sans-serif',
                fontWeight: 200,
                fontSize: '0.62rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'oklch(46% 0.007 74)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1.2rem',
                transition: 'opacity 0.25s',
              }}
              className="hover:opacity-40"
            >
              <span style={{ display: 'block', width: '3rem', height: '1px', background: 'oklch(84% 0.006 76)' }} />
              View selected work
            </a>
          </div>
        </div>

        {/* Stat strip */}
        <div
          style={{
            marginTop: 'clamp(4rem, 8vh, 7rem)',
            paddingTop: 'clamp(2rem, 4vh, 3rem)',
            borderTop: '1px solid oklch(88% 0.006 76)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
          }}
        >
          {[
            { n: '38', label: 'Completed projects' },
            { n: '21', label: 'Years in practice' },
            { n: 'BLR', label: 'Bengaluru studio' },
          ].map(({ n, label }) => (
            <div key={label}>
              <div
                style={{
                  fontFamily: 'var(--font-jost), sans-serif',
                  fontWeight: 100,
                  fontSize: 'clamp(2rem, 4vw, 3.8rem)',
                  lineHeight: 1,
                  color: 'oklch(8.5% 0.007 72)',
                }}
              >
                {n}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-jost), sans-serif',
                  fontWeight: 300,
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                  color: 'oklch(60% 0.006 74)',
                  marginTop: '0.4rem',
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
