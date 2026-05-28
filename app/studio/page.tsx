import Image from 'next/image'
import Link from 'next/link'
import { Navigator } from '@/components/Navigator'

export default function StudioPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'oklch(97.2% 0.006 78)',
        fontFamily: 'var(--font-jost), sans-serif',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          height: '3.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 clamp(1.5rem,4vw,2.5rem)',
          borderBottom: '1px solid oklch(88% 0.006 76)',
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 200, fontSize: '0.6rem', letterSpacing: '0.35em',
            textTransform: 'uppercase', color: 'oklch(46% 0.007 74)', textDecoration: 'none',
          }}
        >
          SECANT
        </Link>
      </header>

      <div
        style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: 'clamp(5rem,10vh,9rem) clamp(1.5rem,6vw,5rem)',
        }}
      >

        {/* Opening statement */}
        <div style={{ marginBottom: 'clamp(5rem,10vh,9rem)' }}>
          <h1
            style={{
              fontWeight: 100,
              fontSize: 'clamp(2.6rem, 7vw, 7.5rem)',
              lineHeight: 1.04,
              letterSpacing: '-0.015em',
              color: 'oklch(8.5% 0.007 72)',
              maxWidth: '16em',
            }}
          >
            Architecture
            <br />
            <span style={{ fontWeight: 200, color: 'oklch(46% 0.007 74)' }}>
              as discovery.
            </span>
          </h1>
        </div>

        {/* Two-column content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(3rem,6vw,8rem)',
            alignItems: 'start',
            paddingTop: 'clamp(3rem,6vh,5rem)',
            borderTop: '1px solid oklch(86% 0.006 76)',
          }}
        >
          {/* Left */}
          <div>
            <div
              style={{
                fontWeight: 200, fontSize: '0.58rem', letterSpacing: '0.42em',
                textTransform: 'uppercase', color: 'oklch(60% 0.006 74)', marginBottom: '2rem',
              }}
            >
              Studio
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              {[
                'SECANT was founded in 2003 in Bengaluru with a single conviction: that architecture is a conversation, not a service. Between site and material. Between structure and light. Between what is drawn and what is built.',
                'We work across residential, commercial, and institutional typologies. Each project begins with prolonged observation of the site before a single line is committed to paper.',
                'We are deliberately small. Every project receives the full attention of the founding team, from the first visit to final occupancy.',
              ].map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontWeight: 300,
                    fontSize: 'clamp(0.82rem, 1.05vw, 0.97rem)',
                    lineHeight: 1.88,
                    color: 'oklch(46% 0.007 74)',
                    maxWidth: '42ch',
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Right — image */}
          <div>
            <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}>
              <Image
                src="/assets/web/small/interior-01.jpg"
                alt="Studio interior"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div
              style={{
                fontWeight: 200, fontSize: '0.58rem', letterSpacing: '0.3em',
                textTransform: 'uppercase', color: 'oklch(65% 0.006 74)', marginTop: '0.75rem',
              }}
            >
              Bengaluru · 2024
            </div>
          </div>
        </div>

        {/* Contact block */}
        <div
          id="contact"
          style={{
            marginTop: 'clamp(6rem,12vh,11rem)',
            paddingTop: 'clamp(3rem,6vh,5rem)',
            borderTop: '1px solid oklch(86% 0.006 76)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(3rem,6vw,8rem)',
            alignItems: 'end',
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 100,
                fontSize: 'clamp(2.2rem, 5vw, 5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.015em',
                color: 'oklch(8.5% 0.007 72)',
                marginBottom: '2rem',
              }}
            >
              Begin a project.
            </div>
            <a
              href="mailto:contact@secant.studio"
              style={{
                fontWeight: 200,
                fontSize: 'clamp(0.85rem, 1.5vw, 1.2rem)',
                letterSpacing: '0.04em',
                color: 'oklch(8.5% 0.007 72)',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
                display: 'inline-block',
              }}
              className="hover:opacity-40"
            >
              contact@secant.studio
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div
                style={{
                  fontWeight: 200, fontSize: '0.58rem', letterSpacing: '0.4em',
                  textTransform: 'uppercase', color: 'oklch(60% 0.006 74)', marginBottom: '0.6rem',
                }}
              >
                Visit
              </div>
              <address
                style={{
                  fontWeight: 300, fontSize: '0.9rem', lineHeight: 1.7,
                  color: 'oklch(46% 0.007 74)', fontStyle: 'normal',
                }}
              >
                Indiranagar, Bengaluru<br />
                Karnataka 560 038, India
              </address>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 200, fontSize: '0.58rem', letterSpacing: '0.4em',
                  textTransform: 'uppercase', color: 'oklch(60% 0.006 74)', marginBottom: '0.6rem',
                }}
              >
                Commissions
              </div>
              <p
                style={{
                  fontWeight: 300, fontSize: '0.9rem', lineHeight: 1.7,
                  color: 'oklch(46% 0.007 74)',
                }}
              >
                Accepting enquiries for projects
                <br />commencing 2025.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 'clamp(5rem,10vh,8rem)',
            paddingTop: '2rem',
            borderTop: '1px solid oklch(88% 0.006 76)',
            display: 'flex', justifyContent: 'space-between',
            fontWeight: 200, fontSize: '0.58rem', letterSpacing: '0.35em',
            textTransform: 'uppercase', color: 'oklch(65% 0.006 74)',
          }}
        >
          <span>SECANT Architecture Studio</span>
          <span>© 2024</span>
        </div>
      </div>

      <Navigator />
    </div>
  )
}
