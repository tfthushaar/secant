'use client'

import Link from 'next/link'
import Image from 'next/image'

/* Top-left logo: links home */
export function Navigation() {
  return (
    <header
      className="fixed top-0 left-0 z-[100] flex items-center"
      style={{ height: '3.8rem', paddingLeft: 'clamp(1.2rem, 3vw, 2rem)' }}
    >
      <Link href="/" aria-label="SECANT — Home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <Image
          src="/assets/logo.png"
          alt="SECANT Architects & Interior Designers"
          width={120}
          height={40}
          style={{ height: '2.2rem', width: 'auto', objectFit: 'contain' }}
          priority
          unoptimized
        />
      </Link>
    </header>
  )
}
