import Image from 'next/image'
import Link from 'next/link'
import { Navigator } from '@/components/Navigator'
import { PageTransition } from '@/components/PageTransition'
import { ContactForm } from '@/components/ContactForm'

export default function AboutPage() {
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Image
            src="/assets/logo.png"
            alt="SECANT"
            width={120} height={40}
            style={{ height: '4rem', width: 'auto', objectFit: 'contain' }}
            unoptimized
          />
        </Link>
      </header>

      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: 'clamp(5rem,10vh,9rem) clamp(1.5rem,6vw,5rem)',
      }}>

        {/* Opening: Principal Architect + portrait */}
        <div className="studio-2col" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(3rem,6vw,8rem)', alignItems: 'start',
          marginBottom: 'clamp(5rem,10vh,9rem)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 'clamp(2rem,4vh,4rem)' }}>
            <div style={{ fontWeight: 500, fontSize: '0.58rem', letterSpacing: '0.42em', textTransform: 'uppercase', color: INK, marginBottom: '1.2rem' }}>
              Principal Architect
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontWeight: 500,
              fontSize: 'clamp(2.2rem, 5.5vw, 6rem)',
              lineHeight: 1.04, letterSpacing: '-0.015em',
              color: INK, margin: '0 0 clamp(1.5rem,3vh,2.5rem)',
            }}>
              R. H. Rehman
            </h1>
            <p style={{ fontWeight: 500, fontSize: 'clamp(0.84rem,1.1vw,1rem)', lineHeight: 1.88, color: INK, maxWidth: '42ch', marginBottom: '1.4rem' }}>
              Provides the strategic leadership and creative vision that define our firm&apos;s commitment to quality, ensuring that every project is executed with a sophisticated design philosophy and a deep respect for spatial harmony.
            </p>
          </div>

          <div className="portrait-col">
            <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}>
              <Image src="/assets/web/small/rehman-portrait.jpg" alt="R. H. Rehman — Principal Architect" fill style={{ objectFit: 'cover', objectPosition: 'center top' }} unoptimized priority />
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.58rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: INK, marginTop: '0.75rem' }}>
              Secant Architects LLP · Bengaluru
            </div>
          </div>
        </div>

        {/* Team */}
        <div style={{
          marginTop: 'clamp(5rem,10vh,9rem)',
          paddingTop: 'clamp(3rem,6vh,5rem)',
          borderTop: `1px solid ${LINE}`,
        }}>
          <div style={{ fontWeight: 500, fontSize: '0.58rem', letterSpacing: '0.42em', textTransform: 'uppercase', color: INK, marginBottom: '2.5rem' }}>
            Leadership
          </div>

          <div className="studio-2col" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'clamp(2rem,4vw,4rem)',
          }}>
            {[
              {
                name: 'Chetana Shehsan',
                role: 'Architect — Interior Design',
                bio: 'Spearheads our interior design division, specialising in delivering meticulously curated environments that harmonise aesthetic elegance with functional efficiency, tailoring every detail to reflect the unique requirements and aspirations of our clients.',
              },
              {
                name: 'Arun Kumar S',
                role: 'Civil Engineering & Construction',
                bio: 'Oversees our civil engineering and construction operations, bringing a rigorous focus to structural integrity and technical accuracy, while maintaining the disciplined site management necessary for seamless, high-quality project delivery.',
              },
              {
                name: 'Junior Architects',
                role: 'Design Team',
                bio: 'Our dedicated team of junior architects provides fresh perspectives and robust collaborative support, ensuring each project benefits from a fusion of contemporary design thinking and rigorous, detail-oriented execution.',
              },
            ].map(({ name, role, bio }) => (
              <div key={name} style={{ paddingBottom: 'clamp(1.5rem,3vh,2.5rem)', borderBottom: `1px solid ${LINE}` }}>
                <div style={{ fontWeight: 500, fontSize: '0.56rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: INK, marginBottom: '0.55rem' }}>
                  {role}
                </div>
                <div style={{ fontWeight: 600, fontSize: 'clamp(1rem,1.4vw,1.25rem)', color: INK, marginBottom: '0.9rem', letterSpacing: '-0.01em' }}>
                  {name}
                </div>
                <p style={{ fontWeight: 500, fontSize: 'clamp(0.78rem,0.95vw,0.88rem)', lineHeight: 1.8, color: INK, margin: 0 }}>
                  {bio}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Philosophy */}
        <div style={{
          marginTop: 'clamp(5rem,10vh,9rem)',
          paddingTop: 'clamp(3rem,6vh,5rem)',
          borderTop: `1px solid ${LINE}`,
        }}>
          <div style={{ fontWeight: 500, fontSize: '0.58rem', letterSpacing: '0.42em', textTransform: 'uppercase', color: INK, marginBottom: '1rem' }}>
            Philosophy
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), Georgia, serif',
            fontWeight: 500,
            fontSize: 'clamp(1.8rem,4vw,3.8rem)',
            lineHeight: 1.06, letterSpacing: '-0.015em',
            color: INK, margin: '0 0 clamp(3rem,6vh,5rem)',
          }}>
            Modernity meets practicality.
          </h2>

          <div className="studio-2col" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'clamp(2rem,4vw,4rem)',
          }}>
            {[
              {
                title: 'Modern Sophistication',
                body: 'We embrace a contemporary design language characterised by clean lines, structural honesty, and a sophisticated use of materials. Our projects are designed to be timeless, reflecting a modern sensibility that feels both current and enduring.',
              },
              {
                title: 'Built for Purpose',
                body: 'True practicality is the foundation of our work. We prioritise form following function, ensuring that every square foot is optimised for efficiency, usability, and the evolving needs of our clients.',
              },
              {
                title: 'Technically Grounded',
                body: 'We bridge the gap between creative vision and constructibility. By integrating rigorous civil engineering standards with thoughtful interior planning, we deliver projects that are not only visually striking but also structurally sound and easy to maintain.',
              },
              {
                title: 'Human-Centric Spaces',
                body: 'A building is ultimately a vessel for human experience. We design with a deep focus on how people move through, interact with, and thrive within their environments, ensuring our modern structures are inherently practical and comfortable.',
              },
            ].map(({ title, body }, i) => (
              <div key={title} style={{ paddingBottom: 'clamp(1.5rem,3vh,2.5rem)', borderBottom: `1px solid ${LINE}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 500, fontSize: '0.52rem', letterSpacing: '0.3em', color: SOFT }}>0{i + 1}</span>
                  <div style={{ flex: 1, height: '1px', background: LINE }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 'clamp(0.9rem,1.1vw,1rem)', color: INK, marginBottom: '0.8rem', letterSpacing: '-0.005em' }}>
                  {title}
                </div>
                <p style={{ fontWeight: 500, fontSize: 'clamp(0.78rem,0.95vw,0.88rem)', lineHeight: 1.8, color: INK, margin: 0 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div id="contact" style={{
          marginTop: 'clamp(6rem,12vh,11rem)',
          paddingTop: 'clamp(3rem,6vh,5rem)',
          borderTop: `1px solid ${LINE}`,
        }}>
          <div style={{ marginBottom: 'clamp(2.5rem,5vh,4rem)' }}>
            <div style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 500, fontSize: 'clamp(2.2rem,5vw,5rem)', lineHeight: 1.05, letterSpacing: '-0.015em', color: INK }}>
              Begin a project.
            </div>
          </div>

          <div className="studio-2col" style={{
            display: 'grid',
            gridTemplateColumns: '3fr 2fr',
            gap: 'clamp(3rem,6vw,8rem)',
            alignItems: 'start',
          }}>
            <ContactForm />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingTop: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.58rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: INK, marginBottom: '0.6rem' }}>Contact</div>
                <a href="tel:+918079655298" style={{ fontWeight: 500, fontSize: 'clamp(0.9rem,1.4vw,1.1rem)', color: INK, textDecoration: 'none', letterSpacing: '0.02em', display: 'block', marginBottom: '0.25rem' }}>
                  080 79655298
                </a>
                <a href="mailto:rehman@secant.in" style={{ fontWeight: 500, fontSize: 'clamp(0.9rem,1.4vw,1.1rem)', color: INK, textDecoration: 'none', letterSpacing: '0.02em', display: 'block' }}>
                  rehman@secant.in
                </a>
              </div>

              <div>
                <div style={{ fontWeight: 500, fontSize: '0.58rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: INK, marginBottom: '0.6rem' }}>Visit</div>
                <address style={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.8, color: INK, fontStyle: 'normal' }}>
                  535/1/3, 1st Floor, 3rd Main<br />
                  A Block, Rajajinagar 2nd Stage<br />
                  Bangalore 560 010
                </address>
              </div>

            </div>
          </div>
        </div>

        <div style={{ marginTop: 'clamp(5rem,10vh,8rem)', paddingTop: '2rem', borderTop: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', fontWeight: 500, fontSize: '0.58rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: SOFT }}>
          <span>SECANT Architects LLP</span>
          <span>© 2024</span>
        </div>
      </div>

      <Navigator />
    </PageTransition>
  )
}

