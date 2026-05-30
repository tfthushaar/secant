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

function computeColumns(itemCount) {
  if (itemCount <= 2) return 1
  if (itemCount <= 4) return 2
  if (itemCount <= 9) return 3
  return 4
}

const Masonry = ({
  items,
  ease = 'power3.out',
  duration = 0.55,
  stagger = 0.045,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.97,
  blurToFocus = true,
}) => {
  const router = useRouter()
  const [containerRef, { width, height }] = useMeasure()
  const [aspectRatios, setAspectRatios] = useState({})
  const [ready, setReady] = useState(false)
  const hasMounted = useRef(false)

  /* Measure actual image aspect ratios (h/w) before laying out */
  useEffect(() => {
    if (!items.length) return
    setReady(false)
    hasMounted.current = false
    const ratios = {}
    let pending = items.length

    items.forEach(item => {
      const img = new Image()
      const resolve = () => {
        pending--
        if (pending === 0) {
          setAspectRatios({ ...ratios })
          setReady(true)
        }
      }
      img.onload = () => {
        ratios[item.id] = img.naturalHeight / img.naturalWidth
        resolve()
      }
      img.onerror = () => {
        ratios[item.id] = 0.6 /* default landscape fallback */
        resolve()
      }
      img.src = item.img
    })
  }, [items])

  const columns = useMemo(() => computeColumns(items.length), [items.length])

  /* Build grid: greedy shortest-column + per-column scale so every column
     fills the container height exactly (no empty rows at the bottom).     */
  const grid = useMemo(() => {
    if (!width || !height || !ready) return []

    const colW = width / columns

    /* Natural heights derived from real aspect ratios */
    const withH = items.map(item => ({
      ...item,
      naturalH: colW * (aspectRatios[item.id] ?? 0.6),
    }))

    /* First pass: greedy placement to find each column's natural height */
    const colAssignment = new Array(columns).fill(null).map(() => [])
    const colH1 = new Array(columns).fill(0)

    withH.forEach(item => {
      const col = colH1.indexOf(Math.min(...colH1))
      colAssignment[col].push(item)
      colH1[col] += item.naturalH
    })

    /* Per-column scale so each column fills exactly `height` px */
    const colScales = colH1.map(h => (h > 0 ? height / h : 1))

    /* Second pass: place with scaled heights */
    const result = []
    for (let c = 0; c < columns; c++) {
      const scale = colScales[c]
      const x = colW * c
      let y = 0
      colAssignment[c].forEach(item => {
        const h = item.naturalH * scale
        result.push({ ...item, x, y, w: colW, h })
        y += h
      })
    }

    return result
  }, [columns, items, width, height, ready, aspectRatios])

  /* GSAP: entrance animation on mount, re-layout on resize */
  useLayoutEffect(() => {
    if (!grid.length || !ready) return

    grid.forEach((item, index) => {
      const sel = `[data-masonry-key="${item.id}"]`
      const dest = { x: item.x, y: item.y, width: item.w, height: item.h }

      if (!hasMounted.current) {
        let fromX = item.x
        let fromY = item.y
        if (animateFrom === 'bottom') fromY = item.y + 60
        else if (animateFrom === 'top') fromY = item.y - 60
        else if (animateFrom === 'left') fromX = item.x - 60
        else if (animateFrom === 'right') fromX = item.x + 60

        gsap.fromTo(sel,
          {
            opacity: 0, x: fromX, y: fromY,
            width: item.w, height: item.h,
            ...(blurToFocus && { filter: 'blur(10px)' }),
          },
          {
            opacity: 1, ...dest,
            ...(blurToFocus && { filter: 'blur(0px)' }),
            duration: 0.75, ease: 'power3.out',
            delay: index * stagger,
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
    gsap.to(`[data-masonry-key="${item.id}"]`, {
      scale: hoverScale, duration: 0.3, ease: 'power2.out',
    })
  }

  const handleMouseLeave = item => {
    if (!scaleOnHover) return
    gsap.to(`[data-masonry-key="${item.id}"]`, {
      scale: 1, duration: 0.3, ease: 'power2.out',
    })
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
            className="masonry-img"
            style={{ backgroundImage: `url(${item.img})` }}
          >
            <div className="masonry-title">{item.title}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Masonry
