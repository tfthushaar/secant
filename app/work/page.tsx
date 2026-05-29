'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { workItems, CATEGORIES } from '@/lib/projects'
import { Navigator } from '@/components/Navigator'

/*
  ── PLUS-CANVAS DESIGN ──────────────────────────────────────────────────────
  Virtual grid of cells arranged so the viewport always shows:
    • 1 CENTER card (fully visible)
    • 4 ARM cards at N / S / E / W (mostly visible, slight bleed at edges)
    • 4 DIAGONAL PEEK cards at NE / NW / SE / SW (corner snippets)

  Dragging in ANY direction shifts the grid; a new card slides to the center
  and a new plus alignment forms. Infinite loop via modular wrapping.

  Grid layout:
    CELL_W = 400   →  LEFT/RIGHT arm centers at ±400 from viewport center
    CELL_H = 300   →  TOP/BOTTOM arm centers at ±300 from viewport center

  Card: 360×270 (4:3 landscape). 40px gap around each card.
  ────────────────────────────────────────────────────────────────────────── */

const COLS   = 7    /* must be odd so center column exists */
const ROWS   = 7
const CELL_W = 400
const CELL_H = 300
const CARD_W = 360
const CARD_H = 270

const WORLD_W = COLS * CELL_W   /* 2800 */
const WORLD_H = ROWS * CELL_H   /* 2100 */

/* Seeded random — stable across renders */
function sr(n: number) { const x = Math.sin(n + 1) * 1e4; return x - Math.floor(x) }

/* ── Assign workItems to grid positions ────────────────────────────────────
   Cells are assigned in a Z-order that places the most important cards near
   the center so they're visible first (indices near the grid center get the
   first workItems).                                                          */
function buildGrid() {
  const cx = Math.floor(COLS / 2)
  const cy = Math.floor(ROWS / 2)
  /* Sort cell indices by Manhattan distance from center */
  const cells: Array<{ col: number; row: number }> = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cells.push({ col: c, row: r })
  cells.sort((a, b) => {
    const dA = Math.abs(a.col - cx) + Math.abs(a.row - cy)
    const dB = Math.abs(b.col - cx) + Math.abs(b.row - cy)
    return dA - dB
  })
  return cells.slice(0, workItems.length).map((cell, i) => ({
    item: workItems[i],
    worldX: cell.col * CELL_W + CELL_W / 2,
    worldY: cell.row * CELL_H + CELL_H / 2,
    floatVariant: (i % 3) + 1,
    floatDuration: 3 + sr(i) * 2,
    floatDelay:    sr(i * 2) * 4,
  }))
}
const GRID = buildGrid()

/* Initial offset: viewport center aligned to world center */
const INIT_TX = -(WORLD_W / 2)   /* will be offset by viewport width/2 on mount */
const INIT_TY = -(WORLD_H / 2)

