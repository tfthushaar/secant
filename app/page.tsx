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
  const progressRef  = useRef(0)
  const modelDivRef  = useRef<HTMLDivElement>(null)

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

      /* Fade the 3D model out as the categories section enters the viewport */
      const categoriesEl = document.getElementById('categories')
      let stFade: ReturnType<typeof gsap.to> | undefined
      if (categoriesEl && modelDivRef.current) {
        stFade = gsap.to(modelDivRef.current, {
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: categoriesEl,
            start: 'top 75%',
            end:   'top 20%',
            scrub: true,
          },
        })
      }

      return () => {
        st.kill()
        stFade?.scrollTrigger?.kill()
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

      {/* Fixed full-screen 3D background — same on mobile and desktop */}
      <div ref={modelDivRef} style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0, left: 0,
        zIndex: 0,
        background: '#faf8f5', pointerEvents: 'none',
        opacity: loaderDone ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        {loaderDone && <Scene3D progressRef={progressRef} />}
      </div>

      <SmoothScroll enabled={loaderDone}>
        <Navigation />
        <Navigator />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Hero loaderDone={loaderDone} />
          <StudioIntro />
        </div>
      </SmoothScroll>
    </>
  )
}
