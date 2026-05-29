'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { workItems, CATEGORIES } from '@/lib/projects'
import { Navigator } from '@/components/Navigator'

/* ── Seeded random — no hydration mismatch ────────────────────────────── */
function sr(n: number) { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x) }

/* ── Virtual world dimensions ──────────────────────────────────────────── */
const WW = 4800   /* virtual world width  */
const WH = 3400   /* virtual world height */

/*
  Card positions pre-computed at module level (stable across renders).
  Cards are spread across the full virtual world with heavy jitter —
  only 6-8 are visible at once; the rest are discovered by panning.
*/
const CARDS = workItems.map((item, i) => {
  const cols = 9
  const rows = Math.ceil(workItems.length / cols)
  const colW = WW / cols
  const rowH = WH / rows
  const col  = i % cols
  const row  = Math.floor(i / cols)

  /* Heavy jitter so cards feel scattered, not gridded */
  const x = col * colW + colW / 2 + (sr(i*3)     - 0.5) * colW * 0.78
  const y = row * rowH + rowH / 2 + (sr(i*3 + 1) - 0.5) * rowH * 0.82

  return {
    id:            item.id,
    kind:          item.kind,
    category:      item.category,
    x:             Math.max(80, Math.min(WW - 80, x)),
    y:             Math.max(80, Math.min(WH - 80, y)),
    rotate:        (sr(i*3 + 2) - 0.5) * 9,
    floatVariant:  (i % 3) + 1,
    floatDuration: 7 + sr(i) * 6,
    floatDelay:    sr(i * 2) * 8,
  }
})

/* Initial offset: show the "densest" cluster of cards centrally */
const INIT_X = WW / 2
const INIT_Y = WH / 2

