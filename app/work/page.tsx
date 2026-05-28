'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { workItems, CATEGORIES } from '@/lib/projects'
import { Navigator } from '@/components/Navigator'

/* Seeded random — consistent positions across renders */
function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

/* Grid distribution with organic jitter.
   7 columns × 6 rows covers all 42 items.
   Each cell has a random offset so it reads as scattered, not gridded. */
const COLS = 7
const CARD_AREA_H = 86  /* % of available height used by cards */

function buildLayout() {
  const n    = workItems.length
  const rows = Math.ceil(n / COLS)
  const cW   = 100 / COLS          /* cell width  % */
  const rH   = CARD_AREA_H / rows  /* cell height % */

  return workItems.map((item, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)

    /* Jitter: ±35% of cell size, seeded from index */
    const left = col * cW + cW / 2 + (sr(i * 3)     - 0.5) * cW * 0.7
    const top  = row * rH + rH / 2 + (sr(i * 3 + 1) - 0.5) * rH * 0.8

    return {
      id:            item.id,
      left:          Math.max(5, Math.min(95, left)),   /* clamp to stay visible */
      top:           Math.max(3, Math.min(95, top)),
      rotate:        (sr(i * 3 + 2) - 0.5) * 7,        /* ±3.5 degrees */
      floatVariant:  (i % 3) + 1,                       /* 1, 2, or 3  */
      floatDuration: 3.5 + sr(i) * 3.5,                 /* 3.5–7s      */
      floatDelay:    sr(i * 2) * 6,                     /* 0–6s delay  */
    }
  })
}

const LAYOUT = buildLayout()  /* computed once at module load */

export default function WorkPage() {
  const [filter, setFilter]     = useState('All')
  const router                  = useRouter()

  /* Track which IDs are visible for the current filter */
  const visibleIds = useMemo<Set<string> | null>(() => {
    if (filter === 'All') return null  /* null = all visible */
    return new Set(
      workItems
        .filter(w => filter === 'Sketch' ? w.kind === 'sketch' : w.category === filter)
        .map(w => w.id)
    )
  }, [filter])

  /* Hover via DOM refs — avoids re-rendering 42 images on every hover */
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  function handleEnter(id: string, pos: (typeof LAYOUT)[0]) {
    const el = cardRefs.current.get(id)
    if (!el) return
    el.style.transform = `translate(-50%,-50%) rotate(${pos.rotate * 0.25}deg) scale(1.13)`
    el.style.zIndex    = '30'
    el.style.filter    = 'brightness(1.08)'
  }

  function handleLeave(id: string, pos: (typeof LAYOUT)[0]) {
    const el = cardRefs.current.get(id)
    if (!el) return
    el.style.transform = `translate(-50%,-50%) rotate(${pos.rotate}deg)`
    el.style.zIndex    = '1'
    el.style.filter    = 'none'
  }

  return (
    <div style={{
      width: '100vw', height: '100dvh',
      background: 'oklch(6.5% 0.007 72)',
      overflow: 'hidden', position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Header ──────────────────────────────────────────── */}
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
          textDecoration: 'none', transition: 'opacity 0.2s',
        }} className="hover:opacity-60">
          SECANT
        </Link>
        <span style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.5rem', letterSpacing: '0.42em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.16)',
        }}>Selected Work</span>
      </header>

      {/* ── Floating card map ────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {workItems.map((item, i) => {
          const pos      = LAYOUT[i]
          const isSketch = item.kind === 'sketch'
          const visible  = !visibleIds || visibleIds.has(item.id)

          /* Renders: landscape 4:3 cards  ~13vw wide
             Sketches: portrait  3:4 cards  ~8vw wide  */
          const cardW    = isSketch ? 'clamp(72px,8vw,120px)' : 'clamp(110px,13vw,185px)'

          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) cardRefs.current.set(item.id, el)
                else    cardRefs.current.delete(item.id)
              }}
              style={{
                position: 'absolute',
                left: `${pos.left}%`,
                top:  `${pos.top}%`,
                width: cardW,
                transform: `translate(-50%,-50%) rotate(${pos.rotate}deg)`,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'auto' : 'none',
                transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1), filter 0.2s',
                cursor: 'pointer',
                zIndex: 1,
                willChange: 'transform, opacity',
              }}
              onClick={() => router.push(`/work/${item.id}`)}
              onMouseEnter={() => handleEnter(item.id, pos)}
              onMouseLeave={() => handleLeave(item.id, pos)}
            >
              {/* Float wrapper — no conflicting transform */}
              <div style={{
                animation: `map-float-${pos.floatVariant} ${pos.floatDuration}s ${pos.floatDelay}s ease-in-out infinite`,
              }}>
                {/* Image */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: isSketch ? '3/4' : '4/3',
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
                }}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    unoptimized
                    sizes="(max-width:768px) 30vw, 14vw"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Category filters ─────────────────────────────────── */}
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
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={{
                fontFamily: 'var(--font-jost), sans-serif',
                fontWeight: isActive ? 400 : 300,
                fontSize: '0.52rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                padding: '0.38rem 0.95rem',
                border: `1px solid ${isActive ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.1)'}`,
                background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.28)',
                cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <Navigator />
    </div>
  )
}
