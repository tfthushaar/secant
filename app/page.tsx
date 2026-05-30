'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Loader }       from '@/components/Loader'
import { Navigation }   from '@/components/Navigation'
import { Navigator }    from '@/components/Navigator'
import { SmoothScroll } from '@/components/SmoothScroll'
import { Hero }         from '@/components/sections/Hero'
import { StudioIntro }  from '@/components/sections/StudioIntro'

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

  function handleLoaderComplete() {
    document.body.classList.remove('is-loading')
    setLoaderDone(true)
  }

  return (
    <>
      <Loader onComplete={handleLoaderComplete} />

      {/* ── Fixed 3D model — always behind all page content ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: '#ffffff',
        pointerEvents: 'none',
      }}>
        <Scene3D progressRef={progressRef} />
      </div>

      <SmoothScroll enabled={loaderDone}>
        <Navigation />
        <Navigator />
        <main style={{ position: 'relative', zIndex: 1 }}>
          <Hero progressRef={progressRef} />
          <StudioIntro />
        </main>
      </SmoothScroll>
    </>
  )
}
