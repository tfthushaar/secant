import Image from 'next/image'
import Link from 'next/link'
import { Navigator } from '@/components/Navigator'
import { PageTransition } from '@/components/PageTransition'

export default function StudioPage() {
  const BG   = 'oklch(97.2% 0.006 78)'
  const INK  = 'oklch(8.5% 0.007 72)'
  const SOFT = 'oklch(44% 0.008 75)'
  const LINE = 'oklch(88% 0.006 76)'

  return (
    <PageTransition
      style={{
        minHeight: '100dvh',
        background: BG,
        fontFamily: 'var(--font-sans), sans-serif',
      }}
    >
      {/* Top bar */}
      <header style={{
        height: '3.8rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.5rem,4vw,2.5rem)',
        borderBottom: `1px solid ${LINE}`,
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.35em',
          textTransform: 'uppercase', color: INK, textDecoration: 'none',
          transition: 'opacity 0.2s',
        }}>
          SECANT
        </Link>
      </header>

      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: 'clamp(5rem,10vh,9rem) clamp(1.5rem,6vw,5rem)',
      }}>

        {/* Opening */}
        <div style={{ marginBottom: 'clamp(5rem,10vh,9rem)' }}>
          <h1 style={{
            fontFamily: 'var(--font-display), Georgia, serif',
            fontWeight: 300,
            fontSize: 'clamp(2.6rem, 7vw, 7.5rem)',
            lineHeight: 1.04, letterSpacing: '-0.015em',
            color: INK, maxWidth: '16em',
          }}>
            Architecture<br />
            <span style={{ color: SOFT }}>as discovery.</span>
          </h1>
        </div>

        {/* Two-column */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(3rem,6vw,8rem)', alignItems: 'start',
          paddingTop: 'clamp(3rem,6vh,5rem)',
          borderTop: `1px solid ${LINE}`,
        }}>
          <div>
            <div style={{ fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.42em', textTransform: 'uppercase', color: SOFT, marginBottom: '2rem' }}>
              Studio
            </div>
            {[
              'SECANT was founded in 2003 in Bengaluru with a single conviction: that architecture is a conversation, not a service. Between site and material. Between structure and light. Between what is drawn and what is built.',
              'We work across residential, commercial, and institutional typologies. Each project begins with prolonged observation of the site before a single line is committed to paper.',
              'We are deliberately small. Every project receives the full attention of the founding team, from the first visit to final occupancy.',
            ].map((p, i) => (
              <p key={i} style={{ fontWeight: 300, fontSize: 'clamp(0.84rem,1.1vw,1rem)', lineHeight: 1.88, color: SOFT, maxWidth: '42ch', marginBottom: '1.4rem' }}>
                {p}
              </p>
            ))}
          </div>

          <div>
            <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}>
              <Image src="/assets/web/small/interior-01.jpg" alt="Studio interior" fill className="object-cover" unoptimized />
            </div>
            <div style={{ fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: SOFT, marginTop: '0.75rem' }}>
              Bengaluru · 2024
            </div>
          </div>
        </div>

        {/* Contact */}
        <div id="contact" style={{
          marginTop: 'clamp(6rem,12vh,11rem)',
          paddingTop: 'clamp(3rem,6vh,5rem)',
          borderTop: `1px solid ${LINE}`,
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(3rem,6vw,8rem)', alignItems: 'end',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 300, fontSize: 'clamp(2.2rem,5vw,5rem)', lineHeight: 1.05, letterSpacing: '-0.015em', color: INK, marginBottom: '2rem' }}>
              Begin a project.
            </div>
            <a href="mailto:contact@secant.studio" style={{
              fontWeight: 300, fontSize: 'clamp(0.9rem,1.6vw,1.25rem)',
              letterSpacing: '0.04em', color: INK,
              textDecoration: 'none', transition: 'opacity 0.2s', display: 'inline-block',
            }}>
              contact@secant.studio
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div style={{ fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: SOFT, marginBottom: '0.6rem' }}>Visit</div>
              <address style={{ fontWeight: 300, fontSize: '0.9rem', lineHeight: 1.7, color: SOFT, fontStyle: 'normal' }}>
                Indiranagar, Bengaluru<br />Karnataka 560 038, India
              </address>
            </div>
            <div>
              <div style={{ fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: SOFT, marginBottom: '0.6rem' }}>Commissions</div>
              <p style={{ fontWeight: 300, fontSize: '0.9rem', lineHeight: 1.7, color: SOFT }}>
                Accepting enquiries for projects commencing 2025.
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'clamp(5rem,10vh,8rem)', paddingTop: '2rem', borderTop: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', fontWeight: 300, fontSize: '0.58rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: SOFT }}>
          <span>SECANT Architecture Studio</span>
          <span>© 2024</span>
        </div>
      </div>

      <Navigator />
    </PageTransition>
  )
}
