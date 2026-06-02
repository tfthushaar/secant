'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useNavigate } from './TransitionBlink'
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
  const { navigate } = useNavigate()
  const [containerRef, { width, height }] = useMeasure()
  const [aspectRatios, setAspectRatios] = useState({})
  const [ready, setReady] = useState(false)
  const hasMounted = useRef(false)
  const imgRefs = useRef({})   /* ref to each .masonry-img div */
  const observerRef = useRef(null)

  /* ── Step 1: measure aspect ratios from thumbnails (fast, small files) ── */
  useEffect(() => {
    if (!items.length) return
    setReady(false)
    hasMounted.current = false

    const ratios = {}
    let pending = items.length

    items.forEach(item => {
      const src = item.thumbnailImg ?? item.img
      const img = new Image()
      img.onload = () => {
        ratios[item.id] = img.naturalHeight / img.naturalWidth
        if (--pending === 0) { setAspectRatios({ ...ratios }); setReady(true) }
      }
      img.onerror = () => {
        ratios[item.id] = 0.62
        if (--pending === 0) { setAspectRatios({ ...ratios }); setReady(true) }
      }
      img.src = src
    })
  }, [items])

  /* ── Step 2: IntersectionObserver — upgrade to original only when visible ── */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const el = entry.target
          const original = el.dataset.original
          if (!original || el.dataset.loaded === '1') return

          const hq = new Image()
          hq.onload = () => { el.style.backgroundImage = `url(${original})` }
          hq.src = original
          el.dataset.loaded = '1'
          observerRef.current?.unobserve(el)
        })
      },
      { rootMargin: '200px' }   /* start loading 200px before card enters view */
    )
    return () => observerRef.current?.disconnect()
  }, [])

  /* Register each image div with the observer whenever grid changes */
  useEffect(() => {
    if (!ready) return
    const obs = observerRef.current
    if (!obs) return
    Object.values(imgRefs.current).forEach(el => { if (el) obs.observe(el) })
  }, [ready, aspectRatios])

  /* Cap at 2 columns on mobile — useMeasure gives us the real container width */
  const maxCols = width > 0 && width <= 768 ? 2 : 4
  const columns = useMemo(
    () => Math.min(computeColumns(items.length), maxCols),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length, maxCols]
  )

  const grid = useMemo(() => {
    if (!width || !height || !ready) return []
    const colW = width / columns
    const cols = Array.from({ length: columns }, () => [])
    const colH = new Array(columns).fill(0)

    items.forEach(item => {
      const c = colH.indexOf(Math.min(...colH))
      cols[c].push({ ...item, naturalH: colW * (aspectRatios[item.id] ?? 0.62) })
      colH[c] += colW * (aspectRatios[item.id] ?? 0.62)
    })

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

  /* Pile-up from bottom entrance */
  useLayoutEffect(() => {
    if (!grid.length || !ready) return
    const ordered = [...grid].sort((a, b) => b.y - a.y)

    grid.forEach(item => {
      const sel = `[data-masonry-key="${item.id}"]`
      const dest = { x: item.x, y: item.y, width: item.w, height: item.h }

      if (!hasMounted.current) {
        const rank = ordered.findIndex(o => o.id === item.id)
        gsap.fromTo(sel,
          {
            opacity: 0, x: item.x,
            y: item.y + Math.min(height * 0.6, 500),
            width: item.w, height: item.h,
            ...(blurToFocus && { filter: 'blur(6px)' }),
          },
          {
            opacity: 1, ...dest,
            ...(blurToFocus && { filter: 'blur(0px)' }),
            duration: 0.85, ease: 'power3.out', delay: rank * stagger,
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
    if (scaleOnHover)
      gsap.to(`[data-masonry-key="${item.id}"]`, { scale: hoverScale, duration: 0.3, ease: 'power2.out' })
  }
  const handleMouseLeave = item => {
    if (scaleOnHover)
      gsap.to(`[data-masonry-key="${item.id}"]`, { scale: 1, duration: 0.3, ease: 'power2.out' })
  }

  return (
    <div ref={containerRef} className="masonry-list">
      {grid.map(item => (
        <div
          key={item.id}
          data-masonry-key={item.id}
          className="masonry-item"
          onClick={() => navigate(item.link)}
          onMouseEnter={() => handleMouseEnter(item)}
          onMouseLeave={() => handleMouseLeave(item)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') navigate(item.link) }}
        >
          <div
            ref={el => { if (el) imgRefs.current[item.id] = el }}
            className="masonry-img"
            /* Show thumbnail immediately — original loads lazily via IntersectionObserver */
            style={{ backgroundImage: `url(${item.thumbnailImg ?? item.img})` }}
            data-original={item.thumbnailImg && item.img !== item.thumbnailImg ? item.img : undefined}
          >
            <div className="masonry-title">{item.title}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Masonry
