'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Loader }       from '@/components/Loader'
import { Navigation }   from '@/components/Navigation'
import { Navigator }    from '@/components/Navigator'
import { SmoothScroll } from '@/components/SmoothScroll'
import { Hero }         from '@/components/sections/Hero'
import { StudioIntro }  from '@/components/sections/StudioIntro'

gsap.registerPlugin(ScrollTrigger)

const Scene3D = dynamic(
  () => import('@/components/Scene3D').then((m) => m.Scene3D),
  { ssr: false, loading: () => null }
)

export default function Home() {
  const [loaderDone, setLoaderDone]   = useState(false)
  const [isMobile,   setIsMobile]     = useState(false)
  const progressRef  = useRef(0)
  const modelDivRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.classList.add('is-loading')
    /* Detect portrait / narrow viewport once on mount */
    setIsMobile(window.innerWidth < window.innerHeight || window.innerWidth < 640)
  }, [])

  useEffect(() => {
    if (!loaderDone) return

    /* Fade model in (GSAP owns opacity — no CSS transition conflict) */
    if (modelDivRef.current) {
      gsap.to(modelDivRef.current, { opacity: 1, duration: 0.35, ease: 'power2.out' })
    }

    const id = setTimeout(() => {
      const mobile = window.innerWidth < window.innerHeight || window.innerWidth < 640

      if (mobile) {
        /* ── Mobile: model lives for 3 × 100svh (hero + 2-screen spacer) ────
           Progress 0→1 maps to those 3 screens → 3 camera stops in Scene3D.
           Between 75 % and 100 % of the model section the canvas fades out,
           revealing the StudioIntro content panels beneath.                  */
        const modelEndPx = window.innerHeight * 3

        const st = ScrollTrigger.create({
          trigger: document.documentElement,
          start:   'top top',
          end:     `+=${modelEndPx}`,
          onUpdate: (self) => { progressRef.current = self.progress },
        })

        const stFade = gsap.to(modelDivRef.current!, {
          opacity: 0,
          ease:    'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start:   `top+=${Math.round(modelEndPx * 0.75)} top`,
            end:     `top+=${modelEndPx} top`,
            scrub:   true,
          },
        })

        return () => {
          st.kill()
          stFade.scrollTrigger?.kill()
        }
      } else {
        /* ── Desktop: existing behaviour — full-page progress ────────────── */
        const st = ScrollTrigger.create({
          trigger:  document.documentElement,
          start:    'top top',
          end:      'bottom bottom',
          onUpdate: (self) => { progressRef.current = self.progress },
        })

        const categoriesEl = document.getElementById('categories')
        let stFade: ReturnType<typeof gsap.to> | undefined
        if (categoriesEl && modelDivRef.current) {
          stFade = gsap.to(modelDivRef.current, {
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: categoriesEl,
              start:   'top 75%',
              end:     'top 20%',
              scrub:   true,
            },
          })
        }

        return () => {
          st.kill()
          stFade?.scrollTrigger?.kill()
        }
      }
    }, 100)

    return () => clearTimeout(id)
  }, [loaderDone])

  function handleLoaderComplete() {
    window.scrollTo(0, 0)
    document.body.classList.remove('is-loading')
    setLoaderDone(true)
  }

  return (
    <>
      <Loader onComplete={handleLoaderComplete} />

      {/* Fixed full-screen 3D canvas — GSAP owns opacity after loaderDone */}
      <div ref={modelDivRef} style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0, left: 0,
        zIndex: 0,
        background: '#faf8f5',
        pointerEvents: 'none',
        opacity: 0,
      }}>
        {loaderDone && <Scene3D progressRef={progressRef} />}
      </div>

      <SmoothScroll enabled={loaderDone}>
        <Navigation />
        <Navigator />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Hero loaderDone={loaderDone} />

          {/* Mobile-only: 200 svh spacer — camera travels stops 2 & 3
              before fading. Desktop collapses to nothing.              */}
          {isMobile && (
            <div style={{ height: '200svh', pointerEvents: 'none' }} aria-hidden="true" />
          )}

          <StudioIntro />
        </div>
      </SmoothScroll>
    </>
  )
}
