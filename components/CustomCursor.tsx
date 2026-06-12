'use client'

import { useEffect, useRef } from 'react'

/*
  Adaptive crosshair cursor with magnetic snap.

  Cursor colour: mix-blend-mode difference over white (#fff) inverts
  against any background automatically.

  Magnetic effect:
  · When the cursor enters the magnetic radius of any a[href] or button,
    the crosshair is pulled toward the element's centre (CURSOR_PULL).
  · The element itself is translated slightly toward the cursor (EL_PUSH)
    using the CSS individual `translate` property so it never conflicts
    with GSAP `transform` animations.
  · Both snap back with a spring easing when the cursor leaves.
*/

const MAGNET_R    = 90    // px — magnetic field radius
const CURSOR_PULL = 0.30  // 0–1, how strongly cursor is attracted
const EL_PUSH     = 0.30  // 0–1, how far element moves toward cursor

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
    let txTarget = -200, tyTarget = -200
    let initialized = false
    let raf = 0
    let activeEls = new Set<HTMLElement>()

    function getInteractive(): HTMLElement[] {
      return Array.from(document.querySelectorAll<HTMLElement>('a[href], button'))
    }

    function onMove(e: MouseEvent) {
      mx = e.clientX
      my = e.clientY
      if (!initialized) { cx = mx; cy = my; txTarget = mx; tyTarget = my; initialized = true }

      txTarget = mx
      tyTarget = my

      const els = getInteractive()
      const nowActive = new Set<HTMLElement>()

      els.forEach(el => {
        const rect = el.getBoundingClientRect()
        const ecx  = rect.left + rect.width  / 2
        const ecy  = rect.top  + rect.height / 2
        const dist = Math.hypot(mx - ecx, my - ecy)

        if (dist < MAGNET_R && dist > 0) {
          const t    = 1 - dist / MAGNET_R
          const ease = t * t

          /* Pull cursor toward element */
          txTarget += (ecx - mx) * CURSOR_PULL * ease
          tyTarget += (ecy - my) * CURSOR_PULL * ease

          /* Push element toward cursor */
          const dx = (mx - ecx) * EL_PUSH * ease
          const dy = (my - ecy) * EL_PUSH * ease
          el.style.translate        = `${dx}px ${dy}px`
          el.style.transitionProperty    = 'translate'
          el.style.transitionDuration    = '0.06s'
          el.style.transitionTimingFunction = 'linear'
          nowActive.add(el)
        }
      })

      /* Spring elements back when leaving field */
      activeEls.forEach(el => {
        if (!nowActive.has(el)) {
          el.style.translate             = '0px 0px'
          el.style.transitionDuration    = '0.5s'
          el.style.transitionTimingFunction = 'cubic-bezier(0.34,1.56,0.64,1)'
        }
      })
      activeEls = nowActive
    }

    function loop() {
      cx += (txTarget - cx) * 0.16
      cy += (tyTarget - cy) * 0.16
      cursor!.style.transform = `translate(${cx}px, ${cy}px)`
      raf = requestAnimationFrame(loop)
    }

    function onEnter() { inner!.style.transform = 'scale(2.2)' }
    function onLeave() { inner!.style.transform = 'scale(1)' }

    function attachHover() {
      document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }
    attachHover()

    document.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      document.querySelectorAll('a, button').forEach(el => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
      /* Clean up any lingering element translations */
      activeEls.forEach(el => { el.style.translate = ''; el.style.transitionProperty = '' })
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
        mixBlendMode: 'difference',
        color:        '#ffffff',
      }}
      aria-hidden="true"
    >
      <svg
        width={S} height={S}
        viewBox={`0 0 ${S} ${S}`}
        fill="none"
        overflow="visible"
      >
        <line x1={MID} y1={1}            x2={MID} y2={MID-BOX-GAP}  stroke="currentColor" strokeWidth="0.9"/>
        <line x1={MID} y1={MID+BOX+GAP} x2={MID} y2={S-1}           stroke="currentColor" strokeWidth="0.9"/>
        <line x1={1}            y1={MID} x2={MID-BOX-GAP} y2={MID}  stroke="currentColor" strokeWidth="0.9"/>
        <line x1={MID+BOX+GAP} y1={MID} x2={S-1}          y2={MID}  stroke="currentColor" strokeWidth="0.9"/>
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
