'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { workItems, CATEGORIES } from '@/lib/projects'
import { Navigator } from '@/components/Navigator'

/* Seeded random — identical across renders (no hydration mismatch) */
function sr(n: number) {
  const x = Math.sin(n + 1) * 10000
  return x - Math.floor(x)
}

/*
  7-column grid, generous jitter, seeded per-item for consistency.
  Items are bigger — renders ~19vw, sketches ~12vw.
*/
const COLS   = 7
const AREA_H = 86   /* % of available height used by the card field */

const LAYOUT = (() => {
  const rows = Math.ceil(workItems.length / COLS)
  const cW   = 100 / COLS
  const rH   = AREA_H / rows

  return workItems.map((item, i) => ({
    id:            item.id,
    left:          Math.max(4, Math.min(96, (i % COLS) * cW + cW / 2 + (sr(i*3) - 0.5) * cW * 0.72)),
    top:           Math.max(3, Math.min(94, Math.floor(i/COLS) * rH + rH / 2 + (sr(i*3+1) - 0.5) * rH * 0.82)),
    rotate:        (sr(i*3+2) - 0.5) * 7,
    floatVariant:  (i % 3) + 1,
    floatDuration: 7 + sr(i) * 6,       /* 7–13s — slow, leaf-like */
    floatDelay:    sr(i*2) * 8,
  }))
})()

export default function WorkPage() {
  const [filter, setFilter] = useState('All')
  const router              = useRouter()

  const visibleIds = useMemo<Set<string> | null>(() => {
    if (filter === 'All') return null
    return new Set(
      workItems
        .filter(w => filter === 'Sketch' ? w.kind === 'sketch' : w.category === filter)
        .map(w => w.id)
    )
  }, [filter])

  /* Hover via direct DOM to avoid re-rendering 42 images */
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  function onEnter(id: string, pos: typeof LAYOUT[0]) {
    const el = cardRefs.current.get(id)
    if (!el) return
    el.style.transform = `translate(-50%,-50%) rotate(${pos.rotate * 0.2}deg) scale(1.11)`
    el.style.zIndex    = '30'
    el.style.boxShadow = '0 12px 50px rgba(0,0,0,0.7)'
  }
  function onLeave(id: string, pos: typeof LAYOUT[0]) {
    const el = cardRefs.current.get(id)
    if (!el) return
    el.style.transform = `translate(-50%,-50%) rotate(${pos.rotate}deg)`
    el.style.zIndex    = '1'
    el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.55)'
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
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.16)',
        }}>Selected Work</span>
      </header>

      {/* Floating card map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {workItems.map((item, i) => {
          const pos      = LAYOUT[i]
          const isSketch = item.kind === 'sketch'
          const visible  = !visibleIds || visibleIds.has(item.id)

          /* Bigger cards — renders ~19vw, sketches ~12vw */
          const cardW = isSketch
            ? 'clamp(100px, 12vw, 175px)'
            : 'clamp(170px, 19vw, 265px)'

          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) cardRefs.current.set(item.id, el)
                else    cardRefs.current.delete(item.id)
              }}
              style={{
                position: 'absolute',
                left: `${pos.left}%`, top: `${pos.top}%`,
                width: cardW,
                transform: `translate(-50%,-50%) rotate(${pos.rotate}deg)`,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'auto' : 'none',
                transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)',
                cursor: 'pointer',
                zIndex: 1,
                boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
                willChange: 'transform',
              }}
              onClick={() => router.push(`/work/${item.id}`)}
              onMouseEnter={() => onEnter(item.id, pos)}
              onMouseLeave={() => onLeave(item.id, pos)}
            >
              {/* Float wrapper — animation on inner so it doesn't conflict with rotation */}
              <div style={{
                animation: `map-float-${pos.floatVariant} ${pos.floatDuration}s ${pos.floatDelay}s ease-in-out infinite`,
              }}>
                {/* Image container — aspect-ratio enforces no stretch */}
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
                      /* Offset slightly upward to crop out any title-block at bottom */
                      objectPosition: isSketch ? 'center top' : 'center 30%',
                    }}
                    unoptimized
                    sizes="(max-width:768px) 35vw, 20vw"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Category filters */}
      <div style={{
        flexShrink: 0,
        padding: '0.85rem clamp(1.2rem,3vw,2rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'oklch(6.5% 0.007 72)',
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
