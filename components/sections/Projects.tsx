'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const PROJECTS = [
  {
    id:       'himagiri',
    image:    '/assets/web/small/apartment-himagiri.jpg',
    title:    'Himagiri Residences',
    sub:      'Multi-family residential',
    location: 'Bengaluru',
    year:     '2022',
    span:     'full', /* layout hint */
  },
  {
    id:       'clouds',
    image:    '/assets/web/small/commercial-clouds-wood.jpg',
    title:    'Clouds Wood Technology',
    sub:      'Corporate campus',
    location: 'Bengaluru',
    year:     '2020',
    span:     'left',
  },
  {
    id:       'krs',
    image:    '/assets/web/small/apartment-krs.jpg',
    title:    'KRS Development',
    sub:      'Apartment complex',
    location: 'Mysuru',
    year:     '2019',
    span:     'right',
  },
  {
    id:       'arvind',
    image:    '/assets/web/small/institution-arvind-college.jpg',
    title:    'Arvind Campus',
    sub:      'Institutional complex',
    location: 'Bengaluru',
    year:     '2018',
    span:     'full',
  },
  {
    id:       'deepak',
    image:    '/assets/web/small/residence-deepak.jpg',
    title:    'Deepak Residence',
    sub:      'Private bungalow',
    location: 'Bengaluru',
    year:     '2023',
    span:     'left',
  },
  {
    id:       'arshia',
    image:    '/assets/web/small/bungalow-arshia-house-view.jpg',
    title:    'Arshia House',
    sub:      'Private residence',
    location: 'Bengaluru',
    year:     '2023',
    span:     'right',
  },
]

