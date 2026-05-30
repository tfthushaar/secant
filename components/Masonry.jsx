'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import './Masonry.css'

const useMeasure = () => {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, size]
}

function computeColumns(n) {
  if (n <= 2) return 1
  if (n <= 4) return 2
  if (n <= 9) return 3
  return 4
}

const Masonry = ({
  items,
  ease = 'power3.out',
  duration = 0.5,
  stagger = 0.055,
  scaleOnHover = true,
  hoverScale = 0.97,
  blurToFocus = true,
}) => {
  const router = useRouter()
  const [containerRef, { width, height }] = useMeasure()
  const [aspectRatios, setAspectRatios] = useState({})
  const [ready, setReady] = useState(false)
  const hasMounted = useRef(false)
  const itemRefs = useRef({})

  /*
    Fast loading strategy:
    1. Load small thumbnail (item.thumbnailImg) to get aspect ratio — fast
    2. Show layout immediately at thumbnail quality
    3. Swap background-image to full-quality (item.img) as originals arrive
  */
  useEffect(() => {
    if (!items.length) return
    setReady(false)
    hasMounted.current = false

    const ratios = {}
    let pending = items.length

    items.forEach(item => {
      const src = item.thumbnailImg ?? item.img   /* prefer small for measurement */
      const img = new Image()

      const done = () => {
        pending--
        if (pending === 0) {
          setAspectRatios({ ...ratios })
          setReady(true)
        }
      }

      img.onload = () => {
        ratios[item.id] = img.naturalHeight / img.naturalWidth
        done()

        /* Progressive upgrade: swap to full-quality original in background */
        if (item.thumbnailImg && item.img !== item.thumbnailImg) {
          const hq = new Image()
          hq.onload = () => {
            const el = itemRefs.current[item.id]
            if (el) el.style.backgroundImage = `url(${item.img})`
          }
          hq.src = item.img
        }
      }
      img.onerror = () => {
        ratios[item.id] = 0.62   /* default landscape ratio */
        done()
      }
      img.src = src
    })
  }, [items])

  const columns = useMemo(() => computeColumns(items.length), [items.length])

  /*
    Greedy shortest-column placement, then per-column scale so every
    column fills exactly `height` px (no empty space at bottom).
  */
  const grid = useMemo(() => {
    if (!width || !height || !ready) return []

    const colW = width / columns

    /* Assign items to columns (shortest-first greedy) */
    const cols = Array.from({ length: columns }, () => [])
    const colH = new Array(columns).fill(0)

    items.forEach(item => {
      const c = colH.indexOf(Math.min(...colH))
      cols[c].push({ ...item, naturalH: colW * (aspectRatios[item.id] ?? 0.62) })
      colH[c] += colW * (aspectRatios[item.id] ?? 0.62)
    })

    /* Per-column scale → each column height = container height */
    const result = []
    for (let c = 0; c < columns; c++) {
      const scale = colH[c] > 0 ? height / colH[c] : 1
      let y = 0
      cols[c].forEach(item => {
        const h = item.naturalH * scale
        result.push({ ...item, x: colW * c, y, w: colW, h })
        y += h
      })
    }
    return result
  }, [columns, items, width, height, ready, aspectRatios])

  /*
    Pile-up from bottom: items with the largest y (bottom of grid) animate first.
    Sort by y descending → stagger index assigns smallest delay to bottom items.
  */
  useLayoutEffect(() => {
    if (!grid.length || !ready) return

    const ordered = [...grid].sort((a, b) => b.y - a.y)  /* bottom-first */

    grid.forEach(item => {
      const sel = `[data-masonry-key="${item.id}"]`
      const dest = { x: item.x, y: item.y, width: item.w, height: item.h }

      if (!hasMounted.current) {
        const rank = ordered.findIndex(o => o.id === item.id)  /* 0 = bottommost */
        const delay = rank * stagger

        gsap.fromTo(sel,
          {
            opacity: 0,
            x: item.x,
            y: item.y + Math.min(height * 0.6, 500),  /* slide from below viewport */
            width: item.w,
            height: item.h,
            ...(blurToFocus && { filter: 'blur(6px)' }),
          },
          {
            opacity: 1, ...dest,
            ...(blurToFocus && { filter: 'blur(0px)' }),
            duration: 0.85, ease: 'power3.out', delay,
          }
        )
      } else {
        gsap.to(sel, { ...dest, duration, ease, overwrite: 'auto' })
      }
    })

    hasMounted.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, ready])

  const handleMouseEnter = item => {
    if (!scaleOnHover) return
    gsap.to(`[data-masonry-key="${item.id}"]`, { scale: hoverScale, duration: 0.3, ease: 'power2.out' })
  }

  const handleMouseLeave = item => {
    if (!scaleOnHover) return
    gsap.to(`[data-masonry-key="${item.id}"]`, { scale: 1, duration: 0.3, ease: 'power2.out' })
  }

  return (
    <div ref={containerRef} className="masonry-list">
      {grid.map(item => (
        <div
          key={item.id}
          data-masonry-key={item.id}
          className="masonry-item"
          onClick={() => router.push(item.link)}
          onMouseEnter={() => handleMouseEnter(item)}
          onMouseLeave={() => handleMouseLeave(item)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') router.push(item.link) }}
        >
          <div
            ref={el => { if (el) itemRefs.current[item.id] = el }}
            className="masonry-img"
            /* Show thumbnail first, progressively swapped to original */
            style={{ backgroundImage: `url(${item.thumbnailImg ?? item.img})` }}
          >
            <div className="masonry-title">{item.title}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Masonry
