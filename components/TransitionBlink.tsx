'use client'

import { createContext, useContext, useRef, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { gsap } from 'gsap'

interface BlinkCtx { navigate: (href: string) => void; navigateFade: (href: string) => void }
const BlinkContext = createContext<BlinkCtx>({ navigate: () => {}, navigateFade: () => {} })
export function useNavigate() { return useContext(BlinkContext) }

export function TransitionBlink({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const topRef   = useRef<HTMLDivElement>(null)
  const botRef   = useRef<HTMLDivElement>(null)
  const fadeRef  = useRef<HTMLDivElement>(null)
  const busy     = useRef(false)
  const isFirst  = useRef(true)
  const isFade   = useRef(false)

  // Position panels off-screen on mount
  useEffect(() => {
    if (topRef.current) gsap.set(topRef.current, { yPercent: -100 })
    if (botRef.current) gsap.set(botRef.current, { yPercent: 100 })
  }, [])

  // New page mounted → reveal (blink panels or fade overlay depending on mode)
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    if (isFade.current) {
      const fade = fadeRef.current
      if (fade) gsap.to(fade, { opacity: 0, duration: 0.38, ease: 'sine.inOut',
        onComplete: () => { gsap.set(fade, { display: 'none' }); isFade.current = false; busy.current = false } })
      return
    }
    const top = topRef.current
    const bot = botRef.current
    if (!top || !bot) return
    gsap.delayedCall(0.05, () => {
      gsap.to([top, bot], {
        yPercent: (i: number) => (i === 0 ? -100 : 100),
        duration: 0.34,
        ease: 'power3.inOut',
        onComplete: () => { busy.current = false },
      })
    })
  }, [pathname])

  const navigate = useCallback((href: string) => {
    // Use window.location.pathname — always the live value, never a stale closure.
    // Normalize trailing slashes: next.config trailingSlash:true makes the browser
    // path /about/ while hrefs are /about — without this the same-page check fails.
    const norm        = (p: string) => p.replace(/\/$/, '') || '/'
    const currentBase = norm(window.location.pathname)
    const hrefBase    = norm(href.split('#')[0] || '/')

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
      duration: 0.30,
      ease: 'power3.inOut',
      onComplete: () => router.push(href),
    })
  }, [router])

  const navigateFade = useCallback((href: string) => {
    const norm     = (p: string) => p.replace(/\/$/, '') || '/'
    const hrefBase = norm(href.split('#')[0] || '/')
    if (hrefBase === norm(window.location.pathname)) return
    if (busy.current) return
    busy.current = true
    isFade.current = true
    const fade = fadeRef.current
    if (!fade) { router.push(href); return }
    gsap.set(fade, { display: 'block', opacity: 0 })
    gsap.to(fade, { opacity: 1, duration: 0.32, ease: 'sine.inOut', onComplete: () => router.push(href) })
  }, [router])

  return (
    <BlinkContext.Provider value={{ navigate, navigateFade }}>
      {/* Fade overlay (render-to-render transitions) */}
      <div
        ref={fadeRef}
        style={{
          display: 'none', position: 'fixed', inset: 0,
          background: '#0d0d0d', zIndex: 9998, pointerEvents: 'none',
        }}
      />
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
