'use client'

import { createContext, useContext, useRef, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { gsap } from 'gsap'

interface BlinkCtx { navigate: (href: string) => void }
const BlinkContext = createContext<BlinkCtx>({ navigate: () => {} })
export function useNavigate() { return useContext(BlinkContext) }

export function TransitionBlink({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const topRef   = useRef<HTMLDivElement>(null)
  const botRef   = useRef<HTMLDivElement>(null)
  const busy     = useRef(false)
  const isFirst  = useRef(true)

  // Position panels off-screen on mount
  useEffect(() => {
    if (topRef.current) gsap.set(topRef.current, { yPercent: -100 })
    if (botRef.current) gsap.set(botRef.current, { yPercent: 100 })
  }, [])

  // New page mounted → open panels to reveal it
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    const top = topRef.current
    const bot = botRef.current
    if (!top || !bot) return
    gsap.delayedCall(0.05, () => {
      gsap.to([top, bot], {
        yPercent: (i: number) => (i === 0 ? -100 : 100),
        duration: 0.42,
        ease: 'power3.inOut',
        onComplete: () => { busy.current = false },
      })
    })
  }, [pathname])

  const navigate = useCallback((href: string) => {
    // Use window.location.pathname — always the live value, never a stale closure.
    const currentBase = window.location.pathname
    const hrefBase    = href.split('#')[0] || '/'

    // Same page: no transition. Handle hash scrolling if present.
    if (hrefBase === currentBase) {
      if (href.includes('#')) {
        const id = href.split('#')[1]
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }
      return
    }

    // Home has its own loader animation — push directly, no blink overlay.
    if (hrefBase === '/') {
      router.push(href)
      return
    }

    if (busy.current) return
    busy.current = true
    const top = topRef.current
    const bot = botRef.current
    if (!top || !bot) { router.push(href); return }
    gsap.to([top, bot], {
      yPercent: 0,
      duration: 0.38,
      ease: 'power3.inOut',
      onComplete: () => router.push(href),
    })
  }, [router])

  return (
    <BlinkContext.Provider value={{ navigate }}>
      {/* Top panel */}
      <div
        ref={topRef}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: '50vh', background: '#0d0d0d',
          zIndex: 9998, pointerEvents: 'none',
          willChange: 'transform',
        }}
      />
      {/* Bottom panel */}
      <div
        ref={botRef}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '50vh', background: '#0d0d0d',
          zIndex: 9998, pointerEvents: 'none',
          willChange: 'transform',
        }}
      />
      {children}
    </BlinkContext.Provider>
  )
}
