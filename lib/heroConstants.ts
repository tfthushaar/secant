/* Exact hero positioning — shared between Hero and Loader */

export const HERO_PADDING = {
  top:    'clamp(4.5rem, 8vh, 6rem)',
  left:   'clamp(18px, 3.7vw, 72px)',
  bottom: 'clamp(1.5rem, 3vh, 2.5rem)',
}

export const HERO_FONT = {
  fontFamily:      'var(--font-sans), "Helvetica Neue", Arial, sans-serif',
  fontWeight:      300,
  fontSize:        'clamp(5rem, 14vw, 16rem)',
  lineHeight:      0.88,
  letterSpacing:   '0.06em',
  textTransform:   'uppercase',
  userSelect:      'none',
} as const

/* Helper to compute pixel values from clamp() */
export function computeClamp(min: string, vwValue: string, max: string, vpW: number, vpH: number): number {
  const minPx = parseFloat(min) * (min.includes('rem') ? 16 : 1)
  const maxPx = parseFloat(max) * (max.includes('rem') ? 16 : 1)
  const vwPx  = vpW * parseFloat(vwValue) / 100
  return Math.min(Math.max(minPx, vwPx), maxPx)
}

export function getHeroPaddingPx(vpW: number, vpH: number) {
  return {
    top:  computeClamp('4.5rem', '8', '6rem', vpW, vpH),
    left: computeClamp('18px', '3.7', '72px', vpW, vpH),
  }
}
