'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Navigator } from '@/components/Navigator'
import { CATEGORIES } from '@/lib/projects'

const Globe = dynamic(
  () => import('@/components/Globe').then((m) => m.Globe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center"
        style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-jost)', fontSize: '0.55rem', letterSpacing: '0.45em', textTransform: 'uppercase' }}>
        Loading
      </div>
    ),
  }
)

export default function WorkPage() {
  const filterRef  = useRef('All')
  const [active, setActive] = useState('All')

  function setFilter(val: string) {
    filterRef.current = val
    setActive(val)
  }

  return (
    <div style={{
      width: '100vw', height: '100dvh',
      background: 'oklch(6.5% 0.007 72)',
      overflow: 'hidden', position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Top bar ────────────────────────────────────── */}
      <header style={{
        flexShrink: 0,
        height: '3.6rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.2rem,4vw,2.2rem)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 400, fontSize: '0.68rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
          textDecoration: 'none', transition: 'opacity 0.2s',
        }} className="hover:opacity-60">
          SECANT
        </Link>

        <span style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontWeight: 300, fontSize: '0.52rem', letterSpacing: '0.4em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
        }}>
          Selected Work
        </span>
      </header>

      {/* ── Globe — fills remaining height ─────────────── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <Globe filterRef={filterRef} />
      </div>

      {/* ── Category filters — bottom bar ──────────────── */}
      <div style={{
        flexShrink: 0,
        padding: '1.1rem clamp(1.2rem,4vw,2.2rem)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'oklch(6.5% 0.007 72)',
      }}>
        {CATEGORIES.map(({ label, value }) => {
          const isActive = active === value
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={{
                fontFamily: 'var(--font-jost), sans-serif',
                fontWeight: isActive ? 400 : 300,
                fontSize: '0.54rem',
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                padding: '0.42rem 1.1rem',
                borderRadius: 0,
                border: `1px solid ${isActive ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)'}`,
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.32)',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
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
