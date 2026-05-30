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
  const [loaderDone, setLoaderDone] = useState(false)
  const progressRef = useRef(0)
  const mainRef     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.classList.add('is-loading')
  }, [])

  /* Camera is driven by total page scroll — starts as soon as loader finishes */
  useEffect(() => {
    if (!loaderDone) return

    /* Small delay lets ScrollTrigger pick up the full page height after render */
    const id = setTimeout(() => {
      const st = ScrollTrigger.create({
        trigger:  document.documentElement,
        start:    'top top',
        end:      'bottom bottom',
        onUpdate: (self) => { progressRef.current = self.progress },
      })
      return () => st.kill()
    }, 120)

    return () => clearTimeout(id)
  }, [loaderDone])

  function handleLoaderComplete() {
    document.body.classList.remove('is-loading')
    setLoaderDone(true)
  }

  return (
    <>
      <Loader onComplete={handleLoaderComplete} />

      {/* Fixed 3D model — always behind all content */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: '#ffffff', pointerEvents: 'none',
      }}>
        <Scene3D progressRef={progressRef} />
      </div>

      <SmoothScroll enabled={loaderDone}>
        <Navigation />
        <Navigator />
        <div ref={mainRef} style={{ position: 'relative', zIndex: 1 }}>
          <Hero />
          <StudioIntro />
        </div>
      </SmoothScroll>
    </>
  )
}
