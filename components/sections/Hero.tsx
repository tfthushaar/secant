'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
  Hero — scroll-pinned 3D wireframe viewer
  ─────────────────────────────────────────
  • Section height: 100svh. GSAP `pin:true` adds 500% extra scroll space
    so the camera travels through 5 presets before the pin releases.
  • progressRef is written 0→1 by the ScrollTrigger onUpdate callback.
    Scene3D reads it every frame to drive the camera position.
  • Typography overlay sits above the canvas at z-index 2.
*/

const Scene3D = dynamic(
  () => import('@/components/Scene3D').then((m) => m.Scene3D),
  { ssr: false, loading: () => null }
)

const X = 'clamp(18px, 3.7vw, 72px)'

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef   = useRef<HTMLDivElement>(null)
  const subRef     = useRef<HTMLDivElement>(null)
  const scatterRef = useRef<HTMLDivElement>(null)

  /* Shared scroll progress for Scene3D camera animation */
  const progressRef = useRef(0)

  useEffect(() => {
    const section = sectionRef.current
    const title   = titleRef.current
    const sub     = subRef.current
    const scatter = scatterRef.current
    if (!section || !title || !sub || !scatter) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* Text entrance */
    gsap.set([title, sub, scatter], { autoAlpha: 0 })
    const reveal = gsap.timeline({ delay: 0.15 })
    reveal
      .to(title,   { autoAlpha: 1, duration: 1.0, ease: 'power3.out' }, 0)
      .to(sub,     { autoAlpha: 1, duration: 0.8, ease: 'power3.out' }, 0.3)
      .to(scatter, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, 0.7)

    if (reduced) return () => { reveal.kill() }

    /*
      GSAP pin — keeps the hero in the viewport while the user scrolls
      through all 5 camera angles (one viewport-height per angle = 500%).
      After the pin releases, the philosophy section scrolls in naturally.
      pinSpacing:true adds a spacer so layout below is not disrupted.
    */
    const st = ScrollTrigger.create({
      trigger:    section,
      start:      'top top',
      end:        '+=500%',
      pin:        true,
      pinSpacing: true,
      scrub:      1.8,
      onUpdate:   (self) => { progressRef.current = self.progress },
    })

    return () => { reveal.kill(); st.kill() }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="hero-section"
      style={{ position: 'relative', width: '100%', height: '100svh', overflow: 'hidden' }}
    >
      {/* ── 3D canvas — fills the full section ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Scene3D progressRef={progressRef} />
      </div>

      {/* ── Typography overlay ── */}
      <div style={{
        position:       'absolute', inset: 0, zIndex: 2,
        pointerEvents:  'none',
        display:        'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding:        `clamp(4.5rem,8vh,6rem) ${X} clamp(1.5rem,3vh,2.5rem)`,
      }}>
        {/* SECANT + subtitle */}
        <div>
          <div ref={titleRef} style={{ opacity: 0 }}>
            <h1 style={{
              /*
                Raleway weight 100 — ultra-thin geometric sans.
                Transforms the wordmark from heavy editorial serif
                to clean, architectural minimalism.
              */
              fontFamily:    'var(--font-sans), "Helvetica Neue", Arial, sans-serif',
              fontWeight:    100,
              fontSize:      'clamp(5rem, 14vw, 16rem)',
              lineHeight:    0.88,
              letterSpacing: '0.06em',     /* slight tracking suits thin weight */
              textTransform: 'uppercase',
              color:         'oklch(8.5% 0.007 72)',
              margin:        0,
              userSelect:    'none',
            }}>
              SECANT
            </h1>
          </div>

          <div ref={subRef} style={{
            opacity:    0,
            marginTop:  'clamp(0.6rem, 1.5vh, 1.2rem)',
            display:    'flex', alignItems: 'center', gap: '2rem',
          }}>
            <span style={{
              fontFamily:    'var(--font-sans), sans-serif',
              fontWeight:    300,
              fontSize:      'clamp(0.65rem,1vw,0.9rem)',
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color:         'oklch(44% 0.007 74)',
            }}>Architecture Studio</span>
            <span style={{ width:'3rem', height:'1px', background:'oklch(82% 0.007 74)', display:'block', flexShrink:0 }} />
            <span style={{
              fontFamily:    'var(--font-sans), sans-serif',
              fontWeight:    300,
              fontSize:      'clamp(0.6rem,0.9vw,0.8rem)',
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color:         'oklch(52% 0.007 74)',
            }}>Bengaluru · Est. 2003</span>
          </div>
        </div>

        {/* Bottom scattered details */}
        <div ref={scatterRef} style={{ opacity: 0, position: 'relative' }}>
          <div style={{
            position:'absolute', bottom:0, left:0,
            fontFamily:'var(--font-sans), sans-serif',
            fontWeight:300, fontSize:'0.56rem',
            letterSpacing:'0.38em', textTransform:'uppercase',
            color:'oklch(48% 0.007 74)',
          }}>12°58&apos;N · 77°35&apos;E</div>

          <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', color:'oklch(50% 0.007 74)' }} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="0"  x2="10" y2="6"  stroke="currentColor" strokeWidth="0.7"/>
              <line x1="10" y1="14" x2="10" y2="20" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="0"  y1="10" x2="6"  y2="10" stroke="currentColor" strokeWidth="0.7"/>
              <line x1="14" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="0.7"/>
              <rect x="7.5" y="7.5" width="5" height="5" stroke="currentColor" strokeWidth="0.7" fill="none"/>
            </svg>
          </div>

          <div style={{
            position:'absolute', bottom:0, right:0,
            fontFamily:'var(--font-sans), sans-serif',
            fontWeight:300, fontSize:'clamp(0.6rem,0.9vw,0.85rem)',
            letterSpacing:'0.2em', textTransform:'uppercase',
            color:'oklch(40% 0.007 74)',
          }}>Space · Composed</div>

          <div style={{
            position:'absolute', bottom:'2.5rem', right:0,
            fontFamily:'var(--font-sans), sans-serif',
            fontWeight:300, fontSize:'0.54rem',
            letterSpacing:'0.4em', textTransform:'uppercase',
            color:'oklch(50% 0.007 74)',
            writingMode:'vertical-rl', textOrientation:'mixed', transform:'rotate(180deg)',
          }}>01 / Home</div>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        height:'clamp(40px,8svh,80px)',
        background:'linear-gradient(to bottom, transparent, oklch(97.2% 0.006 78))',
        zIndex:3, pointerEvents:'none',
      }} />
    </section>
  )
}
