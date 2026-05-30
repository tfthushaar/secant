import type { Metadata } from 'next'
import { ebGaramond, raleway } from '@/lib/fonts'
import { CustomCursor } from '@/components/CustomCursor'
import './globals.css'

export const metadata: Metadata = {
  title: 'SECANT — Architecture Studio',
  description: 'Architecture at the intersection of intention and material. Bengaluru.',
  openGraph: {
    title: 'SECANT — Architecture Studio',
    description: 'Architecture at the intersection of intention and material.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ebGaramond.variable} ${raleway.variable}`}>
      <head>
        {/*
          Preload the 3D model — browser starts the 26 MB download immediately
          when the HTML is parsed, before any JavaScript runs. This means the
          GLB is fetching in parallel with the loader animation instead of
          waiting for Three.js to bootstrap first (~500ms saved on average).
        */}
        <link rel="preload" href="/assets/base.glb" as="fetch" crossOrigin="anonymous" />
        {/* Warm TCP connections for DRACO decoder CDN and fonts */}
        <link rel="preconnect" href="https://www.gstatic.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="grain">
        <CustomCursor />
        {children}
      </body>
    </html>
  )
}
