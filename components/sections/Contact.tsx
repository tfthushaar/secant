'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const bodyRef    = useRef<HTMLDivElement>(null)
  const footerRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    })

    tl
      .fromTo(headingRef.current,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 1.0, ease: 'power3.out' },
        0
      )
      .fromTo(bodyRef.current,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' },
        0.25
      )
      .fromTo(footerRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.8, ease: 'power2.out' },
        0.5
      )

    return () => { tl.kill() }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative w-full flex flex-col"
      style={{
        minHeight: '90vh',
        paddingTop:    'clamp(8rem, 16vh, 14rem)',
        paddingBottom: 'clamp(5rem, 10vh, 8rem)',
        background: 'oklch(97.2% 0.007 80)',
      }}
    >
      {/* Thin top line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'oklch(84% 0.007 78)' }}
      />

      <div className="max-w-[1400px] mx-auto px-7 md:px-14 lg:px-20 flex-1 flex flex-col justify-between">

        {/* Main content */}
        <div>
          {/* Label */}
          <div
            className="font-mono text-[8px] tracking-[0.45em] uppercase mb-14"
            style={{ color: 'oklch(55% 0.007 75)' }}
          >
            Begin a Project
          </div>

          {/* Heading */}
          <div ref={headingRef}>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(3rem, 9vw, 9.5rem)',
                fontWeight: 400,
                lineHeight: 1.0,
                color: 'oklch(7.8% 0.009 72)',
                letterSpacing: '-0.025em',
              }}
            >
              Let&apos;s compose
              <br />
              <em style={{ fontStyle: 'italic' }}>something</em>
              <br />
              together.
            </h2>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="mt-14 flex flex-col md:flex-row items-start gap-12">
            <div>
              <div
                className="font-mono text-[8px] tracking-[0.35em] uppercase mb-3"
                style={{ color: 'oklch(65% 0.007 75)' }}
              >
                Write to us
              </div>
              <a
                href="mailto:contact@secant.studio"
                className="font-display transition-opacity duration-300 hover:opacity-50"
                style={{
                  fontSize: 'clamp(1.1rem, 2.5vw, 2.2rem)',
                  fontWeight: 400,
                  color: 'oklch(7.8% 0.009 72)',
                  letterSpacing: '-0.01em',
                }}
              >
                contact@secant.studio
              </a>
            </div>

            <div>
              <div
                className="font-mono text-[8px] tracking-[0.35em] uppercase mb-3"
                style={{ color: 'oklch(65% 0.007 75)' }}
              >
                Visit
              </div>
              <address
                className="font-body not-italic"
                style={{
                  fontSize: 'clamp(0.85rem, 1.1vw, 1rem)',
                  lineHeight: 1.7,
                  color: 'oklch(44% 0.008 75)',
                  fontWeight: 300,
                }}
              >
                SECANT Architecture Studio
                <br />
                Indiranagar, Bengaluru
                <br />
                Karnataka 560 038, India
              </address>
            </div>

            <div>
              <div
                className="font-mono text-[8px] tracking-[0.35em] uppercase mb-3"
                style={{ color: 'oklch(65% 0.007 75)' }}
              >
                Commission status
              </div>
              <p
                className="font-body"
                style={{
                  fontSize: 'clamp(0.85rem, 1.1vw, 1rem)',
                  lineHeight: 1.7,
                  color: 'oklch(44% 0.008 75)',
                  fontWeight: 300,
                }}
              >
                We are accepting enquiries for
                <br />
                projects commencing 2025.
              </p>
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <div
          ref={footerRef}
          className="mt-24 pt-7 flex flex-wrap items-center justify-between gap-6"
          style={{ borderTop: '1px solid oklch(84% 0.007 78)' }}
        >
          <span
            className="font-mono text-[8px] tracking-[0.35em] uppercase"
            style={{ color: 'oklch(65% 0.007 75)' }}
          >
            SECANT Architecture Studio
          </span>
          <span
            className="font-mono text-[8px] tracking-[0.35em] uppercase"
            style={{ color: 'oklch(75% 0.007 75)' }}
          >
            Est. 2003 · Bengaluru · India
          </span>
          <span
            className="font-mono text-[8px] tracking-[0.35em] uppercase"
            style={{ color: 'oklch(75% 0.007 75)' }}
          >
            © 2024 SECANT
          </span>
        </div>

      </div>
    </section>
  )
}