function ProjectItem({
  project,
  index,
}: {
  project: (typeof PROJECTS)[0]
  index: number
}) {
  const itemRef  = useRef<HTMLDivElement>(null)
  const imgRef   = useRef<HTMLDivElement>(null)
  const textRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el   = itemRef.current
    const img  = imgRef.current
    const text = textRef.current
    if (!el || !img || !text) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    /* Entrance */
    gsap.fromTo(el,
      { autoAlpha: 0, y: 50 },
      {
        autoAlpha: 1, y: 0,
        duration: 1.05,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 84%',
          toggleActions: 'play none none none',
        },
        delay: (index % 2) * 0.12,
      }
    )

    /* Hover: subtle image scale */
    const scaleIn  = () => gsap.to(img.firstChild, { scale: 1.04, duration: 0.85, ease: 'power3.out' })
    const scaleOut = () => gsap.to(img.firstChild, { scale: 1,    duration: 0.85, ease: 'power3.out' })

    el.addEventListener('mouseenter', scaleIn)
    el.addEventListener('mouseleave', scaleOut)

    return () => {
      el.removeEventListener('mouseenter', scaleIn)
      el.removeEventListener('mouseleave', scaleOut)
    }
  }, [index])

  const isFull = project.span === 'full'

  return (
    <div
      ref={itemRef}
      className="relative group"
      style={isFull ? {} : {}}
    >
      {/* Image container */}
      <div
        ref={imgRef}
        className="relative overflow-hidden"
        style={{
          aspectRatio: isFull ? '21/9' : '4/5',
        }}
      >
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover"
          style={{ transformOrigin: 'center center' }}
          unoptimized
        />
        {/* Bottom gradient for text legibility */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '60%',
            background: 'linear-gradient(to top, rgba(8,7,6,0.72) 0%, transparent 100%)',
          }}
        />

        {/* Overlay text on image — project name */}
        <div
          ref={textRef}
          className="absolute inset-x-0 bottom-0 p-7 md:p-9"
        >
          <div
            className="font-mono text-[7px] tracking-[0.4em] uppercase mb-2"
            style={{ color: 'rgba(255,255,255,0.48)' }}
          >
            {project.sub} · {project.year}
          </div>
          <h3
            className="font-display"
            style={{
              fontSize: isFull
                ? 'clamp(1.9rem, 4vw, 4rem)'
                : 'clamp(1.4rem, 2.5vw, 2.4rem)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: 'rgba(255,255,255,0.93)',
              letterSpacing: '-0.015em',
            }}
          >
            {project.title}
          </h3>
          <div
            className="font-mono text-[8px] tracking-[0.3em] mt-2 uppercase"
            style={{ color: 'rgba(255,255,255,0.38)' }}
          >
            {project.location}
          </div>
        </div>

        {/* Corner index */}
        <div
          className="absolute top-6 right-6 font-mono text-[9px] tracking-[0.2em]"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {String(PROJECTS.indexOf(project) + 1).padStart(2, '0')}
        </div>
      </div>
    </div>
  )
}

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!headingRef.current) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    gsap.fromTo(headingRef.current,
      { autoAlpha: 0, y: 16 },
      {
        autoAlpha: 1, y: 0,
        duration: 0.9, ease: 'power3.out',
        scrollTrigger: {
          trigger: headingRef.current,
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      }
    )
  }, [])

  /* Separate full-width from paired */
  const full  = PROJECTS.filter((p) => p.span === 'full')
  const pairs = PROJECTS.filter((p) => p.span !== 'full')
  const pair1 = pairs.filter((p) => p.span === 'left' || p.span === 'right').slice(0, 2)
  const pair2 = pairs.slice(2)

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="relative w-full"
      style={{
        paddingTop:    'clamp(7rem, 14vh, 12rem)',
        paddingBottom: 'clamp(7rem, 14vh, 12rem)',
        background: 'oklch(97.2% 0.007 80)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-7 md:px-14 lg:px-20">

        {/* Section header */}
        <div
          ref={headingRef}
          className="flex items-end justify-between flex-wrap gap-6 mb-14 md:mb-18"
        >
          <div>
            <div
              className="font-mono text-[8px] tracking-[0.45em] uppercase mb-4"
              style={{ color: 'oklch(55% 0.007 75)' }}
            >
              Selected Works
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 4.4rem)',
                fontWeight: 400,
                lineHeight: 1.06,
                color: 'oklch(7.8% 0.009 72)',
                letterSpacing: '-0.02em',
              }}
            >
              Spaces we have
              <br />
              brought to life.
            </h2>
          </div>
          <span
            className="font-mono text-[8px] tracking-[0.3em] uppercase self-start"
            style={{ color: 'oklch(65% 0.007 75)' }}
          >
            2017 — 2024
          </span>
        </div>

        {/* Featured — full width */}
        <div className="mb-5 md:mb-6">
          <ProjectItem project={full[0]} index={0} />
        </div>

        {/* Pair 1 — asymmetric: 55/45 */}
        <div
          className="grid grid-cols-1 md:grid-cols-[55fr_45fr] gap-5 md:gap-6 mb-5 md:mb-6"
        >
          <ProjectItem project={pair1[0]} index={1} />
          <ProjectItem project={pair1[1]} index={2} />
        </div>

        {/* Featured — full width */}
        <div className="mb-5 md:mb-6">
          <ProjectItem project={full[1]} index={3} />
        </div>

        {/* Pair 2 — asymmetric: 42/58 */}
        <div
          className="grid grid-cols-1 md:grid-cols-[42fr_58fr] gap-5 md:gap-6"
        >
          <ProjectItem project={pair2[0]} index={4} />
          <ProjectItem project={pair2[1]} index={5} />
        </div>

        {/* Footer link */}
        <div
          className="mt-16 flex justify-center"
        >
          <a
            href="#contact"
            className="font-mono text-[9px] tracking-[0.4em] uppercase transition-opacity duration-300 hover:opacity-50 flex items-center gap-4"
            style={{ color: 'oklch(44% 0.008 75)' }}
          >
            <span
              className="block"
              style={{ width: '4rem', height: '1px', background: 'oklch(84% 0.007 78)' }}
            />
            Begin a project
            <span
              className="block"
              style={{ width: '4rem', height: '1px', background: 'oklch(84% 0.007 78)' }}
            />
          </a>
        </div>

      </div>
    </section>
  )
}
