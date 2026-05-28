'use client'

import { useState, useEffect } from 'react'
import { Loader }      from '@/components/Loader'
import { Navigation }  from '@/components/Navigation'
import { Navigator }   from '@/components/Navigator'
import { SmoothScroll } from '@/components/SmoothScroll'
import { Hero }        from '@/components/sections/Hero'
import { Philosophy }  from '@/components/sections/Philosophy'

export default function Home() {
  const [loaderDone, setLoaderDone] = useState(false)

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
      <SmoothScroll enabled={loaderDone}>
        <Navigation />
        <Navigator />
        <main>
          <Hero />
          <Philosophy />
        </main>
      </SmoothScroll>
    </>
  )
}
