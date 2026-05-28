'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function Studio() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef    = useRef<HTMLDivElement>(null)
  const imageRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    if (textRef.current) {
      gsap.fromTo(textRef.current,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1, y: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: textRef.current,
            start: 'top 78%',
            toggleActions: 'play none none none',
          },
        }
      )
    }

    if (imageRef.current) {
      gsap.fromTo(imageRef.current,
        { autoAlpha: 0, x: 30 },
        {
          autoAlpha: 1, x: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: imageRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      )
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="studio"
      className="relative w-full"
      style={{
        paddingTop:    'clamp(7rem, 14vh, 12rem)',
        paddingBottom: 'clamp(7rem, 14vh, 12rem)',
        background: 'oklch(93.5% 0.011 78)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-7 md:px-14 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* Text column */}
          <div ref={textRef}>
            <div
              className="font-mono text-[8px] tracking-[0.45em] uppercase mb-10"
              style={{ color: 'oklch(55% 0.007 75)' }}
            >
              Studio
            </div>

            <h2
              className="font-display mb-10"
              style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 4.4rem)',
                fontWeight: 400,
                lineHeight: 1.07,
                color: 'oklch(7.8% 0.009 72)',
                letterSpacing: '-0.02em',
              }}
            >
              Architecture
              <br />
              as discovery.
            </h2>

            <div
              className="font-body space-y-5"
              style={{
                maxWidth: '44ch',
                fontSize: 'clamp(0.85rem, 1.1vw, 1rem)',
                lineHeight: 1.85,
                color: 'oklch(44% 0.008 75)',
                fontWeight: 300,
              }}
            >
              <p>
                SECANT was founded in 2003 in Bengaluru with a singular conviction:
                that architecture is not a service rendered, but a conversation conducted.
                Between client and site. Between material and light. Between what is drawn
                and what is built.
              </p>
              <p>
                Our studio works across residential, commercial, and institutional typologies.
                We begin every project with prolonged observation — of the site, its light
                at different hours, its relationship to the city around it — before a single
                line is committed to paper.
              </p>
              <p>
                We are a small studio by design. Every project receives the full attention
                of the founding team, from first conversation to final occupancy.
              </p>
            </div>

            {/* Services list */}
            <div
              className="mt-14 pt-8 grid grid-cols-2 gap-y-4"
              style={{ borderTop: '1px solid oklch(84% 0.007 78)' }}
            >
              {[
                'Residential Design',
                'Commercial Architecture',
                'Institutional Projects',
                'Interior Spaces',
                'Urban Planning',
                'Site Consultation',
              ].map((service) => (
                <div key={service} className="flex items-center gap-3">
                  <div
                    style={{
                      width: 16, height: 1,
                      background: 'oklch(75% 0.007 75)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="font-body text-xs"
                    style={{ color: 'oklch(44% 0.008 75)', fontWeight: 400 }}
                  >
                    {service}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Image column */}
          <div ref={imageRef}>
            <div
              className="relative overflow-hidden"
              style={{ aspectRatio: '3/4' }}
            >
              <Image
                src="/assets/web/small/interior-01.jpg"
                alt="SECANT studio interior space"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div
              className="mt-4 font-mono text-[7px] tracking-[0.3em] uppercase"
              style={{ color: 'oklch(65% 0.007 75)' }}
            >
              Studio, Bengaluru · 2024
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
