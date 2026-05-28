import { Cormorant, Jost } from 'next/font/google'

/* SECANT wordmark — user-specified Cormorant, medium weight */
export const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  variable: '--font-cormorant',
  display: 'swap',
})

/* UI, labels, body — Jost, weight contrast for hierarchy */
export const jost = Jost({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500'],
  variable: '--font-jost',
  display: 'swap',
})
