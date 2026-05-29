'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { workItems, CATEGORIES } from '@/lib/projects'
import { Navigator } from '@/components/Navigator'

/* ── Grid constants ────────────────────────────────────────────────────────
   3 columns × many rows. 6 cards visible at once (3×2).
   No rotation, equidistant gaps, looped vertically.
   Card aspect 4:3 for renders / 3:4 for sketches.
──────────────────────────────────────────────────────────────────────────── */
const COLS    = 3
const CARD_W  = 400          /* px — render card width  */
const CARD_H  = Math.round(CARD_W * 3 / 4)   /* 300px */
const GAP_X   = 52
const GAP_Y   = 52

const ROWS    = Math.ceil(workItems.length / COLS)   /* 14 */
const LOOP_H  = ROWS * (CARD_H + GAP_Y)              /* height of one complete loop */

/* Seeded random for float delays — stable across renders */
function sr(n: number) { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x) }

export default function WorkPage() {
  const [filter, setFilter]  = useState('All')
  const router = useRouter()

  /* ── Pan state ──────────────────────────────────────────────────────────── */
  const worldRef    = useRef<HTMLDivElement>(null)
  const tyRef       = useRef(0)         /* accumulated vertical pan  */
  const velY        = useRef(0)
  const isDragging  = useRef(false)
  const hasDragged  = useRef(false)
  const prevY       = useRef(0)
  const startY      = useRef(0)
  const rafMom      = useRef(0)
  const cardRefs    = useRef<Map<string, HTMLDivElement>>(new Map())

  /* Normalise ty so the loop is seamless: wrap into [0, -LOOP_H) */
  function normTy(raw: number) {
    return (((raw % LOOP_H) - LOOP_H) % LOOP_H)
  }

  function applyTransform() {
    if (worldRef.current) {
      worldRef.current.style.transform = `translateY(${normTy(tyRef.current)}px)`
    }
  }

  /* Momentum loop */
  function startMomentum() {
    cancelAnimationFrame(rafMom.current)
    const step = () => {
      if (isDragging.current) return
      velY.current *= 0.92
      if (Math.abs(velY.current) < 0.2) return
      tyRef.current += velY.current
      applyTransform()
      rafMom.current = requestAnimationFrame(step)
    }
    rafMom.current = requestAnimationFrame(step)
  }

  /* ── Pointer handlers ─────────────────────────────────────────────────── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current  = true
    hasDragged.current  = false
    prevY.current  = e.clientY
    startY.current = e.clientY
    velY.current   = 0
    cancelAnimationFrame(rafMom.current)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    if (Math.abs(e.clientY - startY.current) > 4) hasDragged.current = true
    const dy = e.clientY - prevY.current
    velY.current  = dy
    tyRef.current += dy
    prevY.current  = e.clientY
    applyTransform()
  }, [])

  const onPointerUp = useCallback(() => {
    isDragging.current = false
    startMomentum()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Hover via direct DOM */
  function onEnter(id: string) {
    const el = cardRefs.current.get(id)
    if (el) { el.style.transform = 'scale(1.05)'; el.style.zIndex = '20'; el.style.boxShadow = '0 14px 48px rgba(0,0,0,0.72)' }
  }
  function onLeave(id: string) {
    const el = cardRefs.current.get(id)
    if (el) { el.style.transform = 'scale(1)';    el.style.zIndex = '1';  el.style.boxShadow = '0 4px 22px rgba(0,0,0,0.55)' }
  }

  const visibleIds = useMemo<Set<string> | null>(() => {
    if (filter === 'All') return null
    return new Set(
      workItems.filter(w => filter === 'Sketch' ? w.kind === 'sketch' : w.category === filter).map(w => w.id)
    )
  }, [filter])

  /* ── The cards — rendered TWICE for seamless loop ───────────────────────
     Copy 1: y offsets 0 … LOOP_H
     Copy 2: y offsets LOOP_H … 2×LOOP_H  (identical, immediately below)  */
  function renderCopy(copyIndex: number) {
    const yBase = copyIndex * LOOP_H
    return workItems.map((item, i) => {
      const col      = i % COLS
      const row      = Math.floor(i / COLS)
      const isSketch = item.kind === 'sketch'
      const visible  = !visibleIds || visibleIds.has(item.id)

      /* Exact grid position — no jitter, all equidistant */
      const cardY = yBase + row * (CARD_H + GAP_Y) + GAP_Y / 2

      /* Float animation — faster than before (3-5s) */
      const floatVariant  = (i % 3) + 1
      const floatDuration = 3 + sr(i) * 2       /* 3–5 s   */
      const floatDelay    = sr(i * 2) * 4        /* 0–4 s   */

      return (
        <div
          key={`c${copyIndex}-${item.id}`}
          ref={(el) => {
            if (copyIndex === 0) {
              if (el) cardRefs.current.set(item.id, el)
              else    cardRefs.current.delete(item.id)
            }
          }}
          style={{
            position: 'absolute',
            top: cardY,
            /* Horizontal centering is handled by the world width + grid calc */
            left: `calc(50% + ${(col - 1) * (CARD_W + GAP_X)}px - ${CARD_W / 2}px)`,
            width: CARD_W,
            opacity: visible ? 1 : 0,
            pointerEvents: visible ? 'auto' : 'none',
            transition: 'opacity 0.3s cubic-bezier(0.16,1,0.3,1), transform 0.22s cubic-bezier(0.16,1,0.3,1)',
            zIndex: 1,
            boxShadow: '0 4px 22px rgba(0,0,0,0.55)',
            cursor: 'pointer',
            willChange: 'transform',
          }}
          onClick={() => { if (!hasDragged.current) router.push(`/work/${item.id}`) }}
          onMouseEnter={() => onEnter(item.id)}
          onMouseLeave={() => onLeave(item.id)}
        >
          {/* Float wrapper — animation runs on inner div, transform on outer */}
          <div style={{
            animation: `map-float-${floatVariant} ${floatDuration}s ${floatDelay}s ease-in-out infinite`,
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
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
                sizes="400px"
              />
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <div style={{
      width: '100vw', height: '100dvh',
      background: 'oklch(6.5% 0.007 72)',
      overflow: 'hidden', position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header */}
      <header style={{
        flexShrink: 0, height: '3.4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.2rem,3vw,2rem)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        zIndex: 100,
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
        }}>Scroll to explore</span>
      </header>

      {/* Viewport */}
      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* World — 2× LOOP_H tall, transforms only in Y */}
        <div
          ref={worldRef}
          style={{
            position: 'absolute',
            width: '100%',
            height: LOOP_H * 2,
            top: 0, left: 0,
            willChange: 'transform',
          }}
        >
          {/* Two copies for seamless infinite loop */}
          {renderCopy(0)}
          {renderCopy(1)}
        </div>
      </div>

      {/* Category filters */}
      <div style={{
        flexShrink: 0,
        padding: '0.85rem clamp(1.2rem,3vw,2rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'oklch(6.5% 0.007 72)',
        zIndex: 100,
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
