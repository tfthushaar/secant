'use client'

import { useState, useEffect } from 'react'
import { Loader } from './Loader'

export function LoaderWrapper({ children }: { children: React.ReactNode }) {
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    /* Only show loader on actual first visit (not on route changes) */
    const hasSeenLoader = sessionStorage.getItem('loaderShown')
    if (hasSeenLoader) setShowLoader(false)
  }, [])

  const handleLoaderComplete = () => {
    sessionStorage.setItem('loaderShown', 'true')
    setShowLoader(false)
  }

  return (
    <>
      {showLoader && <Loader onComplete={handleLoaderComplete} />}
      {children}
    </>
  )
}