export default function WorkPage() {
  const [filter, setFilter] = useState('All')
  const router = useRouter()

  /* ── Pan state — driven by ref, React state only for category filter ── */
  const worldRef    = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const txRef = useRef(0)
  const tyRef = useRef(0)
  const velX  = useRef(0)
  const velY  = useRef(0)
  const dragging = useRef(false)
  const prevPos  = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })
  const hasDragged = useRef(false)
  const rafMomentum = useRef(0)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  /* Center viewport on world centre on first render */
  useEffect(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    txRef.current = vw / 2 - INIT_X
    tyRef.current = vh / 2 - INIT_Y
    applyTransform()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyTransform() {
    if (worldRef.current) {
      worldRef.current.style.transform = `translate(${txRef.current}px, ${tyRef.current}px)`
    }
  }

  /* ── Momentum loop ────────────────────────────────────────────────────── */
  function startMomentum() {
    cancelAnimationFrame(rafMomentum.current)
    function step() {
      if (dragging.current) return
      velX.current *= 0.93
      velY.current *= 0.93
      if (Math.abs(velX.current) < 0.1 && Math.abs(velY.current) < 0.1) return
      txRef.current += velX.current
      tyRef.current += velY.current
      applyTransform()
      rafMomentum.current = requestAnimationFrame(step)
    }
    rafMomentum.current = requestAnimationFrame(step)
  }

  /* ── Pointer handlers ─────────────────────────────────────────────────── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current   = true
    hasDragged.current = false
    prevPos.current    = { x: e.clientX, y: e.clientY }
    startPos.current   = { x: e.clientX, y: e.clientY }
    velX.current = 0; velY.current = 0
    cancelAnimationFrame(rafMomentum.current)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - prevPos.current.x
    const dy = e.clientY - prevPos.current.y
    if (Math.abs(e.clientX - startPos.current.x) > 4 || Math.abs(e.clientY - startPos.current.y) > 4) {
      hasDragged.current = true
    }
    velX.current = dx; velY.current = dy
    txRef.current += dx; tyRef.current += dy
    prevPos.current = { x: e.clientX, y: e.clientY }
    applyTransform()
  }, [])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    startMomentum()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Hover effects via DOM (no React re-renders) ───────────────────────── */
  function onEnter(id: string, pos: typeof CARDS[0]) {
    const el = cardRefs.current.get(id)
    if (!el) return
    el.style.transform = `translate(-50%,-50%) rotate(${pos.rotate * 0.15}deg) scale(1.1)`
    el.style.zIndex = '30'
    el.style.boxShadow = '0 16px 56px rgba(0,0,0,0.72)'
  }
  function onLeave(id: string, pos: typeof CARDS[0]) {
    const el = cardRefs.current.get(id)
    if (!el) return
    el.style.transform = `translate(-50%,-50%) rotate(${pos.rotate}deg)`
    el.style.zIndex = '1'
    el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.55)'
  }

  const visibleIds = useMemo<Set<string> | null>(() => {
    if (filter === 'All') return null
    return new Set(
      workItems
        .filter(w => filter === 'Sketch' ? w.kind === 'sketch' : w.category === filter)
        .map(w => w.id)
    )
  }, [filter])

  return (
    <div style={{
      width: '100vw', height: '100dvh',
      background: 'oklch(6.5% 0.007 72)',
      overflow: 'hidden', position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Header ── */}
      <header style={{
        flexShrink: 0, height: '3.4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.2rem,3vw,2rem)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', zIndex: 100,
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 400, fontSize: '0.68rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)',
          textDecoration: 'none',
        }}>SECANT</Link>
        <span style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.5rem', letterSpacing: '0.42em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.14)',
        }}>Drag to explore</span>
      </header>

      {/*
        ── Viewport — captures pointer events for panning ────────────────
        Overflow: hidden. The world div inside can extend far beyond.
      */}
      <div
        ref={viewportRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* ── World — all cards live here, translated to pan ── */}
        <div
          ref={worldRef}
          style={{
            position: 'absolute',
            width: `${WW}px`,
            height: `${WH}px`,
            top: 0, left: 0,
            willChange: 'transform',
          }}
        >
          {CARDS.map((pos, i) => {
            const item     = workItems[i]
            const isSketch = item.kind === 'sketch'
            const visible  = !visibleIds || visibleIds.has(item.id)
            const cardW    = isSketch ? 'clamp(110px, 13vw, 185px)' : 'clamp(190px, 22vw, 300px)'

            return (
              <div
                key={item.id}
                ref={(el) => { if (el) cardRefs.current.set(item.id, el); else cardRefs.current.delete(item.id) }}
                style={{
                  position: 'absolute',
                  left: pos.x, top: pos.y,
                  width: cardW,
                  transform: `translate(-50%,-50%) rotate(${pos.rotate}deg)`,
                  opacity: visible ? 1 : 0,
                  pointerEvents: visible ? 'auto' : 'none',
                  transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1)',
                  zIndex: 1,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
                  willChange: 'transform',
                }}
                onClick={() => { if (!hasDragged.current) router.push(`/work/${item.id}`) }}
                onMouseEnter={() => onEnter(item.id, pos)}
                onMouseLeave={() => onLeave(item.id, pos)}
              >
                {/* Float wrapper — CSS animation doesn't conflict with parent rotation */}
                <div style={{
                  animation: `map-float-${pos.floatVariant} ${pos.floatDuration}s ${pos.floatDelay}s ease-in-out infinite`,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    position: 'relative', width: '100%',
                    aspectRatio: isSketch ? '3/4' : '4/3',
                    overflow: 'hidden',
                  }}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      style={{
                        objectFit: 'cover',
                        objectPosition: isSketch ? 'center top' : 'center 30%',
                        pointerEvents: 'none',
                      }}
                      unoptimized
                      sizes="25vw"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Category filters ─────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: '0.85rem clamp(1.2rem,3vw,2rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'oklch(6.5% 0.007 72)',
        position: 'relative', zIndex: 100,
      }}>
        {CATEGORIES.map(({ label, value }) => {
          const isActive = filter === value
          return (
            <button key={value} onClick={() => setFilter(value)} style={{
              fontFamily: 'var(--font-jost), sans-serif',
              fontWeight: isActive ? 400 : 300,
              fontSize: '0.52rem', letterSpacing: '0.3em', textTransform: 'uppercase',
              padding: '0.38rem 0.95rem',
              border: `1px solid ${isActive ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.1)'}`,
              background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.28)',
              cursor: 'pointer',
              transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
            }}>
              {label}
            </button>
          )
        })}
      </div>

      <Navigator />
    </div>
  )
}
