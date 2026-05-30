'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
  Hero section — two rendering modes
  ────────────────────────────────────────────────────────────────────
  PRODUCTION (video present):
    /public/assets/hero-model.mp4 is served.
    The <video> element never autoplays — scroll progress directly sets
    video.currentTime, turning the video into a frame-scrubbed animation.
    Zero GPU overhead beyond normal video decode.

  RECORDING / FALLBACK (no video yet):
    WireframeViewer renders the model live in Three.js.
    Screen-record the result at each camera angle to produce
    hero-model.mp4, then drop it into public/assets/.

  Both modes:
    • Section is 400 vh tall.
    • Inner container is position:sticky so the canvas fills the viewport
      while the user scrolls through the hero.
    • progressRef is written by a ScrollTrigger (0 → 1 over 400 vh).
    • SECANT title + subtitle are absolutely overlaid.
    • After 400 vh the sticky releases and the next section appears.
  ────────────────────────────────────────────────────────────────────
*/

const WireframeViewer = dynamic(
  () => import('@/components/WireframeViewer').then((m) => m.WireframeViewer),
  { ssr: false, loading: () => null }
)

const VIDEO_SRC = '/assets/hero-model.mp4'
const X         = 'clamp(18px, 3.7vw, 72px)'

export function Hero() {
  const sectionRef  = useRef<HTMLElement>(null)
  const videoRef    = useRef<HTMLVideoElement>(null)
  const titleRef    = useRef<HTMLDivElement>(null)
  const subRef      = useRef<HTMLDivElement>(null)
  const scatterRef  = useRef<HTMLDivElement>(null)

  /* Shared scroll progress for both the wireframe orbit and video scrub */
  const progressRef = useRef(0)

  /* True once the video file is confirmed available */
  const [videoReady, setVideoReady] = useState(false)

  /* ── Probe for the video file ─────────────────────────────────── */
  useEffect(() => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.oncanplay = () => setVideoReady(true)
    v.onerror   = () => setVideoReady(false)   /* file not found — use wireframe */
    v.src       = VIDEO_SRC
  }, [])

  /* ── Video scrubbing (when video is available) ────────────────── */
  useEffect(() => {
    const vid = videoRef.current
    if (!vid || !videoReady) return

    /* Preload all frames so seeking is instant */
    vid.preload = 'auto'
    vid.load()

    /* ScrollTrigger scrubs video.currentTime */
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start:   'top top',
      end:     'bottom bottom',
      onUpdate: (self) => {
        progressRef.current = self.progress
        if (vid.readyState >= 2 && vid.duration) {
          vid.currentTime = self.progress * vid.duration
        }
      },
    })

    return () => st.kill()
  }, [videoReady])

  /* ── ScrollTrigger for wireframe orbit ────────────────────────── */
  useEffect(() => {
    if (videoReady) return  /* video handles its own ST */

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start:   'top top',
      end:     'bottom bottom',
      onUpdate: (self) => { progressRef.current = self.progress },
    })

    return () => st.kill()
  }, [videoReady])

  /* ── Text reveal on load ──────────────────────────────────────── */
  useEffect(() => {
    const title   = titleRef.current
    const sub     = subRef.current
    const scatter = scatterRef.current
    if (!title || !sub || !scatter) return

    gsap.set([title, sub, scatter], { autoAlpha: 0 })
    const tl = gsap.timeline({ delay: 0.1 })
    tl
      .to(title,   { autoAlpha: 1, duration: 1.0, ease: 'power3.out' }, 0)
      .to(sub,     { autoAlpha: 1, duration: 0.8, ease: 'power3.out' }, 0.3)
      .to(scatter, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, 0.7)

    return () => { tl.kill() }
  }, [])

  return (
    /*
      400 vh tall section.
      The sticky inner div locks to the viewport while you scroll through
      all 400 vh, then releases naturally when you reach the bottom edge.
    */
    <section
      ref={sectionRef}
      id="hero-section"
      style={{
        position: 'relative',
        height:   '400vh',
        width:    '100%',
      }}
    >
      {/* ── Sticky viewport ──────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top:      0,
          width:    '100%',
          height:   '100svh',
          overflow: 'hidden',
        }}
      >
        {/* ── 3D canvas — video OR wireframe ───────────────────── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#f8f6f2' }}>

          {/* PRODUCTION: scroll-scrubbed pre-rendered video */}
          {videoReady && (
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              muted
              playsInline
              /* Never autoplay — JS scrubs currentTime directly */
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              aria-hidden="true"
            />
          )}

          {/* FALLBACK / RECORDING: live wireframe viewer */}
          {!videoReady && (
            <WireframeViewer progressRef={progressRef} />
          )}
        </div>

        {/* ── Typography overlay ───────────────────────────────── */}
        <div style={{
          position:      'absolute',
          inset:         0,
          zIndex:        2,
          pointerEvents: 'none',
          display:       'flex',
          flexDirection: 'column',
          justifyContent:'space-between',
          padding:       `clamp(4.5rem,8vh,6rem) ${X} clamp(1.5rem,3vh,2.5rem)`,
        }}>
          {/* SECANT + subtitle */}
          <div>
            <div ref={titleRef} style={{ opacity: 0 }}>
              <h1 style={{
                fontFamily:   'var(--font-display), Georgia, serif',
                fontWeight:   700,
                fontSize:     'clamp(5rem, 14vw, 16rem)',
                lineHeight:   0.88,
                letterSpacing:'-0.01em',
                textTransform:'uppercase',
                color:        'oklch(8.5% 0.007 72)',
                margin:       0,
                textShadow:   '0 2px 28px rgba(247,244,239,0.9)',
                userSelect:   'none',
              }}>
                SECANT
              </h1>
            </div>
            <div ref={subRef} style={{
              opacity:    0,
              marginTop:  'clamp(0.6rem, 1.5vh, 1.2rem)',
              display:    'flex',
              alignItems: 'center',
              gap:        '2rem',
            }}>
              <span style={{
                fontFamily:   'var(--font-sans), sans-serif',
                fontWeight:   300, fontSize: 'clamp(0.65rem,1vw,0.9rem)',
                letterSpacing:'0.3em', textTransform: 'uppercase',
                color:        'oklch(44% 0.007 74)',
              }}>Architecture Studio</span>
              <span style={{ width:'3rem', height:'1px', background:'oklch(82% 0.007 74)', display:'block', flexShrink:0 }} />
              <span style={{
                fontFamily:   'var(--font-sans), sans-serif',
                fontWeight:   300, fontSize: 'clamp(0.6rem,0.9vw,0.8rem)',
                letterSpacing:'0.28em', textTransform: 'uppercase',
                color:        'oklch(52% 0.007 74)',
              }}>Bengaluru · Est. 2003</span>
            </div>
          </div>

          {/* Bottom scattered details */}
          <div ref={scatterRef} style={{ opacity: 0, position: 'relative' }}>
            <div style={{
              position:     'absolute', bottom: 0, left: 0,
              fontFamily:   'var(--font-sans), sans-serif',
              fontWeight:   300, fontSize: '0.56rem',
              letterSpacing:'0.38em', textTransform: 'uppercase',
              color:        'oklch(48% 0.007 74)',
            }}>12°58&apos;N · 77°35&apos;E</div>

            <div style={{
              position:  'absolute', bottom: 0, left: '50%',
              transform: 'translateX(-50%)',
              color:     'oklch(50% 0.007 74)',
            }} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <line x1="10" y1="0"  x2="10" y2="6"  stroke="currentColor" strokeWidth="0.7"/>
                <line x1="10" y1="14" x2="10" y2="20" stroke="currentColor" strokeWidth="0.7"/>
                <line x1="0"  y1="10" x2="6"  y2="10" stroke="currentColor" strokeWidth="0.7"/>
                <line x1="14" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="0.7"/>
                <rect x="7.5" y="7.5" width="5" height="5" stroke="currentColor" strokeWidth="0.7" fill="none"/>
              </svg>
            </div>

            <div style={{
              position:     'absolute', bottom: 0, right: 0,
              fontFamily:   'var(--font-display), Georgia, serif',
              fontWeight:   400, fontSize: 'clamp(0.8rem,1.2vw,1.1rem)',
              letterSpacing:'0.06em', textTransform: 'uppercase',
              color:        'oklch(40% 0.007 74)',
            }}>Space · Composed</div>

            <div style={{
              position:      'absolute', bottom: '2.5rem', right: 0,
              fontFamily:    'var(--font-sans), sans-serif',
              fontWeight:    300, fontSize: '0.54rem',
              letterSpacing: '0.4em', textTransform: 'uppercase',
              color:         'oklch(50% 0.007 74)',
              writingMode:   'vertical-rl',
              textOrientation:'mixed',
              transform:     'rotate(180deg)',
            }}>01 / Home</div>
          </div>
        </div>

        {/* Bottom gradient to blend into next section */}
        <div style={{
          position:       'absolute', bottom: 0, left: 0, right: 0,
          height:         'clamp(40px, 8svh, 80px)',
          background:     'linear-gradient(to bottom, transparent, oklch(97.2% 0.006 78))',
          zIndex:         3,
          pointerEvents:  'none',
        }} />

      </div>{/* /sticky */}
    </section>
  )
}
