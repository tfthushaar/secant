import type { Metadata } from 'next'
import { cormorant, jost } from '@/lib/fonts'
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
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="grain">
        {/* CustomCursor lives in layout so it's present on every page */}
        <CustomCursor />
        {children}
      </body>
    </html>
  )
}
