'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── Sketch / render pairs ──────────────────────────────────────────── */
const PAIRS = [
  {
    id:       'pioneer',
    sketch:   '/assets/web/small/sketches/sketch-pioneer-rehman.jpg',
    render:   '/assets/web/small/apartment-pioneer.jpg',
    label:    'Pioneer Complex',
    category: 'Residential',
    year:     '2019',
  },
  {
    id:       'nanda',
    sketch:   '/assets/web/small/sketches/sketch-nanda-comm.jpg',
    render:   '/assets/web/small/commercial-c1.jpg',
    label:    'Nanda Commercial',
    category: 'Commercial',
    year:     '2021',
  },
  {
    id:       'school',
    sketch:   '/assets/web/small/sketches/sketch-school.jpg',
    render:   '/assets/web/small/institution-nallur-school.jpg',
    label:    'Nallur School',
    category: 'Institutional',
    year:     '2017',
  },
]

/* ── Single comparison slider ────────────────────────────────────────── */
function ComparisonSlider({
  sketch, render, label, category, year,
}: (typeof PAIRS)[0]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sketchLayerRef = useRef<HTMLDivElement>(null)
  const handleRef    = useRef<HTMLDivElement>(null)
  const posRef       = useRef(72) /* 72% = mostly sketch, a hint of render shows */
  const returnTween  = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const container  = containerRef.current
    const sketchEl   = sketchLayerRef.current
    const handleEl   = handleRef.current
    if (!container || !sketchEl || !handleEl) return

    /* Apply initial position */
    sketchEl.style.clipPath = `inset(0 ${100 - posRef.current}% 0 0)`
    handleEl.style.left     = `${posRef.current}%`

    function setPos(p: number) {
      const clamped = Math.max(4, Math.min(96, p))
      posRef.current = clamped
      sketchEl.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`
      handleEl.style.left     = `${clamped}%`
    }

    function onMouseMove(e: MouseEvent) {
      returnTween.current?.kill()
      const rect = container.getBoundingClientRect()
      const p    = ((e.clientX - rect.left) / rect.width) * 100
      setPos(p)
    }

    function onMouseLeave() {
      /* Glide back to resting position */
      const obj = { val: posRef.current }
      returnTween.current = gsap.to(obj, {
        val: 72,
        duration: 1.2,
        ease: 'power3.out',
        onUpdate: () => setPos(obj.val),
      })
    }

    /* Touch support */
    function onTouchMove(e: TouchEvent) {
      returnTween.current?.kill()
      const rect = container.getBoundingClientRect()
      const p    = ((e.touches[0].clientX - rect.left) / rect.width) * 100
      setPos(p)
    }

    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseleave', onMouseLeave)
    container.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      returnTween.current?.kill()
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseleave', onMouseLeave)
      container.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  return (
    <div className="w-full">
      {/* The slider frame */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Render — bottom, always full visible */}
        <div className="absolute inset-0">
          <Image
            src={render}
            alt={`${label} — realised`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Sketch — clipped from the right, revealing render beneath */}
        <div
          ref={sketchLayerRef}
          className="absolute inset-0"
          style={{ clipPath: 'inset(0 28% 0 0)' }}
        >
          <Image
            src={sketch}
            alt={`${label} — sketch`}
            fill
            className="object-cover"
            style={{ filter: 'sepia(0.22) brightness(1.06) contrast(1.04)' }}
            unoptimized
          />
          {/* Warm paper wash over sketch side */}
          <div
            className="absolute inset-0"
            style={{ background: 'oklch(94% 0.014 80 / 0.28)' }}
          />
        </div>

        {/* Vertical divider */}
        <div
          ref={handleRef}
          className="absolute top-0 bottom-0 w-[1px] pointer-events-none"
          style={{ left: '72%', background: 'rgba(255,255,255,0.45)' }}
        >
          {/* Handle pill */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={{
              width: 36, height: 36,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'rgba(10,10,10,0.18)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 4,
            }}
          >
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.55)' }} />
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.55)' }} />
          </div>
        </div>

        {/* Corner labels */}
        <div
          className="absolute top-5 left-5 font-mono text-[8px] tracking-[0.3em] uppercase"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Concept
        </div>
        <div
          className="absolute top-5 right-5 font-mono text-[8px] tracking-[0.3em] uppercase"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Realised
        </div>

        {/* Drag hint — fades after first hover via CSS */}
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[7px] tracking-[0.35em] uppercase pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Move cursor to reveal
        </div>
      </div>

      {/* Project meta */}
      <div className="flex items-baseline justify-between mt-4 pt-4"
        style={{ borderTop: '1px solid oklch(91% 0.006 78)' }}
      >
        <span
          className="font-display"
          style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.6rem)',
            fontWeight: 400,
            color: 'oklch(7.8% 0.009 72)',
          }}
        >
          {label}
        </span>
        <div className="flex items-center gap-5">
          <span
            className="font-mono text-[8px] tracking-[0.3em] uppercase"
            style={{ color: 'oklch(65% 0.007 75)' }}
          >
            {category}
          </span>
          <span
            className="font-mono text-[8px] tracking-[0.2em]"
            style={{ color: 'oklch(75% 0.007 75)' }}
          >
            {year}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Section wrapper ─────────────────────────────────────────────────── */
export function SketchReveal() {
  const sectionRef  = useRef<HTMLElement>(null)
  const headingRef  = useRef<HTMLDivElement>(null)
  const sliderRefs  = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    /* Heading reveal */
    if (headingRef.current) {
      gsap.fromTo(headingRef.current,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1, y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      )
    }

    /* Each slider fades in staggered */
    sliderRefs.current.forEach((el, i) => {
      if (!el) return
      gsap.fromTo(el,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1, y: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
          delay: i * 0.07,
        }
      )
    })
  }, [])

  return (
    <section
      ref={sectionRef}
      id="method"
      className="relative w-full"
      style={{
        paddingTop:    'clamp(7rem, 14vh, 12rem)',
        paddingBottom: 'clamp(7rem, 14vh, 12rem)',
        background: 'oklch(93.5% 0.011 78)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-7 md:px-14 lg:px-20">

        {/* Section header */}
        <div ref={headingRef} className="mb-16 md:mb-20">
          <div
            className="font-mono text-[8px] tracking-[0.45em] uppercase mb-6"
            style={{ color: 'oklch(55% 0.007 75)' }}
          >
            The Method
          </div>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 4.8rem)',
                fontWeight: 400,
                lineHeight: 1.06,
                color: 'oklch(7.8% 0.009 72)',
                letterSpacing: '-0.02em',
              }}
            >
              From Concept
              <br />
              <em style={{ fontStyle: 'italic' }}>to Space.</em>
            </h2>
            <p
              className="font-body"
              style={{
                maxWidth: '38ch',
                fontSize: 'clamp(0.82rem, 1vw, 0.95rem)',
                lineHeight: 1.8,
                color: 'oklch(44% 0.008 75)',
                fontWeight: 300,
              }}
            >
              Every building begins as a line on paper. Hover across each image to trace
              the journey — from the first sketch to the finished structure.
            </p>
          </div>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-16 md:gap-20">
          {PAIRS.map((pair, i) => (
            <div
              key={pair.id}
              ref={(el) => { sliderRefs.current[i] = el }}
            >
              <ComparisonSlider {...pair} />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