export default function WorkPage() {
  const [filter, setFilter] = useState('All')
  const router = useRouter()

  /* ── Pan state ─────────────────────────────────────────────────────────── */
  const worldRef   = useRef<HTMLDivElement>(null)
  const txRef      = useRef(0)
  const tyRef      = useRef(0)
  const velX       = useRef(0)
  const velY       = useRef(0)
  const dragging   = useRef(false)
  const hasDragged = useRef(false)
  const prevPos    = useRef({ x: 0, y: 0 })
  const startPos   = useRef({ x: 0, y: 0 })
  const rafMom     = useRef(0)
  const rafDrift   = useRef(0)
  const cardEls    = useRef<Map<string, HTMLDivElement>>(new Map())

  /* Modular offset: wraps the world so the canvas loops infinitely */
  function normX(tx: number) { return ((tx % WORLD_W) - WORLD_W) % WORLD_W }
  function normY(ty: number) { return ((ty % WORLD_H) - WORLD_H) % WORLD_H }

  function applyTransform() {
    if (!worldRef.current) return
    worldRef.current.style.transform =
      `translate(${normX(txRef.current)}px, ${normY(tyRef.current)}px)`
  }

  /* Centre on world centre on first paint */
  useEffect(() => {
    const vw = window.innerWidth, vh = window.innerHeight
    txRef.current = vw / 2 - WORLD_W / 2
    tyRef.current = vh / 2 - WORLD_H / 2
    applyTransform()

    /* Ambient drift — slow gentle sinusoidal movement when not dragging */
    let t = 0
    const drift = () => {
      if (!dragging.current) {
        t += 0.004
        txRef.current += Math.sin(t * 0.7) * 0.18
        tyRef.current += Math.sin(t * 0.5) * 0.12
        applyTransform()
      }
      rafDrift.current = requestAnimationFrame(drift)
    }
    rafDrift.current = requestAnimationFrame(drift)

    return () => {
      cancelAnimationFrame(rafDrift.current)
      cancelAnimationFrame(rafMom.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Momentum after release */
  function startMomentum() {
    cancelAnimationFrame(rafMom.current)
    const step = () => {
      if (dragging.current) return
      velX.current *= 0.91
      velY.current *= 0.91
      if (Math.abs(velX.current) < 0.1 && Math.abs(velY.current) < 0.1) return
      txRef.current += velX.current
      tyRef.current += velY.current
      applyTransform()
      rafMom.current = requestAnimationFrame(step)
    }
    rafMom.current = requestAnimationFrame(step)
  }

  /* ── Pointer handlers ──────────────────────────────────────────────────── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current   = true
    hasDragged.current = false
    prevPos.current    = { x: e.clientX, y: e.clientY }
    startPos.current   = { x: e.clientX, y: e.clientY }
    velX.current = 0; velY.current = 0
    cancelAnimationFrame(rafMom.current)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - prevPos.current.x
    const dy = e.clientY - prevPos.current.y
    if (Math.abs(e.clientX - startPos.current.x) > 4 ||
        Math.abs(e.clientY - startPos.current.y) > 4) hasDragged.current = true
    velX.current = dx; velY.current = dy
    txRef.current += dx; tyRef.current += dy
    prevPos.current = { x: e.clientX, y: e.clientY }
    applyTransform()
  }, [])

  const onPointerUp = useCallback(() => {
    dragging.current = false; startMomentum()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Hover via direct DOM ──────────────────────────────────────────────── */
  function onEnter(id: string) {
    const el = cardEls.current.get(id)
    if (el) { el.style.transform = 'scale(1.06)'; el.style.zIndex = '20'; el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.72)' }
  }
  function onLeave(id: string) {
    const el = cardEls.current.get(id)
    if (el) { el.style.transform = ''; el.style.zIndex = '1'; el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.55)' }
  }

  /* ── Category filter ───────────────────────────────────────────────────── */
  const visibleIds = useMemo<Set<string> | null>(() => {
    if (filter === 'All') return null
    return new Set(
      workItems.filter(w => filter === 'Sketch' ? w.kind === 'sketch' : w.category === filter).map(w => w.id)
    )
  }, [filter])

  /*
    The world div is WORLD_W × WORLD_H.
    We render 2×2 copies of the world (4 total) so the loop is seamless in
    all directions without mod-jump artefacts.
    Cards inside each copy are at absolute positions within the copy.
  */
  function renderCopy(offX: number, offY: number, copyKey: string) {
    return GRID.map((entry, i) => {
      const { item, worldX, worldY, floatVariant, floatDuration, floatDelay } = entry
      const visible = !visibleIds || visibleIds.has(item.id)
      const isSketch = item.kind === 'sketch'

      return (
        <div
          key={`${copyKey}-${item.id}`}
          ref={(el) => {
            /* Only track the primary copy (offX=0,offY=0) for hover */
            if (offX === 0 && offY === 0) {
              if (el) cardEls.current.set(item.id, el)
              else    cardEls.current.delete(item.id)
            }
          }}
          style={{
            position: 'absolute',
            left: offX + worldX - CARD_W / 2,
            top:  offY + worldY - CARD_H / 2,
            width:  CARD_W,
            height: isSketch ? CARD_W * 4 / 3 : CARD_H,
            opacity: visible ? 1 : 0,
            pointerEvents: visible ? 'auto' : 'none',
            transition: 'opacity 0.3s, transform 0.22s cubic-bezier(0.16,1,0.3,1)',
            zIndex: 1,
            boxShadow: '0 4px 20px rgba(0,0,0,0.55)',
            cursor: 'pointer',
            willChange: 'transform',
          }}
          onClick={() => { if (!hasDragged.current) router.push(`/work/${item.id}`) }}
          onMouseEnter={() => onEnter(item.id)}
          onMouseLeave={() => onLeave(item.id)}
        >
          {/* Float wrapper */}
          <div style={{
            width: '100%', height: '100%',
            animation: `map-float-${floatVariant} ${floatDuration}s ${floatDelay}s ease-in-out infinite`,
          }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
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
                sizes="360px"
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

      {/* Viewport — captures pointer events */}
      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/*
          World container — 2×2 copies tiled so dragging in any direction
          seamlessly loops. Total rendered area: 2×WORLD_W × 2×WORLD_H.
          The transform.normX/normY keeps the viewport in the first copy's
          negative space, and the second copy fills in the gap seamlessly.
        */}
        <div
          ref={worldRef}
          style={{
            position: 'absolute',
            width:  WORLD_W * 2,
            height: WORLD_H * 2,
            top: 0, left: 0,
            willChange: 'transform',
          }}
        >
          {renderCopy(0,        0,        'A')}
          {renderCopy(WORLD_W,  0,        'B')}
          {renderCopy(0,        WORLD_H,  'C')}
          {renderCopy(WORLD_W,  WORLD_H,  'D')}
        </div>

        {/* Hint overlay — fades after first drag */}
        <div style={{
          position: 'absolute', bottom: '1rem', left: '50%',
          transform: 'translateX(-50%)', pointerEvents: 'none',
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.52rem',
          letterSpacing: '0.38em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.18)',
          whiteSpace: 'nowrap',
        }}>
          Drag in any direction
        </div>
      </div>

      {/* Category filters */}
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
