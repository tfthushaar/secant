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

/*
  Scene3D is loaded AFTER the loader animation completes.
  This prevents the Draco decompression from blocking the JS thread
  and freezing the typed-text animation.
  The model is 2MB + fast Draco decode → appears within ~0.3s of mount.
*/
const Scene3D = dynamic(
  () => import('@/components/Scene3D').then((m) => m.Scene3D),
  { ssr: false, loading: () => null }
)

export default function Home() {
  const [loaderDone, setLoaderDone] = useState(false)
  const progressRef = useRef(0)

  useEffect(() => {
    document.body.classList.add('is-loading')
  }, [])

  useEffect(() => {
    if (!loaderDone) return
    const id = setTimeout(() => {
      const st = ScrollTrigger.create({
        trigger:  document.documentElement,
        start:    'top top',
        end:      'bottom bottom',
        onUpdate: (self) => { progressRef.current = self.progress },
      })
      return () => st.kill()
    }, 100)
    return () => clearTimeout(id)
  }, [loaderDone])

  function handleLoaderComplete() {
    document.body.classList.remove('is-loading')
    setLoaderDone(true)
  }

  return (
    <>
      <Loader onComplete={handleLoaderComplete} />

      {/* Fixed 3D background — mounted AFTER loader to avoid freeze */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: '#ffffff', pointerEvents: 'none',
        /* Fade in once the model is mounted */
        opacity: loaderDone ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        {loaderDone && <Scene3D progressRef={progressRef} />}
      </div>

      <SmoothScroll enabled={loaderDone}>
        <Navigation />
        <Navigator />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Hero />
          <StudioIntro />
        </div>
      </SmoothScroll>
    </>
  )
}
