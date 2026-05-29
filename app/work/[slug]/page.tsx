import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { workItems } from '@/lib/projects'
import { Navigator } from '@/components/Navigator'

export function generateStaticParams() {
  return workItems.map((item) => ({ slug: item.id }))
}

interface Props { params: Promise<{ slug: string }> }

export default async function WorkItemPage({ params }: Props) {
  const { slug } = await params
  const idx      = workItems.findIndex((w) => w.id === slug)
  if (idx === -1) notFound()

  const item     = workItems[idx]
  const prev     = workItems[(idx - 1 + workItems.length) % workItems.length]
  const next     = workItems[(idx + 1) % workItems.length]
  const isSketch = item.kind === 'sketch'

  const BG     = 'oklch(97.2% 0.006 78)'
  const INK    = 'oklch(8.5% 0.007 72)'
  const SOFT   = 'oklch(46% 0.007 74)'
  const FAINT  = 'oklch(62% 0.006 74)'
  const LINE   = 'oklch(88% 0.006 76)'

  return (
    <div style={{
      minHeight: '100dvh', background: BG,
      fontFamily: 'var(--font-jost), sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Minimal top bar ── */}
      <header style={{
        flexShrink: 0,
        height: '3.2rem',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(1.2rem,4vw,2.5rem)',
        borderBottom: `1px solid ${LINE}`,
        background: BG,
      }}>
        <Link href="/work" style={{
          fontWeight: 300, fontSize: '0.6rem', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: SOFT,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem',
          transition: 'opacity 0.2s',
        }}>
          <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
            <line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
            <polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
          </svg>
          Work
        </Link>
      </header>

      {/*
        ── Main: two columns
           Left (38%): meta + title + description + navigation
           Right (62%): single image, full quality, contain (no crop)
      */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '38fr 62fr',
        minHeight: 0,
      }}>

        {/* ── Left: details ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(2.5rem,5vh,4.5rem) clamp(1.5rem,4vw,3.5rem)',
          borderRight: `1px solid ${LINE}`,
        }}>

          {/* Top: badges + title */}
          <div>
            {/* Category + kind badges */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>
              {[item.category, isSketch ? 'Sketch' : 'Render'].map((label) => (
                <span key={label} style={{
                  fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.35em',
                  textTransform: 'uppercase', color: FAINT,
                  border: `1px solid ${LINE}`, padding: '0.28rem 0.7rem',
                }}>
                  {label}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontWeight: 400,
              fontSize: 'clamp(2.4rem, 4.5vw, 5rem)',
              lineHeight: 1.0,
              letterSpacing: '-0.005em',
              color: INK,
              margin: 0,
            }}>
              {item.title}
            </h1>

            {/* Counter */}
            <div style={{
              fontWeight: 300, fontSize: '0.54rem', letterSpacing: '0.35em',
              color: FAINT, marginTop: '1.8rem',
            }}>
              {String(idx + 1).padStart(2, '0')} / {String(workItems.length).padStart(2, '0')}
            </div>
          </div>

          {/* Bottom: prev / next navigation */}
          <div style={{
            paddingTop: '2rem',
            borderTop: `1px solid ${LINE}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.4rem',
          }}>
            <Link href={`/work/${prev.id}`} style={{
              fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.28em',
              textTransform: 'uppercase', color: SOFT,
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '0.7rem',
              transition: 'opacity 0.2s',
            }}>
              <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
                <line x1="14" y1="3.5" x2="0" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
                <polyline points="4,1 1,3.5 4,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
              </svg>
              {prev.title}
            </Link>
            <Link href={`/work/${next.id}`} style={{
              fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.28em',
              textTransform: 'uppercase', color: SOFT,
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '0.7rem',
              transition: 'opacity 0.2s',
            }}>
              {next.title}
              <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
                <line x1="0" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="0.8"/>
                <polyline points="10,1 13,3.5 10,6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
              </svg>
            </Link>
          </div>

        </div>

        {/* ── Right: full-quality image, contain (no crop) ── */}
        <div style={{
          position: 'relative',
          background: BG,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(1.5rem,3vh,2.5rem)',
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}>
            <Image
              src={item.image}
              alt={item.title}
              fill
              style={{
                objectFit: 'contain',        /* show 100% of image, no crop */
                objectPosition: 'center',
              }}
              priority
              unoptimized
              sizes="62vw"
            />
          </div>
        </div>

      </div>

      <Navigator />
    </div>
  )
}
