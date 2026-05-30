'use client'

import { useEffect, useRef } from 'react'

/*
  Adaptive crosshair cursor — white on dark backgrounds, black on light.
  Uses CSS mix-blend-mode: difference with a white (#fff) cursor.
  Over black  → white   (255 difference 0   = 255)
  Over white  → black   (255 difference 255 = 0)
  Over mid-gray → inverted gray
  Works across all pages without needing to know the current background.
*/
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const innerRef  = useRef<SVGGElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const inner  = innerRef.current
    if (!cursor || !inner) return

    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!mq.matches) return

    let mx = -200, my = -200
    let cx = -200, cy = -200
    let initialized = false
    let raf = 0

    function onMove(e: MouseEvent) {
      mx = e.clientX; my = e.clientY
      if (!initialized) { cx = mx; cy = my; initialized = true }
    }

    function loop() {
      cx += (mx - cx) * 0.16
      cy += (my - cy) * 0.16
      cursor!.style.transform = `translate(${cx}px, ${cy}px)`
      raf = requestAnimationFrame(loop)
    }

    function onEnter() { inner!.style.transform = 'scale(2.2)' }
    function onLeave() { inner!.style.transform = 'scale(1)' }

    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    document.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      document.querySelectorAll('a, button').forEach((el) => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  const ARM  = 10
  const BOX  = 3.5
  const GAP  = 3
  const S    = (ARM + GAP + BOX) * 2 + 2
  const MID  = S / 2

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      style={{
        transform:    'translate(-200px, -200px)',
        marginLeft:   -MID,
        marginTop:    -MID,
        /* mix-blend-mode: difference — adapts cursor color to background */
        mixBlendMode: 'difference',
        color:        '#ffffff',  /* white inverts over light backgrounds */
      }}
      aria-hidden="true"
    >
      <svg
        width={S} height={S}
        viewBox={`0 0 ${S} ${S}`}
        fill="none"
        overflow="visible"
      >
        {/* Top arm */}
        <line x1={MID} y1={1}               x2={MID} y2={MID-BOX-GAP}   stroke="currentColor" strokeWidth="0.9"/>
        {/* Bottom arm */}
        <line x1={MID} y1={MID+BOX+GAP}    x2={MID} y2={S-1}            stroke="currentColor" strokeWidth="0.9"/>
        {/* Left arm */}
        <line x1={1}               y1={MID} x2={MID-BOX-GAP} y2={MID}   stroke="currentColor" strokeWidth="0.9"/>
        {/* Right arm */}
        <line x1={MID+BOX+GAP}    y1={MID} x2={S-1}          y2={MID}   stroke="currentColor" strokeWidth="0.9"/>
        {/* Centre square — scales on hover */}
        <g
          ref={innerRef}
          style={{
            transformOrigin: `${MID}px ${MID}px`,
            transition:      'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <rect
            x={MID-BOX} y={MID-BOX}
            width={BOX*2} height={BOX*2}
            stroke="currentColor" strokeWidth="0.9" fill="none"
          />
        </g>
      </svg>
    </div>
  )
}
